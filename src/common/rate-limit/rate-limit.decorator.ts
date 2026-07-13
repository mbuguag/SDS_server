import { SetMetadata } from '@nestjs/common';

export type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  ttlMs: number;
};

export const RATE_LIMIT_OPTIONS = 'rate_limit_options';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_OPTIONS, options);
