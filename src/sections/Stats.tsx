import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import LoopProcess from './LoopProcess'

function Counter({ to, decimals = 0, prefix = '', suffix = '', duration = 1.6 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf: number
    const step = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(to * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])
  return (
    <span ref={ref}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}

const stats = [
  { value: 52, prefix: '≈', suffix: '%', label: 'of the parameters', note: '0.56× (5B) / 0.48× (10B) of the non-looped baseline, at matched training FLOPs', color: 'text-foreground' },
  { value: 1.69, decimals: 2, prefix: '+', suffix: '', label: 'EM avg. over non-looped', note: 'EM = exact match on generation tasks (math, code, reasoning). +1.69 at 5B scale, +1.04 at 10B', color: 'text-foreground' },
  { value: 43.04, decimals: 2, suffix: '', label: 'BBH (10B scale)', note: 'vs. 41.86 for the non-looped baseline', color: 'text-foreground' },
  { value: 31.08, decimals: 2, suffix: '', label: 'GSM8K CoT @ Loop6', note: 'up from 17.13 at Loop3 — compute scaling works', color: 'text-foreground' },
]

const contributions = [
  {
    tag: 'REFINE',
    color: 'border-orange-soft/60',
    hover: 'hover:border-orange-soft',
    title: 'A consistency check for existing loops',
    href: '#mismatch',
    body: 'Read through the framework, the transitions of Parcae and HyperLoop write back through a different map than they read with. Tying the two — a one-line change, with no new components — lowers training loss and perplexity and raises commonsense accuracy in our controlled runs.',
  },
  {
    tag: 'DESIGN',
    color: 'border-green-soft/60',
    hover: 'hover:border-green-soft',
    title: 'Designing a new loop',
    href: '#operloop',
    body: 'OperLoop is derived, not discovered: a delta objective, explicit weight decay, and an adaptive step size — each ablation shows the piece earns its place.',
  },
  {
    tag: 'GUIDE',
    color: 'border-border',
    hover: 'hover:border-foreground/50',
    title: 'An optimizer’s lens on loop design',
    href: '#roadmap',
    body: 'The optimization view turns loop-transition design from heuristic search into principled choices — it flags which existing transitions need alignment and prescribes the write-back geometry of new ones.',
  },
]

export default function Stats() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-6 py-14 md:py-16">
        <div className="font-mono2 text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-10 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-muted-foreground/50" />
          What the framework contributes — at a glance
        </div>
        {/* 01 · UNIFY — full-width, paired with the loop diagram */}
        <div className="border-t-2 border-blue-soft/60 pt-6 mb-10">
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-10 gap-y-6 items-center">
            <a href="#framework" className="group block">
              <div className="font-mono2 text-[10.5px] tracking-[0.25em] text-muted-foreground/70 group-hover:text-blue-soft transition-colors">01 · UNIFY</div>
              <div className="mt-2 text-[17px] text-foreground font-medium group-hover:text-blue-soft transition-colors">
                One framework for all loops
                <span className="inline-block ml-2 text-[13px] text-muted-foreground/50 group-hover:text-blue-soft group-hover:translate-x-0.5 transition-all">→</span>
              </div>
              <div className="mt-3 text-[13.5px] text-muted-foreground leading-relaxed max-w-md">
                Every loop transition is decomposed into a projection, a local objective, and an optimizer update
                rule — one equation, derived in closed form. The animation shows what one loop actually does:
                one gradient step on the fast weight, told one phase at a time.
              </div>
              <div className="mt-4 font-mono2 text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground/60">
                Overview — what a loop actually does
              </div>
            </a>
            <LoopProcess />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-8 mb-14">
          {contributions.map((c, i) => (
            <a key={c.tag} href={c.href} className={`group block border-t-2 ${c.color} ${c.hover} pt-5 transition-colors`}>
              <div className="font-mono2 text-[10.5px] tracking-[0.25em] text-muted-foreground/70">
                {String(i + 2).padStart(2, '0')} · {c.tag}
              </div>
              <div className="mt-2 text-[15.5px] text-foreground font-medium">
                {c.title}
                <span className="inline-block ml-2 text-[12px] text-muted-foreground/40 group-hover:text-foreground/70 group-hover:translate-x-0.5 transition-all">→</span>
              </div>
              <div className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">{c.body}</div>
            </a>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {stats.map((s) => (
            <div key={s.label}>
              <div className={`font-display font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight ${s.color}`}>
                <Counter to={s.value} decimals={s.decimals ?? 0} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-[15px] text-foreground font-medium">{s.label}</div>
              <div className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
