import { useMemo } from 'react'
import { encode } from 'uqr'
import { shortLinkLabel, shortLinkUrl } from '@/lib/short-link'

const QUIET_ZONE_MODULES = 2

// One path of unit squares, one per dark module. Always black on white: many phone
// scanners cannot read a code with its colours inverted, so it ignores the dark theme.
export function QrCode({ slug }: { slug: string }) {
  const { size, path } = useMemo(() => {
    const { data, size } = encode(shortLinkUrl(slug), { border: QUIET_ZONE_MODULES })
    const path = data
      .flatMap((row, y) => row.map((isDark, x) => (isDark ? `M${x} ${y}h1v1h-1z` : '')))
      .join('')
    return { size, path }
  }, [slug])

  return (
    <svg
      role="img"
      aria-label={`QR code for ${shortLinkLabel(slug)}`}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className="size-36 rounded-md bg-white"
    >
      <path d={path} fill="black" />
    </svg>
  )
}
