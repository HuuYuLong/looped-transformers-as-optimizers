import { useEffect, useRef, useState } from 'react'

/*
 * Shared continuous-flow engine for loop animations.
 * A single activation pulse glides along one closed SVG path (main chain +
 * return arc) at constant speed, sampled via getPointAtLength — no discrete
 * stepping, matching the LoopCD video feel.
 *
 * Timeline (normalized t in [0,1]):
 *   [0, fwdEnd)    pulse travels the main chain left→right
 *   [fwdEnd, retEnd) pulse rides the return arc back to the start
 *   [retEnd, 1)    brief rest at the start, then the timeline wraps
 */

export type FlowTimeline = {
  /** fraction of the lap spent on the forward chain (default 0.62) */
  fwdEnd?: number
  /** fraction where the return arc ends (default 0.92) */
  retEnd?: number
  /** ms per full lap (default 5200) */
  period?: number
}

export type FlowState = {
  /** raw normalized time, wraps every lap */
  t: number
  /** x,y of the pulse */
  x: number
  y: number
  /** 0..1 progress along the forward chain (clamped) */
  fwd: number
  /** 0..1 progress along the return arc (clamped) */
  ret: number
  /** which segment the pulse is in */
  seg: 'fwd' | 'ret' | 'rest'
  /** completed laps so far */
  lap: number
  ready: boolean
}

export function useFlowAnimation(
  fwdRef: React.RefObject<SVGPathElement | null>,
  retRef: React.RefObject<SVGPathElement | null>,
  { fwdEnd = 0.62, retEnd = 0.92, period = 5200 }: FlowTimeline = {},
): FlowState {
  const [state, setState] = useState<FlowState>({ t: 0, x: 0, y: 0, fwd: 0, ret: 0, seg: 'fwd', lap: 0, ready: false })
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const fwd = fwdRef.current
    const ret = retRef.current
    if (!fwd || !ret) return
    const fwdLen = fwd.getTotalLength()
    const retLen = ret.getTotalLength()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const frame = (now: number) => {
      if (!startRef.current) startRef.current = now
      const elapsed = now - startRef.current
      const lap = Math.floor(elapsed / period)
      const t = (elapsed % period) / period

      let x = 0, y = 0, f = 0, r = 0, seg: FlowState['seg'] = 'fwd'
      if (t < fwdEnd) {
        seg = 'fwd'
        f = t / fwdEnd
        const p = fwd.getPointAtLength(f * fwdLen)
        x = p.x; y = p.y
      } else if (t < retEnd) {
        seg = 'ret'
        f = 1
        r = (t - fwdEnd) / (retEnd - fwdEnd)
        const p = ret.getPointAtLength(r * retLen)
        x = p.x; y = p.y
      } else {
        seg = 'rest'
        f = 1; r = 1
        const p = fwd.getPointAtLength(0)
        x = p.x; y = p.y
      }
      setState({ t, x, y, fwd: f, ret: r, seg, lap, ready: true })
      if (!reduced) rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [fwdRef, retRef, fwdEnd, retEnd, period])

  return state
}
