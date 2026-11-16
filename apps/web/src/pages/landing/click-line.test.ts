import { expect, test } from 'vitest'
import { linePath, SAMPLE_REFERRERS, SAMPLE_TOTAL } from './click-line'

test('the line runs edge to edge and the busiest day touches the top', () => {
  expect(linePath([0, 10, 5], 100, 50)).toBe('M0.0,50.0 L50.0,0.0 L100.0,25.0')
})

test('a link with no clicks yet is a flat line, not a crash', () => {
  expect(linePath([0, 0], 100, 50)).toBe('M0.0,50.0 L100.0,50.0')
})

test('the named referrers never add up to more clicks than the total', () => {
  const named = SAMPLE_REFERRERS.reduce((sum, { count }) => sum + count, 0)
  expect(named).toBeLessThanOrEqual(SAMPLE_TOTAL)
})
