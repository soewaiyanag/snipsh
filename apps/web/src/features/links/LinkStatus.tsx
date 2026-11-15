import type { Link } from '@/api/types'
import { formatDate } from '@/lib/format'

// A disabled link answers 410 instead of redirecting. expiresAt is planned and may be missing.
export function LinkStatus({ link }: { link: Link }) {
  const isDisabled = link.isActive === false
  const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false

  if (!isDisabled && !link.expiresAt) return null

  return (
    <span className="flex flex-wrap gap-1.5">
      {isDisabled && (
        <span
          title="Switched off after a report. Visitors see a 'gone' page instead of the target."
          className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
        >
          Disabled
        </span>
      )}
      {link.expiresAt && (
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {isExpired ? 'Expired' : 'Expires'} {formatDate(link.expiresAt)}
        </span>
      )}
    </span>
  )
}
