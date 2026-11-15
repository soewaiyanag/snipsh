import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.validation.js';

// Google marks v4 as deprecated; if it stops working, this is the only file to change
const SEARCH_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const REQUEST_TIMEOUT_MS = 3000;

@Injectable()
export class SafeBrowsingService {
  private readonly logger = new Logger(SafeBrowsingService.name);
  private readonly apiKey?: string;

  constructor(config: ConfigService<Env>) {
    this.apiKey = config.get('SAFE_BROWSING_API_KEY', { infer: true });
    if (!this.apiKey) {
      this.logger.warn(
        'SAFE_BROWSING_API_KEY is not set, links are not checked',
      );
    }
  }

  // Throws when Google cannot be reached; the caller decides whether to allow the link anyway
  async isUrlSafe(url: string): Promise<boolean> {
    if (!this.apiKey) {
      return true;
    }
    const response = await fetch(`${SEARCH_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'snipsh-api', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Safe Browsing answered with status ${response.status}`);
    }

    // a safe url gets an empty answer: {}
    const { matches } = (await response.json()) as { matches?: unknown[] };
    const isSafe = !matches?.length;
    if (!isSafe) {
      this.logger.warn(`Blocked unsafe URL: ${url}`);
    }
    return isSafe;
  }
}
