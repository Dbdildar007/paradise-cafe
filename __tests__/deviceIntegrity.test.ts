import JailMonkey from 'jail-monkey';
import { checkDeviceIntegrity } from '../src/security/deviceIntegrity';

const jm = JailMonkey as unknown as Record<string, jest.Mock>;

describe('checkDeviceIntegrity', () => {
  it('passes a clean device', async () => {
    await expect(checkDeviceIntegrity()).resolves.toEqual({ compromised: false, reasons: [] });
  });
  it('flags root/jailbreak, hooks, debugger and mock location', async () => {
    jm.isJailBroken!.mockReturnValueOnce(true);
    jm.hookDetected!.mockReturnValueOnce(true);
    jm.isDebuggedMode!.mockResolvedValueOnce(true);
    jm.canMockLocation!.mockReturnValueOnce(true);
    const r = await checkDeviceIntegrity();
    expect(r.compromised).toBe(true);
    expect(r.reasons).toEqual(['rooted_or_jailbroken', 'hooked', 'debugger_attached', 'mock_location']);
  });
  it('fails closed if a check throws (tampered library)', async () => {
    jm.isJailBroken!.mockImplementationOnce(() => {
      throw new Error('hooked');
    });
    await expect(checkDeviceIntegrity()).resolves.toMatchObject({ compromised: true });
  });
});
