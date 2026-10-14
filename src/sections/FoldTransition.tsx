import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/useMotionClock'
import { Tex } from './Tex'

/*
 * FoldTransition — interactive, information flows BOTTOM → TOP.
 *
 * A standard Transformer: token embedding at the bottom, a stack of
 * independently-parameterized blocks θ₁..θ₅ above it, LM head at the top.
 * Click the toggle (or the diagram) and the stack folds into ONE shared
 * Blocks_θ — the difference is entirely in the middle: a recurrent arc
 * feeds the block's output back up into its input, R times, before the
 * state rises to the LM head. A pulse rides the whole path upward.
 */

/*
 * FoldTransition — interactive, information flows BOTTOM → TOP.
 *
 * A standard Transformer: token embedding at the bottom, a stack of
 * independently-parameterized blocks θ₁..θ₅ above it (ghost "…" pills hint
 * at the remaining depth), LM head at the top. Click the toggle (or the
 * diagram) and the stack folds into ONE shared Blocks_θ wrapped by a
 * recurrent circle — plus Prelude / Coda, exactly as in paper Figure 1b.
 */

const W = 620, H = 548
const CX = 250 // column center — shifted toward the viewBox middle
const EY = 470 // embedding pill center (bottom)
const LY = 84 // LM head pill center (top)
const PY = 426 // Prelude center (looped only)
const CY2 = 126 // Coda center (looped only)
// standard stack, bottom → top: 8 independently-parameterized blocks
const BLOCK_Y = [398, 362, 326, 290, 254, 218, 182, 146]
const BY = (PY + CY2) / 2 // shared block — centered between Prelude and Coda
const SBW = 216, SBH = 50
const TOP = BY - SBH / 2, BOT = BY + SBH / 2
const RAD = 88 // radius of the circular return loop — just wide enough to clear the block
const A1Y = TOP - 30, A2Y = BOT + 30 // arc joins the column above / below the block
const CHORD = (A2Y - A1Y) / 2 // half chord between the two join points
const EX = Math.sqrt(RAD * RAD - CHORD * CHORD) // column → circle-center distance
const LOOPS = 3
const LAP_MS = 8400

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// one lap: up through the block, then a perfect circle on the right —
// from the TOP join, clockwise down to the bottom join, re-entering the block.
// single major arc (large-arc=1, sweep=1) => exactly one true circle
const lapD = `L ${CX} ${A1Y} A ${RAD} ${RAD} 0 1 1 ${CX} ${A2Y} L ${CX} ${BOT}`
const introD = `M ${CX} ${EY - 18} L ${CX} ${BOT}`
const exitD = `L ${CX} ${TOP} L ${CX} ${LY + 20}`
const loopD = introD + lapD.repeat(LOOPS) + exitD
const stdD = `M ${CX} ${EY - 18} L ${CX} ${LY + 20}`

export default function FoldTransition() {
  const [looped, setLooped] = useState(false)
  const [f, setF] = useState(0) // animated fold 0..1
  const [t, setT] = useState(0)
  const fRef = useRef(0)
  const loopRef = useRef<SVGPathElement>(null)
  const stdRef = useRef<SVGPathElement>(null)
  const lapRef = useRef<SVGPathElement>(null)
  const introRef = useRef<SVGPathElement>(null)
  const [lens, setLens] = useState({ loop: 1, std: 1, lap: 1, intro: 1 })

  const reduced = usePrefersReducedMotion()
  // auto-fold: after one full standard pass, switch to the looped view once
  useEffect(() => {
    if (reduced) return
    const id = setTimeout(() => setLooped(true), LAP_MS + 1500)
    return () => clearTimeout(id)
  }, [reduced])
  useEffect(() => {
    if (reduced) { setT(0); return }
    const t0 = Date.now()
    const id = setInterval(() => {
      setT(Date.now() - t0)
      setF((prev) => {
        const target = fRef.current
        const next = prev + Math.sign(target - prev) * 0.045
        return Math.abs(next - target) < 0.045 ? target : next
      })
    }, 40)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fRef.current = looped ? 1 : 0
  }, [looped])

  useEffect(() => {
    if (loopRef.current && stdRef.current && lapRef.current && introRef.current) {
      setLens({
        loop: loopRef.current.getTotalLength(),
        std: stdRef.current.getTotalLength(),
        lap: lapRef.current.getTotalLength(),
        intro: introRef.current.getTotalLength(),
      })
    }
  }, [])

  const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2 // easeInOutCubic
  const settled = e < 0.02 || e > 0.98

  // ---- pulse (flows upward) ----
  const lt = (t % LAP_MS) / LAP_MS
  let px = CX, py = EY - 18
  let loopIdx = 0
  if (e < 0.5) {
    const p = stdRef.current?.getPointAtLength(lt * lens.std)
    if (p) { px = p.x; py = p.y }
  } else {
    const s = lt * lens.loop
    const p = loopRef.current?.getPointAtLength(s)
    if (p) { px = p.x; py = p.y }
    const inLaps = s - lens.intro
    loopIdx = inLaps > 0 ? Math.min(LOOPS, Math.floor(inLaps / lens.lap) + 1) : 0
  }
  const pulseOpacity = settled ? 1 : Math.abs(0.5 - e) * 2
  const onArc = e >= 0.5 && px > CX + 6

  // glow of shared block when the pulse is inside it
  const inShared = e >= 0.5 && Math.abs(px - CX) < SBW / 2 && py > TOP - 6 && py < BOT + 6
  const sharedGlow = inShared ? 1 : e >= 0.5 ? Math.max(0, 1 - Math.abs(py - BY) / 130) * (onArc ? 0 : 0.6) : 0

  // endpoint pills light up as the pulse passes through them
  const onColumn = Math.abs(px - CX) < 8 && settled
  const pillGlow = (cy: number) => (onColumn ? Math.max(0, 1 - Math.abs(py - cy) / 44) : 0)
  const embGlow = pillGlow(EY)
  const lmGlow = pillGlow(LY)
  const prePillGlow = e > 0.5 ? pillGlow(PY) : 0
  const codaPillGlow = e > 0.5 ? pillGlow(CY2) : 0

  const toggle = () => setLooped((v) => !v)

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 md:p-6">
      {/* toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="inline-flex items-center rounded-full border border-border bg-background/70 p-1 font-mono2 text-[12px]">
          <button
            onClick={() => setLooped(false)}
            className={`px-4 min-h-[38px] rounded-full transition-colors border ${
              !looped ? 'bg-blue-soft/15 text-blue-soft border-blue-soft/40' : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            Standard Transformer
          </button>
          <button
            onClick={() => setLooped(true)}
            className={`px-4 min-h-[38px] rounded-full transition-colors border ${
              looped ? 'bg-orange-soft/15 text-orange-soft border-orange-soft/40' : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            Looped Transformer
          </button>
        </div>
        <span className="font-mono2 text-[10.5px] text-muted-foreground/70">use the toggle — or click the diagram</span>
      </div>

      <svg
        viewBox={`30 0 ${W - 30} ${H}`}
        className="w-full mx-auto cursor-pointer select-none"
        style={{ maxWidth: 'min(620px, 55vh)' }}
        fill="none"
        onClick={toggle}
      >
        {/* hidden measurement paths */}
        <path ref={stdRef} d={stdD} stroke="none" />
        <path ref={loopRef} d={loopD} stroke="none" />
        <path ref={introRef} d={introD} stroke="none" />
        <path ref={lapRef} d={`M ${CX} ${BOT} ${lapD}`} stroke="none" />

        {/* ===== embedding ===== */}
        <g transform={`translate(${CX} ${EY})`}>
          <rect x={-95} y={-18} width={190} height={36} rx={18} fill="#76839a" fillOpacity={0.08 + embGlow * 0.22} stroke="#76839a" strokeOpacity={0.45 + embGlow * 0.45} strokeWidth={1.2 + embGlow * 0.6}
            style={embGlow > 0.05 ? { filter: `drop-shadow(0 0 ${8 * embGlow}px rgba(118,131,154,${0.7 * embGlow}))` } : undefined} />
          <text x={0} y={4.5} textAnchor="middle" fill="#5f6b7d" fontSize="13" fontFamily="JetBrains Mono">token embedding</text>
        </g>

        {/* ===== looped: Prelude / Coda frame the recurrent middle (Fig. 1b) ===== */}
        <g opacity={e}>
          <g transform={`translate(${CX} ${PY})`}>
            <rect x={-78} y={-16} width={156} height={32} rx={16} fill="#76839a" fillOpacity={0.08 + prePillGlow * 0.22} stroke="#76839a" strokeOpacity={0.45 + prePillGlow * 0.45} strokeWidth={1.2 + prePillGlow * 0.6}
              style={prePillGlow > 0.05 ? { filter: `drop-shadow(0 0 ${8 * prePillGlow}px rgba(118,131,154,${0.7 * prePillGlow}))` } : undefined} />
            <text x={0} y={-1} textAnchor="middle" fill="#5f6b7d" fontSize="11" fontFamily="JetBrains Mono">Prelude</text>
            <text x={0} y={12} textAnchor="middle" fill="#5f6b7d" fillOpacity="0.6" fontSize="8" fontFamily="JetBrains Mono">
              layers 1–2
            </text>
          </g>
          <g transform={`translate(${CX} ${CY2})`}>
            <rect x={-78} y={-16} width={156} height={32} rx={16} fill="#76839a" fillOpacity={0.08 + codaPillGlow * 0.22} stroke="#76839a" strokeOpacity={0.45 + codaPillGlow * 0.45} strokeWidth={1.2 + codaPillGlow * 0.6}
              style={codaPillGlow > 0.05 ? { filter: `drop-shadow(0 0 ${8 * codaPillGlow}px rgba(118,131,154,${0.7 * codaPillGlow}))` } : undefined} />
            <text x={0} y={-1} textAnchor="middle" fill="#5f6b7d" fontSize="11" fontFamily="JetBrains Mono">Coda</text>
            <text x={0} y={12} textAnchor="middle" fill="#5f6b7d" fillOpacity="0.6" fontSize="8" fontFamily="JetBrains Mono">
              layers 7–8
            </text>
          </g>
        </g>

        {/* ===== standard: straight column behind the stack ===== */}
        <line x1={CX} y1={EY - 18} x2={CX} y2={LY + 20} stroke="#76839a" strokeOpacity={0.3 * (1 - e)} strokeWidth="1.3" strokeLinecap="round" />

        {/* ===== looped: split connectors ===== */}
        <g opacity={e}>
          <line x1={CX} y1={EY - 18} x2={CX} y2={BOT} stroke="#76839a" strokeOpacity="0.3" strokeWidth="1.3" strokeLinecap="round" />
          <line x1={CX} y1={TOP} x2={CX} y2={LY + 20} stroke="#76839a" strokeOpacity="0.3" strokeWidth="1.3" strokeLinecap="round" />
        </g>

        {/* ===== the return arc — the only structural difference ===== */}
        <g opacity={e}>
          <path
            d={`M ${CX} ${A1Y} A ${RAD} ${RAD} 0 1 1 ${CX} ${A2Y}`}
            stroke="#5f7fa8" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="2.5 5.5" strokeLinecap="round"
          />
          <text x={CX + EX + RAD + 10} y={BY + 4} textAnchor="middle" fill="#54749c" fillOpacity="0.8" fontSize="10.5" fontFamily="JetBrains Mono" transform={`rotate(-90 ${CX + EX + RAD + 10} ${BY + 4})`}>
            same block, R times
          </text>
          {/* loop counter, inside the circle */}
          <text x={CX + EX} y={BY + RAD - 22} textAnchor="middle" fill="#54749c" fillOpacity="0.85" fontSize="11.5" fontFamily="JetBrains Mono">
            {settled && looped && loopIdx > 0 ? `loop ${loopIdx} / ${LOOPS}` : ' '}
          </text>
        </g>

        {/* ===== the eight independent blocks (fold away) — flash as the pulse passes ===== */}
        {BLOCK_Y.map((y, i) => {
          const n = BLOCK_Y.length
          // fold targets: the FIRST two layers merge into Prelude, the LAST two
          // into Coda, the rest into the shared Blocks_θ (paper Fig. 1a→1b)
          const fy = i <= 1 ? PY : i >= n - 2 ? CY2 : BY
          const yy = lerp(y, fy, e)
          const act = e < 0.5 ? Math.max(0, 1 - Math.abs(py - y) / 34) : 0
          return (
            <g key={i} transform={`translate(${CX} ${yy})`} opacity={1 - e}>
              <rect
                x={-78} y={-15} width={156} height={30} rx={15}
                fill="#5f7fa8" fillOpacity={0.18 + act * 0.38}
                stroke="#5f7fa8" strokeOpacity={0.7 + act * 0.3} strokeWidth={1.2 + act * 1.1}
                style={act > 0.05 ? { filter: `drop-shadow(0 0 ${8 * act}px rgba(95,127,168,${0.8 * act}))` } : undefined}
              />
              <text x={0} y={4.5} textAnchor="middle" fill="#3f5c82" fontSize="12" fontFamily="JetBrains Mono">
                Block_θ{i + 1}
              </text>
            </g>
          )
        })}

        {/* ===== the shared block (fades in) ===== */}
        <g transform={`translate(${CX} ${BY})`} opacity={e}>
          <rect
            x={-SBW / 2} y={-SBH / 2} width={SBW} height={SBH} rx={SBH / 2}
            fill="#db8b4d" fillOpacity={0.2 + sharedGlow * 0.3}
            stroke="#db8b4d" strokeOpacity={0.85 + sharedGlow * 0.15} strokeWidth={1.4 + sharedGlow}
          />
          <text x={0} y={1} textAnchor="middle" fill="#b06f35" fontSize="14.5" fontFamily="JetBrains Mono">Recurrent Blocks</text>
          <text x={0} y={17} textAnchor="middle" fill="#db8b4d" fillOpacity="0.7" fontSize="9.5" fontFamily="JetBrains Mono">
            shared θ
          </text>
        </g>

        {/* ===== LM head + output (top) ===== */}
        <g transform={`translate(${CX} ${LY})`}>
          <rect x={-95} y={-18} width={190} height={36} rx={18} fill="#76839a" fillOpacity={0.08 + lmGlow * 0.22} stroke="#76839a" strokeOpacity={0.45 + lmGlow * 0.45} strokeWidth={1.2 + lmGlow * 0.6}
            style={lmGlow > 0.05 ? { filter: `drop-shadow(0 0 ${8 * lmGlow}px rgba(118,131,154,${0.7 * lmGlow}))` } : undefined} />
          <text x={0} y={4.5} textAnchor="middle" fill="#5f6b7d" fontSize="13" fontFamily="JetBrains Mono">LM head</text>
        </g>
        <text x={CX} y={LY - 32} textAnchor="middle" fill="#76839a" fillOpacity="0.8" fontSize="12" fontFamily="JetBrains Mono">
          ↑ output logits
        </text>

        {/* ===== depth / parameter annotations ===== */}
        <g opacity={1 - e}>
          <text x={CX + 104} y={EY - 2} textAnchor="start" fill="#5f7fa8" fillOpacity="0.9" fontSize="10.5" fontFamily="JetBrains Mono">
            depth = 8 blocks
          </text>
          <text x={CX + 104} y={EY + 14} textAnchor="start" fill="#5f7fa8" fillOpacity="0.55" fontSize="10.5" fontFamily="JetBrains Mono">
            params = 8θ
          </text>
        </g>
        <g opacity={e}>
          <text x={CX + 104} y={EY - 2} textAnchor="start" fill="#db8b4d" fillOpacity="0.9" fontSize="10.5" fontFamily="JetBrains Mono">
            depth = R loops
          </text>
          <text x={CX + 104} y={EY + 14} textAnchor="start" fill="#db8b4d" fillOpacity="0.55" fontSize="10.5" fontFamily="JetBrains Mono">
            params = 1θ
          </text>
        </g>

        {/* ===== the pulse — hidden state as a miniature block ===== */}
        <g transform={`translate(${px} ${py})`} opacity={pulseOpacity}>
          <rect
            x={-22} y={-10} width={44} height={20} rx={10}
            fill="#6da574" fillOpacity="0.2"
            stroke="#6da574" strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 8px #6da574)` }}
          />
          <text x={0} y={3.5} textAnchor="middle" fill="#6da574" fontSize="9.5" fontFamily="JetBrains Mono">y</text>
        </g>
      </svg>

      <div className="mt-1 flex flex-col items-center gap-1">
        <div className="font-mono2 text-[11.5px] text-muted-foreground tracking-wide min-h-[20px]">
          {looped ? (
            <Tex>{String.raw`\boldsymbol{y}_{l+1} = \operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)`}</Tex>
          ) : (
            <Tex>{String.raw`\boldsymbol{h}^{(i+1)} = \operatorname{Block}_{\theta_i}(\boldsymbol{h}^{(i)}),\quad i = 1,\dots,8`}</Tex>
          )}
        </div>
        <div className="font-mono2 text-[10.5px] text-muted-foreground/70">
          identical input, identical head — the only difference is the recurrent middle
        </div>
      </div>
    </div>
  )
}
