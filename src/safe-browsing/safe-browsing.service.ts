import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.validation.js';
import { hasThreats } from './threat-response.js';

const SEARCH_URL = 'https://safebrowsing.googleapis.com/v5/urls:search';
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
    const query = new URLSearchParams({ urls: url, key: this.apiKey });
    const response = await fetch(`${SEARCH_URL}?${query}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Safe Browsing answered with status ${response.status}`);
    }

    const isSafe = !hasThreats(new Uint8Array(await response.arrayBuffer()));
    if (!isSafe) {
      this.logger.warn(`Blocked unsafe URL: ${url}`);
    }
    return isSafe;
  }
}
