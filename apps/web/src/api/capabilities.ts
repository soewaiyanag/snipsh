import { env } from '@/env'

// The API has no update endpoint by design, so editing only exists against the mocks.
export const capabilities = { editLinks: env.useMocks }
