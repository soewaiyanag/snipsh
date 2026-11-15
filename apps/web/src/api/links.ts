import { request } from './client'
import type { CreateLinkInput, ReportLinkInput } from './schemas'
import type { Link, Paginated } from './types'

export function listLinks({ page, limit }: { page: number; limit: number }) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<Paginated<Link>>(`/links?${query}`)
}

export function createLink(input: CreateLinkInput) {
  return request<Link>('/links', { method: 'POST', body: input })
}

export function getLink(id: string) {
  return request<Link>(`/links/${encodeURIComponent(id)}`)
}

export function deleteLink(id: string) {
  return request<void>(`/links/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Public: anyone who meets a harmful short link can flag it for review.
export function reportLink(input: ReportLinkInput) {
  return request<void>('/links/report', { method: 'POST', body: input, authenticated: false })
}
