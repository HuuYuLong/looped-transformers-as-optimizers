import { useEffect, useState } from 'react'

/*
 * A rAF-driven clock that respects prefers-reduced-motion.
 * When the user asks for reduced motion, the clock freezes at a
 * comfortable mid-point so diagrams still read as static figures.
 */
export function useMotionClock(freezeAt = 4000) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setT(freezeAt)
      return
    }
    const t0 = Date.now()
    const id = setInterval(() => setT(Date.now() - t0), 40)
    return () => clearInterval(id)
  }, [freezeAt])
  return t
}

/* Listen-based variant for components that need to react to changes */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}
