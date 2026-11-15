import { env } from '@/env'
import { clearToken, getToken } from '@/features/auth/token'
import type { ApiError } from './types'

export const HTTP_STATUS = {
  noContent: 204,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
} as const

const NETWORK_ERROR_STATUS = 0
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Could not reach the server. Check your connection and try again.'
const TOO_MANY_REQUESTS_MESSAGE = 'Too many attempts. Wait a minute and try again.'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export function isApiError(error: unknown, status: number): error is ApiRequestError {
  return error instanceof ApiRequestError && error.status === status
}

// NestJS sends a string; class-validator sends an array of strings.
export function normalizeMessage(body: unknown): string {
  const message = (body as Partial<ApiError> | null)?.message
  if (Array.isArray(message)) return message.join('. ') || FALLBACK_MESSAGE
  return typeof message === 'string' && message ? message : FALLBACK_MESSAGE
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  authenticated?: boolean
  // Off where a 401 means "wrong password", not "your session ended".
  signOutOnUnauthorized?: boolean
}

export async function request<T>(
  path: string,
  { method = 'GET', body, authenticated = true, signOutOnUnauthorized = true }: RequestOptions = {},
): Promise<T> {
  const token = authenticated ? getToken() : null
  const headers = new Headers()
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError(NETWORK_ERROR_STATUS, NETWORK_MESSAGE)
  }

  // Clearing the token flips the auth state, and the route guard sends the user to /login.
  if (authenticated && signOutOnUnauthorized && response.status === HTTP_STATUS.unauthorized) {
    clearToken()
  }

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null)
    // The rate limiter's own message ("ThrottlerException: ...") is not meant for people.
    const message =
      response.status === HTTP_STATUS.tooManyRequests
        ? TOO_MANY_REQUESTS_MESSAGE
        : normalizeMessage(errorBody)
    throw new ApiRequestError(response.status, message)
  }

  // 204, and 202 from a report, come with no body at all.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
