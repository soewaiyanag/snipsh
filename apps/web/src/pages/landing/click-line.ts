// Sample clicks per day for the last 30 days, oldest first.
export const SAMPLE_CLICKS_PER_DAY = [
  4, 6, 5, 9, 7, 12, 30, 64, 51, 38, 29, 26, 22, 31, 27, 19, 21, 18, 24, 41, 58, 47, 33, 28, 25, 30,
  22, 26, 35, 29,
]
export const SAMPLE_TOTAL = SAMPLE_CLICKS_PER_DAY.reduce((sum, count) => sum + count, 0)

// Where the sample clicks came from; the rest arrived from smaller sites.
export const SAMPLE_REFERRERS = [
  { referrer: 'newsletter.example', count: 312 },
  { referrer: 'x.com', count: 201 },
  { referrer: '', count: 148 },
  { referrer: 'github.com', count: 66 },
]

// An SVG path through the counts, scaled so the busiest day touches the top.
export function linePath(counts: number[], width: number, height: number) {
  const highest = Math.max(...counts, 1)
  const step = width / Math.max(counts.length - 1, 1)
  return counts
    .map((count, day) => `${day === 0 ? 'M' : 'L'}${(day * step).toFixed(1)},${(height - (count / highest) * height).toFixed(1)}`)
    .join(' ')
}
