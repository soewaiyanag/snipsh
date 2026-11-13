import { z } from 'zod';

const MAX_PORT = 65535;
const MIN_JWT_SECRET_LENGTH = 32;

export const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
  // optional so local development works without a Google key; links are not checked when it is missing
  SAFE_BROWSING_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().int().min(0).max(MAX_PORT).default(3000),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env =>
  envSchema.parse(config);
