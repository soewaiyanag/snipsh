import { request } from './client'
import type { Credentials, DeleteAccountInput } from './schemas'
import type { AuthToken, User } from './types'

export function register(credentials: Credentials) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: credentials,
    authenticated: false,
  })
}

export function login(credentials: Credentials) {
  return request<AuthToken>('/auth/login', {
    method: 'POST',
    body: credentials,
    authenticated: false,
  })
}

// Deletes the account with all its links and clicks. The password is asked again on purpose.
export function deleteAccount(input: DeleteAccountInput) {
  return request<void>('/auth/me', { method: 'DELETE', body: input, signOutOnUnauthorized: false })
}
