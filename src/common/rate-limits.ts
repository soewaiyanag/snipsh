const ONE_MINUTE_MS = 60_000;

// Used with @Throttle() to replace the global default on sensitive routes
export const AUTH_RATE_LIMIT = {
  default: { limit: 5, ttl: ONE_MINUTE_MS },
};

export const CREATE_LINK_RATE_LIMIT = {
  default: { limit: 20, ttl: ONE_MINUTE_MS },
};
