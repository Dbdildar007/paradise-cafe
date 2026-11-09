import JailMonkey from 'jail-monkey';

export type IntegrityReport = {
  compromised: boolean;
  reasons: Array<'rooted_or_jailbroken' | 'hooked' | 'debugger_attached' | 'mock_location'>;
};

/** Runtime root / jailbreak / hooking (Frida, Xposed) / debugger checks. Fail-closed: if a check throws, the device is treated as compromised. */
export const checkDeviceIntegrity = async (): Promise<IntegrityReport> => {
  try {
    const reasons: IntegrityReport['reasons'] = [];
    if (JailMonkey.isJailBroken()) {
      reasons.push('rooted_or_jailbroken');
    }
    if (JailMonkey.hookDetected()) {
      reasons.push('hooked');
    }
    if (await JailMonkey.isDebuggedMode()) {
      reasons.push('debugger_attached');
    }
    if (JailMonkey.canMockLocation()) {
      reasons.push('mock_location');
    }
    return { compromised: reasons.length > 0, reasons };
  } catch {
    // If the checks themselves are tampered with / crash, assume the worst.
    return { compromised: true, reasons: ['hooked'] };
  }
};
