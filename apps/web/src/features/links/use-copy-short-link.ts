import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { shortLinkLabel, shortLinkUrl } from '@/lib/short-link'

const COPIED_FEEDBACK_MS = 1600

// The tick shows before the clipboard answers; a refusal takes it back.
export function useCopyShortLink(slug: string) {
  const [isCopied, setIsCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    setIsCopied(true)
    try {
      await navigator.clipboard.writeText(shortLinkUrl(slug))
      toast.success('Copied', { description: shortLinkLabel(slug) })
      timer.current = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
    } catch {
      setIsCopied(false)
      toast.error('Could not copy. Select the link and copy it by hand.')
    }
  }

  return { isCopied, copy }
}
