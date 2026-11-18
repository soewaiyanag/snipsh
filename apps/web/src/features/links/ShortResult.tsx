import { ArrowRightIcon, QrCodeIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Link } from '@/api/types'
import { Button } from '@/components/ui/button'
import { SHORT_LINK_PREFIX } from '@/lib/short-link'
import { CopiedIcon } from './CopyButton'
import { useCopyShortLink } from './use-copy-short-link'
import { QrCode } from './QrCode'

// The link that was just made. Focus lands on Copy, so Enter, Enter goes from URL to clipboard.
export function ShortResult({ link }: { link: Link }) {
  const { isCopied, copy } = useCopyShortLink(link.slug)
  const [showsQr, setShowsQr] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)

  useEffect(() => copyRef.current?.focus(), [])

  function copyAndSelect() {
    if (textRef.current) window.getSelection()?.selectAllChildren(textRef.current)
    return copy()
  }

  return (
    <section
      aria-label="Your new short link"
      className="animate-spring-in rounded-xl border border-ring/40 bg-card p-1.5 pl-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="link-text min-w-0 flex-1 py-2 text-base sm:text-lg">
          <span ref={textRef} className="select-all">
            <span className="text-subtle">{SHORT_LINK_PREFIX}</span>
            <span className="font-semibold">{link.slug}</span>
          </span>
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={showsQr}
            aria-label="QR code"
            title="QR code"
            onClick={() => setShowsQr((shows) => !shows)}
          >
            <QrCodeIcon />
          </Button>
          <Button ref={copyRef} onClick={copyAndSelect} className="min-w-24 rounded-lg">
            <CopiedIcon isCopied={isCopied} />
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      <p className="link-text flex items-center gap-1.5 pr-3 pb-2 text-xs text-muted-foreground">
        <ArrowRightIcon aria-hidden className="size-3 shrink-0" />
        <span className="sr-only">Goes to </span>
        <span className="truncate" title={link.url}>
          {link.url}
        </span>
      </p>
      {showsQr && (
        <div className="flex animate-spring-in justify-center border-t border-border py-4">
          <QrCode slug={link.slug} />
        </div>
      )}
    </section>
  )
}
