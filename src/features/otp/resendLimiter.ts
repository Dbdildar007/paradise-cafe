import { secureStorage } from '../../security/secureStorage';
import { MAX_SENDS_PER_WINDOW, OTP_POLICY } from './otpPolicy';

type Entry = { windowStart: number; sends: number; cooldownUntil: number };
type Table = Record<string, Entry>;

export type LimiterStatus = {
  sends: number;
  resendsLeft: number;
  blocked: boolean;
  /** When the current window expires (blocked users can retry then). */
  windowEndsAt: number;
  retryAfterMs: number;
  cooldownUntil: number;
};

export interface LimiterStore {
  read(): Promise<string | null>;
  write(value: string): Promise<unknown>;
}

/** Default store: hardware-backed Keychain/Keystore (never AsyncStorage). */
export const secureLimiterStore: LimiterStore = {
  read: () => secureStorage.getItem('otp_limiter'),
  write: v => secureStorage.setItem('otp_limiter', v),
};

const MAX_TRACKED_NUMBERS = 20;

/**
 * Client-side guard: max 3 resends (4 sends total) per phone per rolling 5 h window + a 60 s cooldown between sends.
 * It survives app restarts. It is a UX guard; the authoritative limit is enforced server-side (otp-guard Edge Function).
 */
export class ResendLimiter {
  constructor(
    private readonly store: LimiterStore = secureLimiterStore,
    private readonly now: () => number = Date.now,
  ) {}

  private async load(): Promise<Table> {
    try {
      const raw = await this.store.read();
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
      }
      const table: Table = {};
      for (const [k, v] of Object.entries(parsed as Record<string, Partial<Entry>>)) {
        if (typeof v?.windowStart === 'number' && typeof v.sends === 'number' && typeof v.cooldownUntil === 'number') {
          table[k] = { windowStart: v.windowStart, sends: v.sends, cooldownUntil: v.cooldownUntil };
        }
      }
      return table;
    } catch {
      return {}; // corrupt storage must never lock the user out
    }
  }

  private async save(table: Table): Promise<void> {
    const t = this.now();
    const live = Object.entries(table)
      .filter(([, e]) => t < e.windowStart + OTP_POLICY.windowMs)
      .sort((a, b) => b[1].windowStart - a[1].windowStart)
      .slice(0, MAX_TRACKED_NUMBERS);
    await this.store.write(JSON.stringify(Object.fromEntries(live)));
  }

  private toStatus(entry: Entry | undefined): LimiterStatus {
    const t = this.now();
    const live = entry && t < entry.windowStart + OTP_POLICY.windowMs ? entry : undefined;
    const sends = live?.sends ?? 0;
    const windowEndsAt = live ? live.windowStart + OTP_POLICY.windowMs : 0;
    const blocked = sends >= MAX_SENDS_PER_WINDOW;
    return {
      sends,
      resendsLeft: Math.max(0, OTP_POLICY.maxResends - Math.max(0, sends - 1)),
      blocked,
      windowEndsAt,
      retryAfterMs: blocked ? Math.max(0, windowEndsAt - t) : 0,
      cooldownUntil: live?.cooldownUntil ?? 0,
    };
  }

  async status(phoneE164: string): Promise<LimiterStatus> {
    const table = await this.load();
    return this.toStatus(table[phoneE164]);
  }

  /** Call right before asking Firebase to send an SMS. */
  async recordSend(phoneE164: string): Promise<LimiterStatus> {
    const table = await this.load();
    const t = this.now();
    const prev = table[phoneE164];
    const live = prev && t < prev.windowStart + OTP_POLICY.windowMs ? prev : undefined;
    table[phoneE164] = {
      windowStart: live?.windowStart ?? t,
      sends: (live?.sends ?? 0) + 1,
      cooldownUntil: t + OTP_POLICY.cooldownSeconds * 1000,
    };
    await this.save(table);
    return this.toStatus(table[phoneE164]);
  }

  /**
   * After a successful login only the cooldown is cleared; the send counter stays until the window ends so that
   * logging in/out repeatedly cannot be used to bypass the cap.
   */
  async clearCooldown(phoneE164: string): Promise<void> {
    const table = await this.load();
    const e = table[phoneE164];
    if (e) {
      e.cooldownUntil = 0;
      await this.save(table);
    }
  }
}
