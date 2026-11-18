import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { env } from '@/env'
import { useAuth } from '@/features/auth/auth-context'
import { CreateLinkBar } from '@/features/links/CreateLinkBar'

// The bar is the page. A visitor who is not logged in is sent to log in on Enter, and comes back
// to /links with the URL still in the bar.
export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto max-w-3xl pt-16 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Long links, cut short.
      </h1>

      <section aria-label="Make a short link" className="mt-6">
        <CreateLinkBar />
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
        {isAuthenticated ? (
          <Button asChild variant="outline">
            <Link to="/links">
              Your links <ArrowRightIcon />
            </Link>
          </Button>
        ) : (
          <>
            <p className="mr-auto">Log in to keep your links and count their clicks.</p>
            {env.useMocks && (
              <Button asChild variant="ghost">
                <Link to="/login">Explore the demo account</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/register">Create an account</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
