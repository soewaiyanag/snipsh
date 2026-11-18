import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import type { Link } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CreateLinkBar } from './CreateLinkBar'
import { LinkRow, LinkRowSkeleton, LinkRowsHeader } from './LinkRow'
import { LINKS_PAGE_SIZE, useLinks } from './queries'

const FIRST_PAGE = 1
const SKELETON_ROWS = 6

export function LinksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(FIRST_PAGE, Number(searchParams.get('page')) || FIRST_PAGE)
  // Set when a visitor typed a URL before logging in; see CreateLinkBar.
  const initialUrl = searchParams.get('url') ?? ''
  const links = useLinks(page)
  const [madeLink, setMadeLink] = useState<Link | null>(null)

  function goToPage(next: number) {
    setSearchParams(next === FIRST_PAGE ? {} : { page: String(next) })
  }

  const total = links.data?.total ?? 0
  const lastPage = Math.max(FIRST_PAGE, Math.ceil(total / LINKS_PAGE_SIZE))

  // Deleting the last link on a page leaves it empty; step back to a page that exists.
  if (links.data && !links.isPlaceholderData && page > lastPage) {
    return <Navigate to={lastPage === FIRST_PAGE ? '/links' : `/links?page=${lastPage}`} replace />
  }

  return (
    <div className="mx-auto max-w-3xl pt-10 sm:pt-20">
      <h1 className="text-2xl font-semibold tracking-tight">Shorten a link</h1>

      <section aria-label="Make a short link" className="mt-5">
        <CreateLinkBar
          initialUrl={initialUrl}
          onCreated={(link) => {
            setMadeLink(link)
            goToPage(FIRST_PAGE)
          }}
        />
      </section>

      <section aria-labelledby="links-heading" aria-busy={links.isFetching} className="mt-16">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="links-heading" className="text-sm font-medium">
            Recent links
          </h2>
          {total > 0 && (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatNumber(total)} total, newest first
            </p>
          )}
        </div>
        {(links.isPending || total > 0) && <LinkRowsHeader />}
        {links.isPending ? (
          <ul aria-label="Loading links" className="rounded-xl border border-border">
            {Array.from({ length: SKELETON_ROWS }, (_, row) => (
              <LinkRowSkeleton key={row} row={row} />
            ))}
          </ul>
        ) : links.isError ? (
          <div role="alert" className="rounded-xl border border-border px-5 py-8">
            <p className="font-semibold">Your links could not be loaded.</p>
            <p className="mt-1 text-muted-foreground">{links.error.message}</p>
            <Button variant="outline" className="mt-5" onClick={() => links.refetch()}>
              Try again
            </Button>
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-input px-5 py-10 text-center">
            <p className="font-medium">No links yet</p>
            <p className="mx-auto mt-1.5 max-w-prose text-sm text-muted-foreground">
              Paste a long URL into the bar above and press Enter. It will show up here, ready to
              copy.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => document.getElementById('create-url')?.focus()}
            >
              Make your first link
            </Button>
          </div>
        ) : (
          <>
            <ul
              aria-label="Your links"
              className={cn(
                'rounded-xl border border-border transition-opacity',
                links.isPlaceholderData && 'opacity-60',
              )}
            >
              {links.data.items.map((link) => (
                <LinkRow key={link.id} link={link} isNew={link.id === madeLink?.id} />
              ))}
            </ul>
            {lastPage > FIRST_PAGE && (
              <nav aria-label="Pages" className="flex items-center justify-between gap-4 pt-4">
                <Button variant="outline" disabled={page === FIRST_PAGE} onClick={() => goToPage(page - 1)}>
                  Previous
                </Button>
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  Page {page} of {lastPage}
                </p>
                <Button variant="outline" disabled={page === lastPage} onClick={() => goToPage(page + 1)}>
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}
