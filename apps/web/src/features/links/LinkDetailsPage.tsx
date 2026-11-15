import { ArrowLeftIcon, BanIcon, CircleCheckIcon, ClockIcon, ExternalLinkIcon } from 'lucide-react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import { HTTP_STATUS, isApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LinkStats } from '@/features/stats/LinkStats'
import { formatDate, formatRelative } from '@/lib/format'
import { SHORT_LINK_PREFIX } from '@/lib/short-link'
import { cn } from '@/lib/utils'
import { CopyButton } from './CopyButton'
import { DeleteLinkButton } from './DeleteLinkButton'
import { useLink } from './queries'

export function LinkDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const link = useLink(id)

  if (link.isPending) {
    return (
      <div aria-label="Loading link" className="mx-auto grid max-w-3xl gap-4 pt-6 sm:pt-10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (link.isError) {
    const isMissing =
      isApiError(link.error, HTTP_STATUS.notFound) || isApiError(link.error, HTTP_STATUS.forbidden)
    return (
      <div role="alert" className="mx-auto max-w-3xl pt-6 sm:pt-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isMissing ? 'This link does not exist' : 'This link could not be loaded'}
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          {isMissing
            ? 'It may have been deleted, or it may belong to another account.'
            : link.error.message}
        </p>
        <div className="mt-6 flex gap-2">
          {!isMissing && (
            <Button variant="outline" onClick={() => link.refetch()}>
              Try again
            </Button>
          )}
          <Button asChild>
            <RouterLink to="/links">Back to your links</RouterLink>
          </Button>
        </div>
      </div>
    )
  }

  const { data } = link
  const isExpired = data.expiresAt ? new Date(data.expiresAt) < new Date() : false
  const isLive = data.isActive !== false && !isExpired
  const status = isExpired ? 'Expired' : data.isActive === false ? 'Disabled' : 'Active'
  const StatusIcon = isExpired ? ClockIcon : data.isActive === false ? BanIcon : CircleCheckIcon

  return (
    <div className="mx-auto max-w-3xl pt-6 sm:pt-10">
      <Button asChild variant="ghost" className="-ml-4 text-muted-foreground">
        <RouterLink to="/links">
          <ArrowLeftIcon />
          All links
        </RouterLink>
      </Button>

      <header className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="link-text text-3xl font-bold sm:text-4xl">
            <span className="font-normal text-muted-foreground">{SHORT_LINK_PREFIX}</span>
            {data.slug}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <StatusIcon aria-hidden className={cn('size-4', isLive ? 'text-ring' : 'text-muted-foreground')} />
            {status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton slug={data.slug} variant="default" />
          <DeleteLinkButton link={data} onDeleted={() => navigate('/links')} />
        </div>
      </header>

      <dl className="sheet mt-6 grid gap-x-10 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Destination</dt>
          <dd className="mt-1">
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="link-text inline-flex items-start gap-2 rounded-sm underline hover:no-underline"
            >
              {data.url}
              <ExternalLinkIcon aria-hidden className="mt-1 size-4 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Created</dt>
          <dd className="mt-1">
            {formatDate(data.createdAt)}{' '}
            <span className="text-muted-foreground">({formatRelative(data.createdAt)})</span>
          </dd>
        </div>
        {data.expiresAt && (
          <div>
            <dt className="text-sm text-muted-foreground">{isExpired ? 'Expired' : 'Expires'}</dt>
            <dd className="mt-1">{formatDate(data.expiresAt)}</dd>
          </div>
        )}
      </dl>

      <LinkStats id={data.id} />
    </div>
  )
}
