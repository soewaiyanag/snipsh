import { hasThreats } from './threat-response.js';

// Bytes captured from the real API on 2026-11-13
const CACHE_DURATION_FIELD = [0x12, 0x03, 0x08, 0xac, 0x02];
const SAFE_ANSWER = Uint8Array.from(CACHE_DURATION_FIELD);

const FLAGGED_URL = 'testsafebrowsing.appspot.com/s/malware.html';
const MALWARE_ANSWER = Buffer.concat([
  Buffer.from([0x0a, 0x31, 0x0a, FLAGGED_URL.length]),
  Buffer.from(FLAGGED_URL),
  Buffer.from([0x12, 0x02, 0x01, 0x04]),
  Buffer.from(CACHE_DURATION_FIELD),
]);

describe('hasThreats', () => {
  it('finds a threat in a flagged answer', () => {
    expect(hasThreats(MALWARE_ANSWER)).toBe(true);
  });

  it('finds no threat when only the cache duration is sent', () => {
    expect(hasThreats(SAFE_ANSWER)).toBe(false);
  });

  it('finds no threat in an empty answer', () => {
    expect(hasThreats(new Uint8Array())).toBe(false);
  });

  it('fails loudly on a cut-off answer instead of calling it safe', () => {
    const cutOffInsideField = Uint8Array.from([0x12, 0x03, 0x08]);
    const cutOffInsideNumber = Uint8Array.from([0x80]);

    expect(() => hasThreats(cutOffInsideField)).toThrow();
    expect(() => hasThreats(cutOffInsideNumber)).toThrow();
  });
});
