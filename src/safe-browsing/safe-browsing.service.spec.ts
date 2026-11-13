import type { ConfigService } from '@nestjs/config';
import { SafeBrowsingService } from './safe-browsing.service.js';

const FLAGGED_ANSWER = Uint8Array.from([0x0a, 0x02, 0x0a, 0x00]);
const SAFE_ANSWER = Uint8Array.from([0x12, 0x03, 0x08, 0xac, 0x02]);

const serviceWith = (apiKey?: string) =>
  new SafeBrowsingService({ get: () => apiKey } as unknown as ConfigService);

describe('SafeBrowsingService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('skips the check when there is no api key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await serviceWith().isUrlSafe('https://example.com')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false for a flagged url', async () => {
    vi.stubGlobal('fetch', async () => new Response(FLAGGED_ANSWER));

    expect(await serviceWith('key').isUrlSafe('https://bad.example')).toBe(
      false,
    );
  });

  it('returns true for a clean url', async () => {
    vi.stubGlobal('fetch', async () => new Response(SAFE_ANSWER));

    expect(await serviceWith('key').isUrlSafe('https://example.com')).toBe(
      true,
    );
  });

  it('throws when Google answers with an error', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 500 }));

    await expect(
      serviceWith('key').isUrlSafe('https://example.com'),
    ).rejects.toThrow('status 500');
  });
});
