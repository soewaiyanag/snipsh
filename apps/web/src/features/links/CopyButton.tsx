import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shortLinkLabel } from '@/lib/short-link'
import { cn } from '@/lib/utils'
import { useCopyShortLink } from './use-copy-short-link'

export function CopiedIcon({ isCopied }: { isCopied: boolean }) {
  return (
    <span className="relative grid size-4 place-items-center *:col-start-1 *:row-start-1 *:transition-[opacity,scale] *:duration-300 *:ease-spring">
      <CopyIcon className={cn(isCopied && 'scale-50 opacity-0')} />
      <CheckIcon className={cn(!isCopied && 'scale-50 opacity-0')} />
    </span>
  )
}

type CopyButtonProps = { slug: string; iconOnly?: boolean }

export function CopyButton({ slug, iconOnly }: CopyButtonProps) {
  const { isCopied, copy } = useCopyShortLink(slug)
  return (
    <Button
      variant={iconOnly ? 'ghost' : 'secondary'}
      size={iconOnly ? 'icon' : 'default'}
      onClick={copy}
      aria-label={`Copy ${shortLinkLabel(slug)}`}
      title={iconOnly ? 'Copy' : undefined}
      className={cn(!iconOnly && 'min-w-24')}
    >
      <CopiedIcon isCopied={isCopied} />
      {!iconOnly && (isCopied ? 'Copied' : 'Copy')}
    </Button>
  )
}
