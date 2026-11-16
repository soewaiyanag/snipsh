import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect, useState, type RefObject } from 'react'

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// True from the first time the element is mostly on screen, so a drawing plays where it is seen.
export function useSeen(ref: RefObject<Element | null>) {
  // Where the browser cannot watch for it, show everything rather than leave it hidden.
  const [seen, setSeen] = useState(() => !('IntersectionObserver' in window))

  useEffect(() => {
    const element = ref.current
    if (!element || seen) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), {
      threshold: 0.4,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen])

  return seen
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

// Eased wheel scrolling for the landing page only. Touch scrolling stays native.
export function useSmoothScroll() {
  useEffect(() => {
    // Lenis measures the page with ResizeObserver; without one, scrolling stays native.
    if (prefersReducedMotion() || !('ResizeObserver' in window)) return
    const lenis = new Lenis({ autoRaf: true })
    return () => lenis.destroy()
  }, [])
}
