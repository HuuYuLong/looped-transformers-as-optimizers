import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import katex from 'katex'
import { KATEX_FONTS_CSS, KATEX_CORE_CSS } from './katexSvgCss'
import { PRE_FLATTENED } from './preFlattened'
import { Tex, EQ } from './Tex'
import { useMotionClock } from '../hooks/useMotionClock'

/*
 * Unified framework — the optimizer circuit of paper Figure 1c.
 *
 *   token embedding → Prelude → Y_0 → [ R optimizer loops ] → Coda → LM head
 *
 * One loop = one gradient step on the fast weight, told by ONE dot at a time:
 *   1. project  — a gray dot leaves H^in, passes through Y_l, turns blue and
 *                 becomes o_l on the top leg        (o_l = H^in · Y_l)
 *   2. predict  — the dot rides through Recurrent Blocks, past t_l, into
 *                 f′(o_l) on the bottom leg
 *   3. update   — H^in stretches into a ROW, f′(o_l) stretches into a COLUMN;
 *                 their outer product is the gradient ∇ℒ (small matrix glyph),
 *                 which then rides the green leg into Y_l and is absorbed.
 *
 * Hovering / tapping any element selects it: it stays lit while the rest dims.
 */
const PHASES = [
  { label: 'project the fast weight', formula: String.raw`\boldsymbol{o}_l = \mathbf{H}^{\mathrm{in}}_l \mathbf{Y}_l + \boldsymbol{b}_l`, color: '#5f7fa8' },
  { label: 'blocks predict the target — prediction error', formula: String.raw`\boldsymbol{t}_l = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l),\quad f^{\prime}(\boldsymbol{o}_l)`, color: '#db8b4d' },
  { label: 'gradient update writes back into the fast weight', formula: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l - \eta_l\,(\mathbf{H}^{\mathrm{in}}_l)^{\top} f^{\prime}(\boldsymbol{o}_l)`, color: '#6da574' },
] as const

const R = 3
const LAP = 8000

const W = 620, H = 420
const YX = 300, YY = 230 // Y_l — the stationary center
const YW2 = 62, YH2 = 46 // Y_l pill size
const BXX = 512, BYY = YY // Recurrent Blocks — same row as Y_l
const BBW = 168, BBH = 56
// rectangular circuit corners
const T_Y = 108 // top horizontal leg y
const B_Y = 352 // bottom horizontal leg y
// node boxes on the circuit
const OX = 412, OY = T_Y // o_l — top leg
const TX2 = BXX, TY2 = 305 // t_l — right leg
const FX = 412, FY = B_Y // f′(o_l) — bottom leg
const HX = YX + (BXX - YX) / 3, HY = YY // H^in — one third of the way from Y_l to Recurrent Blocks
// left column: LM head / Coda / Prelude / token embedding
const PC_X = 92
const LM_Y = 118, CO_Y = 176, PR_Y = 284, EM_Y = 342

// KaTeX inside SVG foreignObject, made raster-proof. Two hard constraints:
//  1. MathML is unsupported by some mobile webviews (labels collapse to the
//     origin), so we use the HTML output.
//  2. The Kimi preview pipeline rasterizes the diagram into an isolated SVG
//     image: the clone cannot reach the page stylesheet, and any element-level
//     inline style deeper than the wrapper may be stripped — so KaTeX's
//     class-driven layout (vlist / table-cell / struts) collapses and every
//     glyph piles up at one point. We therefore FLATTEN the rendered formula:
//     mount the original KaTeX markup invisibly, measure every glyph's exact
//     position, and rebuild the label as a sequence of inline-block spans
//     whose layout is carried entirely by wrapper-level inline styles
//     (margin-left + relative top). Fonts ship as data URIs in a local <style>
//     so glyphs survive rasterization; positions no longer depend on CSS.
function flattenKatex(html: string, size: number, color: string): string {
  const probe = document.createElement('div')
  // NOTE: index.css sets .katex { font-size: 1.05em }, so the probe must match
  // the final rendered size (size * 1.05) for the measured offsets to be right.
  probe.style.cssText = `position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;font-size:${size * 1.05}px;`
  probe.innerHTML = html
  document.body.appendChild(probe)
  const base = probe.getBoundingClientRect()
  const leafs = [...probe.querySelectorAll('span')].filter(
    s => s.children.length === 0 && (s.textContent!.trim() || s.classList.contains('mspace'))
  ) as HTMLSpanElement[]
  const items = leafs.map(s => {
    const r = s.getBoundingClientRect()
    const cs = getComputedStyle(s)
    return {
      t: s.textContent || '', x: r.left - base.left, y: r.top - base.top, w: r.width,
      fs: parseFloat(cs.fontSize), fw: cs.fontWeight, fst: cs.fontStyle,
    }
  })
  probe.remove()
  if (!items.length) return html
  const baseFs = items[0].fs || size
  let out = ''
  let cursor = 0
  const refY = items[0].y
  for (const it of items) {
    const dx = it.x - cursor
    const dy = it.y - refY
    const style =
      `display:inline-block;vertical-align:top;margin-left:${(dx / baseFs).toFixed(4)}em;` +
      (Math.abs(dy) > 0.01 ? `position:relative;top:${(dy / baseFs).toFixed(4)}em;` : '') +
      (Math.abs(it.fs - baseFs) > 0.01 ? `font-size:${(it.fs / baseFs).toFixed(4)}em;` : '') +
      (it.fw && it.fw !== '400' && it.fw !== 'normal' ? `font-weight:${it.fw};` : '') +
      (it.fst && it.fst !== 'normal' ? `font-style:${it.fst};` : '')
    out += `<span style="${style}">${it.t === ' ' ? '&nbsp;' : it.t}</span>`
    cursor = it.x + it.w
  }
  return `<span style="display:inline-block;white-space:nowrap;font-size:${size * 1.05}px;line-height:1;color:${color}">${out}</span>`
}

function SvgTex({ x, y, tex, size = 11, color, anchor = 'middle', w = 180, pk }: {
  x: number, y: number, tex: string, size?: number, color: string, anchor?: 'middle' | 'start', w?: number, pk?: string
}) {
  const raw = useMemo(
    () => katex.renderToString(tex, { displayMode: false, throwOnError: false, output: 'html' }),
    [tex]
  )
  // Pre-flattened markup (rendered at build time) is the initial render so
  // snapshot pipelines see the correct layout immediately; a runtime effect
  // re-measures and swaps in a fresh flatten once fonts settle.
  const [flat, setFlat] = useState<string | null>(pk ? PRE_FLATTENED[pk] ?? null : null)
  useEffect(() => {
    let dead = false
    document.fonts.ready.then(() => {
      if (!dead) setFlat(flattenKatex(raw, size, color))
    })
    return () => { dead = true }
  }, [raw, size, color])
  const lineH = Math.ceil(size * 1.9)
  return (
    <foreignObject
      x={anchor === 'middle' ? x - w / 2 : x}
      y={y - lineH / 2}
      width={w}
      height={lineH}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div
        style={{
          width: w,
          height: lineH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: anchor === 'middle' ? 'center' : 'flex-start',
          overflow: 'visible',
          fontSize: size,
          lineHeight: 1,
          color,
        }}
      >
        <style>{KATEX_FONTS_CSS + KATEX_CORE_CSS}</style>
        <span dangerouslySetInnerHTML={{ __html: flat ?? raw }} />
      </div>
    </foreignObject>
  )
}

export default function LoopProcess() {
  const t = useMotionClock(2000 + LAP * 0.5) // frozen mid step-1 for reduced motion
  const [sel, setSel] = useState<string | null>(null) // hovered / tapped element
  const [phaseLock, setPhaseLock] = useState<number | null>(null) // hovered phase box → replay that phase

  // ---- linear timeline: Prelude → step 1..R → Coda, then restart ----
  const PRE_MS = 2000, CODA_MS = 2000
  const CYCLE = PRE_MS + R * LAP + CODA_MS
  const ct = t % CYCLE
  const locked = phaseLock !== null
  const inPre = !locked && ct < PRE_MS
  const inCoda = !locked && ct >= PRE_MS + R * LAP
  const loopT = Math.min(Math.max(ct - PRE_MS, 0), R * LAP)
  const lap = Math.floor(loopT / LAP)
  // hover a phase box → loop that phase alone until the pointer leaves
  const PHASE_MS = LAP / 3
  const lt = locked ? ((phaseLock ?? 0) + ((t % PHASE_MS) / PHASE_MS)) / 3 : (loopT % LAP) / LAP
  const loop = locked ? 1 : Math.min(lap + 1, R)
  const phase = lt < 1 / 3 ? 0 : lt < 2 / 3 ? 1 : 2
  const active = PHASES[phase]
  const lpRaw = (lt * 3) % 1
  const lp = lpRaw * lpRaw * (3 - 2 * lpRaw) // smoothstep — dots ease through the corners
  const glow = Math.sin(Math.min(lp * 1.4, 1) * Math.PI)

  const col = active.color
  const legOp = (i: number) => (inPre || inCoda ? 0.18 : phase === i ? 0.85 : 0.3)
  const legW = (i: number) => (phase === i ? 1.8 : 1.2)

  // select-to-highlight: the selected group stays lit, everything else dims
  const hl = (id: string) => (sel === null || sel === 'card' ? 1 : sel === id ? 1 : 0.15)
  const selectProps = (id: string) => ({
    opacity: hl(id),
    style: { transition: 'opacity 0.25s ease', cursor: 'pointer' } as const,
    onMouseEnter: () => setSel(id),
    onMouseLeave: () => setSel(null),
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSel(sel === id ? null : id) },
  })

  // a point moving along a polyline, progress 0..1
  const alongPath = (pts: [number, number][], p: number): [number, number] => {
    const segs = pts.slice(1).map((b, i) => {
      const a = pts[i]
      return Math.hypot(b[0] - a[0], b[1] - a[1])
    })
    const total = segs.reduce((s, x) => s + x, 0)
    let d = Math.min(Math.max(p, 0), 1) * total
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const a = pts[i], b = pts[i + 1]
        const k = segs[i] === 0 ? 0 : d / segs[i]
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
      }
      d -= segs[i]
    }
    return pts[pts.length - 1]
  }

  // --- the circuit legs ---
  // SEG0 (project, blue):   Y_l top → up → right → o_l
  const SEG0: [number, number][] = [[YX, YY - YH2 / 2], [YX, T_Y], [OX, OY]]
  // SEG1 (predict, orange): o_l → right → down through Blocks → t_l → f′(o_l)
  const SEG1: [number, number][] = [[OX, OY], [BXX, T_Y], [BXX, B_Y], [FX, FY]]
  // SEG2 (update, green):   f′(o_l) → left → up into Y_l bottom
  const SEG2: [number, number][] = [[FX, FY], [YX, FY], [YX, YY + YH2 / 2]]

  // ONE dot per phase:
  // phase 0 — H^in flows into Y_l, through it, and out the top as o_l
  const P0: [number, number][] = [[HX - 28, HY], [YX + YW2 / 2, YY], [YX, YY], [YX, T_Y], [OX - 24, OY]]
  const p0Dot = alongPath(P0, lp)
  const p0InY = p0Dot[0] > YX + YW2 / 2 - 4 || (Math.abs(p0Dot[0] - YX) < YW2 / 2 && p0Dot[1] < YY + 1) // past the center → blue
  // phase 1 — o_l through the blocks, past t_l, into f′(o_l)
  const P1: [number, number][] = [[OX + 24, OY], [BXX, T_Y], [BXX, B_Y], [FX + 32, FY]]
  const p1Dot = alongPath(P1, lp)
  // phase 2 — the gradient rides the green leg into Y_l
  const P2: [number, number][] = [[FX - 32, FY], [YX, FY], [YX, YY + YH2 / 2]]
  const p2Dot = alongPath(P2, lp)

  // update phase: a 3×3 gradient matrix condenses at f′(o_l) — the outer
  // product (H^in)ᵀ · f′(o_l) — rides the green leg to Y_l, then the dot
  // carries it up into the fast weight
  const matK = phase === 2 ? Math.sin(Math.min(Math.max((lp - 0.08) / 0.6, 0), 1) * Math.PI) : 0
  const gFlash = phase === 2 ? Math.sin(Math.min(lp / 0.55, 1) * Math.PI) : 0 // green flash as the outer product forms
  const matPos = alongPath([[FX, FY], [YX, FY]], Math.min(Math.max((lp - 0.15) / 0.5, 0), 1))

  // Prelude / Coda chains: token embedding → Prelude → Y ; Y → Coda → LM head
  const PRE_PATH: [number, number][] = [
    [PC_X, EM_Y - 18],
    [PC_X, PR_Y],
    [PC_X + 74, PR_Y],
    [YX - YW2 / 2, PR_Y],
    [YX - YW2 / 2, YY + 12],
  ]
  const CODA_PATH: [number, number][] = [
    [YX - YW2 / 2, YY - 12],
    [YX - YW2 / 2, CO_Y],
    [PC_X + 74, CO_Y],
    [PC_X, CO_Y],
    [PC_X, LM_Y + 18],
  ]
  // Prelude / Coda chains run on their own eased clocks so the dot never snaps
  // at the hand-off — inPre flips at a raw frame boundary, and without easing
  // the first/last frames jump along the path (the "fast weight" wobble).
  const easeIO = (u: number) => u * u * (3 - 2 * u)
  const preDot = alongPath(PRE_PATH, inPre ? easeIO(Math.min(ct / PRE_MS, 1)) : 0)
  const codaDot = alongPath(CODA_PATH, inCoda ? easeIO(Math.min((ct - PRE_MS - R * LAP) / CODA_MS, 1)) : 0)

  const boxOp = (i: number) => (inPre || inCoda ? 0.3 : phase === i ? 1 : 0.28)

  return (
    <div
      className="rounded-xl border border-border bg-background/60 p-4 md:p-6 overflow-hidden"
      onMouseEnter={() => setSel('card')}
      onMouseLeave={() => setSel(null)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
          One loop = one gradient step on the fast weight
        </div>
        <div className="font-mono2 text-[11px] text-muted-foreground">
          {!inPre && !inCoda && (
            <>step <span className="text-green-soft">{loop}</span> / {R}</>
          )}
        </div>
      </div>

      <div className="-mx-2 px-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 'min(640px, 82vh)' }} fill="none" role="img" aria-label="One optimizer-style loop, Figure 1c" onClick={() => setSel(null)}>
          {/* ===== H^in — small gray input map, right of Y_l ===== */}
          <g {...selectProps('hin')}>
            <line
              x1={HX - 28} y1={HY} x2={YX + YW2 / 2} y2={YY}
              stroke="#76839a" strokeOpacity={(phase === 0 || phase === 2) && !inPre && !inCoda ? 0.8 : 0.2} strokeWidth="1.3"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g transform={`translate(${HX} ${HY})`} opacity={boxOp(0)}>
              <rect x={-28} y={-12} width={56} height={24} rx={12} fill="#fff" fillOpacity="0.85" stroke={gFlash > 0.05 ? '#6da574' : '#76839a'} strokeOpacity={0.7 + gFlash * 0.3} strokeWidth={1.1 + gFlash * 0.7} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-28} y={-12} width={56} height={24} rx={12} fill={gFlash > 0.05 ? '#6da574' : '#76839a'} fillOpacity={(phase === 0 || phase === 2 ? 0.18 : 0.08) + gFlash * 0.2} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={11} color={gFlash > 0.05 ? '#4e8a56' : '#5f6b7d'} tex={String.raw`\mathbf{H}^{\mathrm{in}}`} pk="hin" />
            </g>
          </g>

          {/* ===== project leg: Y_l → o_l ===== */}
          <g {...selectProps('o')}>
            <path
              d={`M ${SEG0.map(p => p.join(' ')).join(' L ')}`}
              stroke="#5f7fa8" strokeOpacity={legOp(0)} strokeWidth={legW(0)} strokeDasharray="2.5 5.5" strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g opacity={phase === 0 ? 0.95 : 0.22} style={{ transition: 'opacity 0.3s ease' }}>
              <SvgTex x={YX + 12} y={(YY - YH2 / 2 + T_Y) / 2 + 4} size={10.5} color="#5f7fa8" anchor="start" tex={EQ.proj} pk="proj" />
            </g>
            <g transform={`translate(${OX} ${OY})`} opacity={boxOp(0)}>
              <rect x={-24} y={-11} width={48} height={22} rx={11} fill="#fff" fillOpacity="0.85" stroke="#5f7fa8" strokeOpacity={phase === 0 ? 0.95 : 0.35} strokeWidth={phase === 0 ? 1.6 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-24} y={-11} width={48} height={22} rx={11} fill="#5f7fa8" fillOpacity={phase === 0 ? 0.22 : 0.1} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={11} color="#3f5c82" tex={String.raw`\boldsymbol{o}_l`} pk="ol" />
            </g>
          </g>

          {/* ===== predict leg: o_l → Blocks → t_l ===== */}
          <g {...selectProps('blocks')}>
            <path
              d={`M ${SEG1.map(p => p.join(' ')).join(' L ')}`}
              stroke="#db8b4d" strokeOpacity={legOp(1)} strokeWidth={legW(1)} strokeDasharray="2.5 5.5" strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g transform={`translate(${BXX} ${BYY})`}>
              <rect
                x={-BBW / 2} y={-BBH / 2} width={BBW} height={BBH} rx={BBH / 2}
                fill="#fff" fillOpacity="0.9"
                stroke="#db8b4d"
                strokeOpacity={phase === 1 ? 0.9 : 0.55}
                strokeWidth={phase === 1 ? 1.8 + glow : 1.3}
                style={{ transition: 'all 0.25s ease' }}
              />
              <rect
                x={-BBW / 2} y={-BBH / 2} width={BBW} height={BBH} rx={BBH / 2}
                fill="#db8b4d"
                fillOpacity={phase === 1 ? 0.26 + glow * 0.18 : 0.15}
                stroke="none"
                style={{ transition: 'all 0.25s ease' }}
              />
              <text x={0} y={1} textAnchor="middle" fill="#b06f35" fontSize="13" fontFamily="JetBrains Mono">Recurrent Blocks</text>
              <text x={-8} y={15} textAnchor="end" fill="#db8b4d" fillOpacity="0.7" fontSize="8.5" fontFamily="JetBrains Mono">predict target</text>
              <SvgTex x={-2} y={15} size={9} color="#db8b4d" anchor="start" w={40} tex={String.raw`\boldsymbol{t}_l`} pk="tl" />
            </g>
            {/* t_l — predicted target (right leg) */}
            <g transform={`translate(${TX2} ${TY2})`} opacity={boxOp(1)}>
              <rect x={-24} y={-11} width={48} height={22} rx={11} fill="#fff" fillOpacity="0.85" stroke="#db8b4d" strokeOpacity={phase === 1 ? 0.95 : 0.35} strokeWidth={phase === 1 ? 1.6 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-24} y={-11} width={48} height={22} rx={11} fill="#db8b4d" fillOpacity={phase === 1 ? 0.22 : 0.1} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={11} color="#b06f35" tex={String.raw`\boldsymbol{t}_l`} pk="tl" />
            </g>
          </g>

          {/* ===== prediction error: o_l and t_l → f′(o_l) ===== */}
          <g {...selectProps('f')}>
            <line
              x1={OX} y1={OY + 11} x2={FX} y2={FY - 11}
              stroke="#b06f35" strokeOpacity={phase === 1 && !inPre && !inCoda ? 0.6 : 0.12} strokeWidth="1" strokeDasharray="2 4"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g transform={`translate(${FX} ${FY})`} opacity={boxOp(1)}>
              <rect x={-32} y={-11} width={64} height={22} rx={11} fill="#fff" fillOpacity="0.85" stroke={gFlash > 0.05 ? '#6da574' : '#db8b4d'} strokeOpacity={phase >= 1 ? 0.95 : 0.35} strokeWidth={phase >= 1 ? 1.6 + gFlash * 0.4 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-32} y={-11} width={64} height={22} rx={11} fill={gFlash > 0.05 ? '#6da574' : '#db8b4d'} fillOpacity={(phase >= 1 ? 0.22 : 0.1) + gFlash * 0.18} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={10.5} color={gFlash > 0.05 ? '#4e8a56' : '#b06f35'} tex={String.raw`f^{\prime}(\boldsymbol{o}_l)`} pk="fprime" />
            </g>
          </g>

          {/* ===== update leg: ∇ℒ = (H^in)ᵀ · f′(o_l) → Y_l ===== */}
          <g {...selectProps('grad')}>
            <path
              d={`M ${SEG2.map(p => p.join(' ')).join(' L ')}`}
              stroke="#6da574" strokeOpacity={legOp(2)} strokeWidth={legW(2)} strokeDasharray="2.5 5.5" strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g opacity={phase === 2 ? 0.9 : 0.2} style={{ transition: 'opacity 0.3s ease' }}>
              <SvgTex x={(FX + YX) / 2} y={FY - 20} size={10} color="#6da574" w={240} tex={EQ.grad} pk="grad" />
            </g>
            {/* the gradient condenses as a 3×3 matrix at f′(o_l), then rides home */}
            <g transform={`translate(${matPos[0]} ${matPos[1]})`} opacity={matK}>
              {[-1, 0, 1].map((r) =>
                [-1, 0, 1].map((c) => (
                  <rect key={`${r}${c}`} x={c * 7 - 2.5} y={r * 7 - 2.5} width={5} height={5} rx={1} fill="#6da574" fillOpacity={0.35 + 0.4 * ((r + c + 2) % 3) / 2} />
                ))
              )}
            </g>
          </g>

          {/* ===== Y_l — the fast weight being optimized, dead center ===== */}
          {(() => {
            const hue = '#6da574' // fast weight stays green at every step
            const absorb = !inPre && !inCoda && phase === 2 ? Math.sin(Math.min(Math.max((lp - 0.45) / 0.55, 0), 1) * Math.PI) : 0
            const yTex = inPre ? String.raw`\mathbf{Y}_0` : inCoda ? String.raw`\mathbf{Y}_R` : String.raw`\mathbf{Y}_{${loop - 1}}`
            return (
              <g transform={`translate(${YX} ${YY})`} {...selectProps('y')}>
                <rect
                  x={-YW2 / 2} y={-YH2 / 2} width={YW2} height={YH2} rx={YH2 / 2}
                  fill="#fff" fillOpacity="0.88"
                  stroke={hue}
                  strokeWidth={1.5 + glow * 0.7 + absorb * 0.8}
                  style={{ transition: 'stroke 0.25s ease', filter: `drop-shadow(0 0 18px ${col})` }}
                />
                <rect
                  x={-YW2 / 2} y={-YH2 / 2} width={YW2} height={YH2} rx={YH2 / 2}
                  fill={hue}
                  fillOpacity={0.22 + glow * 0.16 + absorb * 0.18}
                  stroke="none"
                  style={{ transition: 'fill 0.25s ease' }}
                />
                <SvgTex x={0} y={1} size={13} color={hue} tex={yTex} pk={inPre ? 'Y0' : inCoda ? 'YR' : `Y${loop}`} />
                <text x={0} y={YH2 / 2 + 16} textAnchor="middle" fill="#5f6b7d" fillOpacity="0.75" fontSize="9" fontFamily="JetBrains Mono">
                  fast weight
                </text>
              </g>
            )
          })()}

          {/* ===== input chain: token embedding → Prelude → Y_0 ===== */}
          <g {...selectProps('prelude')}>
            <path
              d={`M ${PRE_PATH.map(p => p.join(' ')).join(' L ')}`}
              stroke="#76839a" strokeOpacity={inPre ? 0.65 : 0.22} strokeWidth={inPre ? 1.7 : 1.2} strokeDasharray="2.5 5.5" strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g transform={`translate(${PC_X} ${EM_Y})`}>
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#fff" fillOpacity="0.88" stroke="#76839a" strokeOpacity={inPre ? 0.75 : 0.4} strokeWidth={inPre ? 1.5 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#76839a" fillOpacity={inPre ? 0.16 + glow * 0.14 : 0.07} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <text x={0} y={4} textAnchor="middle" fill="#5f6b7d" fontSize="11" fontFamily="JetBrains Mono">token embedding</text>
            </g>
            <g transform={`translate(${PC_X} ${PR_Y})`}>
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#fff" fillOpacity="0.88" stroke="#76839a" strokeOpacity={inPre ? 0.75 : 0.4} strokeWidth={inPre ? 1.5 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#76839a" fillOpacity={inPre ? 0.16 + glow * 0.14 : 0.07} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={11} color="#5f6b7d" tex={String.raw`\text{Prelude } \mathbf{Y}_0`} pk="prelude" />
            </g>
            <text x={(PC_X + 74 + YX - YW2 / 2) / 2} y={PR_Y + 18} textAnchor="middle" fill="#5f6b7d" fillOpacity={inPre ? 0.9 : 0.45} fontSize="8.5" fontFamily="JetBrains Mono" style={{ transition: 'fill-opacity 0.3s ease' }}>
              initialize Y₀
            </text>
          </g>

          {/* ===== output chain: Y_R → Coda → LM head ===== */}
          <g {...selectProps('coda')}>
            <path
              d={`M ${CODA_PATH.map(p => p.join(' ')).join(' L ')}`}
              stroke="#76839a" strokeOpacity={inCoda ? 0.65 : 0.22} strokeWidth={inCoda ? 1.7 : 1.2} strokeDasharray="2.5 5.5" strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
            <g transform={`translate(${PC_X} ${CO_Y})`}>
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#fff" fillOpacity="0.88" stroke="#76839a" strokeOpacity={inCoda ? 0.75 : 0.4} strokeWidth={inCoda ? 1.5 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#76839a" fillOpacity={inCoda ? 0.16 + glow * 0.14 : 0.07} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <SvgTex x={0} y={0} size={11} color="#5f6b7d" tex={String.raw`\text{Coda } \mathbf{Y}_R`} pk="coda" />
            </g>
            <g transform={`translate(${PC_X} ${LM_Y})`}>
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#fff" fillOpacity="0.88" stroke="#76839a" strokeOpacity={inCoda ? 0.75 : 0.4} strokeWidth={inCoda ? 1.5 : 1.1} style={{ transition: 'all 0.3s ease' }} />
              <rect x={-74} y={-16} width={148} height={32} rx={16} fill="#76839a" fillOpacity={inCoda ? 0.16 + glow * 0.14 : 0.07} stroke="none" style={{ transition: 'all 0.3s ease' }} />
              <text x={0} y={4} textAnchor="middle" fill="#5f6b7d" fontSize="11" fontFamily="JetBrains Mono">LM head</text>
            </g>
            <text x={(YX - YW2 / 2 + PC_X + 74) / 2} y={CO_Y + 18} textAnchor="middle" fill="#5f6b7d" fillOpacity={inCoda ? 0.9 : 0.45} fontSize="8.5" fontFamily="JetBrains Mono" style={{ transition: 'fill-opacity 0.3s ease' }}>
              read out Y_R
            </text>
            <text x={PC_X + 84} y={CO_Y + 4} textAnchor="start" fill="#5f6b7d" fillOpacity={inCoda ? 0.9 : 0.45} fontSize="8.5" fontFamily="JetBrains Mono" style={{ transition: 'fill-opacity 0.3s ease' }}>
              at l = R
            </text>
          </g>

          {/* ===== ONE flow dot per phase — drawn last, above the boxes ===== */}
          {!inPre && !inCoda && phase === 0 && (
            <circle cx={p0Dot[0]} cy={p0Dot[1]} r={3.2} fill={p0InY ? '#5f7fa8' : '#76839a'} style={{ transition: 'fill 0.2s ease' }} />
          )}
          {!inPre && !inCoda && phase === 1 && (
            <circle cx={p1Dot[0]} cy={p1Dot[1]} r={3.2} fill="#db8b4d" />
          )}
          {!inPre && !inCoda && phase === 2 && lp > 0.55 && (
            <circle cx={p2Dot[0]} cy={p2Dot[1]} r={3.2} fill="#6da574" />
          )}
          {inPre && (
            <circle cx={preDot[0]} cy={preDot[1]} r={3.2} fill="#5f6b7d" />
          )}
          {inCoda && (
            <circle cx={codaDot[0]} cy={codaDot[1]} r={3.2} fill="#5f6b7d" />
          )}
        </svg>
      </div>

      {/* phase readout */}
      <div className="mt-1 h-[88px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={inPre ? `${lap}-pre` : inCoda ? `${lap}-coda` : `${lap}-${phase}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-full"
          >
            {inPre ? (
              <span className="font-mono2 text-[12px] md:text-[13px] tracking-wide" style={{ color: '#76839a' }}>
                prelude — initialize the fast weight:{' '}
                <Tex>{String.raw`\mathbf{Y}_0 = \operatorname{Prelude}_{\phi}(\boldsymbol{x})`}</Tex>
              </span>
            ) : inCoda ? (
              <span className="font-mono2 text-[12px] md:text-[13px] tracking-wide" style={{ color: '#76839a' }}>
                coda — read out the final state:{' '}
                <Tex>{String.raw`\hat{\boldsymbol{y}} = \operatorname{Coda}_{\psi}(\mathbf{Y}_R)`}</Tex>
              </span>
            ) : (
              <span className="font-mono2 text-[12px] md:text-[13px] tracking-wide" style={{ color: active.color }}>
                <span className="text-muted-foreground">step {loop} · phase {phase + 1}/3 —</span> {active.label}:{' '}
                <Tex>{active.formula}</Tex>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* phase boxes — hover (or tap) to replay that phase until the pointer leaves */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {PHASES.map((p, i) => {
          const on = locked ? phaseLock === i : !inPre && !inCoda && phase === i
          const short = ['project', 'predict', 'update'][i]
          return (
            <button
              key={p.label}
              type="button"
              onMouseEnter={() => setPhaseLock(i)}
              onMouseLeave={() => setPhaseLock(null)}
              onClick={() => setPhaseLock(phaseLock === i ? null : i)}
              className="rounded-lg border px-3 py-1.5 font-mono2 text-[11px] tracking-wide transition-all duration-300"
              style={{
                borderColor: on ? p.color : 'hsl(var(--border))',
                background: on ? `${p.color}14` : 'transparent',
                color: on ? p.color : 'hsl(var(--muted-foreground))',
                boxShadow: on ? `0 0 0 1px ${p.color}40` : undefined,
              }}
              aria-pressed={on}
            >
              <span className="opacity-60 mr-1.5">{i + 1}</span>
              {short}
              <span
                className="inline-block ml-2 h-1.5 rounded-full align-middle transition-all duration-300"
                style={{ width: on ? 16 : 6, background: p.color, opacity: on ? 1 : 0.3 }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-center font-mono2 text-[10px] text-muted-foreground/60">
        hover a phase box to replay that phase · hover or tap any element to highlight it · diagram adapted from paper Fig. 1b–1c
      </div>
    </div>
  )
}
