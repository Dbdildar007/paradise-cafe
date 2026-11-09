import fs from 'fs';
import path from 'path';

const dir = path.join(__dirname, '../../supabase/migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const all = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const strip = (s: string) => s.replace(/--.*$/gm, '');
const sql = strip(all);

describe('supabase migrations (static policy checks)', () => {
  it('are ordered, uniquely timestamped and non-empty', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
    expect(files.every(f => /^\d{14}_[a-z0-9_]+\.sql$/.test(f))).toBe(true);
    expect(new Set(files.map(f => f.slice(0, 14))).size).toBe(files.length);
  });

  it('every public table has RLS enabled', () => {
    const tables = [...sql.matchAll(/create table public\.(\w+)/gi)].map(m => m[1]);
    expect(tables.length).toBeGreaterThanOrEqual(19);
    tables.forEach(t => expect(sql).toMatch(new RegExp(`alter table public\\.${t}\\s+enable row level security`, 'i')));
  });

  it('sensitive tables force RLS', () => {
    ['profiles', 'orders', 'payments', 'otp_request_log', 'auth_audit_log'].forEach(t =>
      expect(sql).toMatch(new RegExp(`alter table public\\.${t}\\s+force row level security`, 'i')));
  });

  it('internal tables have no policies and no grants to client roles', () => {
    ['otp_request_log', 'auth_audit_log'].forEach(t => {
      expect(sql).not.toMatch(new RegExp(`create policy \\w+ on public\\.${t}`, 'i'));
      expect(sql).not.toMatch(new RegExp(`grant [^;]*public\\.${t}[^;]* to [^;]*(anon|authenticated)`, 'i'));
    });
  });

  it('never grants blanket access or uses permissive USING (true) policies', () => {
    expect(sql).not.toMatch(/grant all[^;]* to (anon|authenticated|public)/i);
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it('service-only functions are granted to service_role only', () => {
    ['check_and_log_otp_request', 'upsert_profile_on_login', 'purge_otp_request_log'].forEach(fn => {
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role;`, 'i'));
      expect(sql).not.toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to [^;]*(anon|authenticated)`, 'i'));
    });
  });

  it('every SECURITY DEFINER function pins its search_path', () => {
    const defs = sql.split(/create or replace function/i).slice(1).filter(b => /security definer/i.test(b.split(/\$\$/)[0] ?? ''));
    expect(defs.length).toBeGreaterThanOrEqual(8);
    defs.forEach(b => expect(b.split(/\$\$/)[0]).toMatch(/set search_path\s*=\s*public/i));
  });

  it('stores money as integer paise and never as float', () => {
    expect(sql).not.toMatch(/\b(float|double precision|real)\b/i);
    expect(sql).toMatch(/total_paise\s+integer/);
  });

  it('OTP guard mirrors the app policy (1 send + 3 resends / 5 h)', () => {
    expect(sql).toMatch(/c_max_per_phone\s+constant integer\s*:=\s*4/);
    expect(sql).toMatch(/interval '5 hours'/);
  });

  it('never stores raw phone numbers in the OTP log', () => {
    const block = sql.split(/create table public\.otp_request_log/i)[1]?.split(/\);/)[0] ?? '';
    expect(block).toMatch(/phone_hash/);
    expect(block).not.toMatch(/phone_e164|phone\s+text/);
  });
});
