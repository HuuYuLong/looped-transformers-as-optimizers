import { useEffect, useRef, useState } from 'react'
import { Reveal, SectionTag, SectionTitle } from './Reveal'
import { Tex, EQ } from './Tex'

const pillars = [
  {
    name: 'Projection',
    eq: EQ.proj,
    desc: 'How the fast weight is read out: input injection, gating, expanded-state readouts — each defines a different projection.',
    color: '#5f7fa8',
    textClass: 'text-blue-soft',
  },
  {
    name: 'Local Objective',
    eq: String.raw`\mathcal{L} := f(\boldsymbol{o}_l), \quad \boldsymbol{t}_l = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    desc: 'What the update optimizes. t_l is detached only for the closed-form derivation — training back-propagates through it. Most existing loops map to a negative inner-product objective; OperLoop uses a delta objective instead.',
    color: '#db8b4d',
    textClass: 'text-orange-soft',
  },
  {
    name: 'Optimizer Rule',
    eq: String.raw`\mathbf{Y}_{l+1} = \mathbf{Y}_{l} - \eta_l \left( \nabla_{\mathbf{Y}_l}\mathcal{L} + \mathbf{\Lambda}_l \mathbf{Y}_{l} \right)`,
    desc: 'How the state is updated: decay Λ controls retention, step size η controls update scale — like weight decay and LR scheduling.',
    color: '#6da574',
    textClass: 'text-green-soft',
  },
]

type Mapping = {
  model: string
  links?: { label: string; href: string }[]
  state: string
  proj: string
  map: string
  decay: string
  step: string
  mismatch: boolean
  note: string
}

const mappings: Mapping[] = [
  {
    model: 'Ouro',
    links: [{ label: 'Ouro', href: 'https://arxiv.org/abs/2510.25741' }],
    state: String.raw`\boldsymbol{y}_l \in \mathbb{R}^{d \times 1}`,
    proj: String.raw`\boldsymbol{o}_l = \boldsymbol{y}_l`,
    map: String.raw`\mathbf{H}^{\mathrm{in}}_l = \mathbf{I}_d`, decay: String.raw`\mathbf{\Lambda}_l = \mathbf{I}_d`, step: String.raw`\eta_l = 1`, mismatch: false, note: 'Exact special case (no bias)',
  },
  {
    model: 'Parcae',
    links: [{ label: 'Parcae', href: 'https://arxiv.org/abs/2604.12946' }],
    state: String.raw`\boldsymbol{y}_l \in \mathbb{R}^{d \times 1}`,
    proj: String.raw`\boldsymbol{o}_l = \bar{\mathbf{A}}\boldsymbol{y}_l + \bar{\mathbf{B}}\boldsymbol{e}`,
    map: String.raw`\mathbf{H}^{\mathrm{in}}_l = \bar{\mathbf{A}}`, decay: String.raw`\mathbf{\Lambda}_l = \mathbf{I}_d`, step: String.raw`\eta_l = 1`, mismatch: true, note: 'Missing Āᵀ in writeback',
  },
  {
    model: 'HyperLoop',
    links: [{ label: 'HyperLoop', href: 'https://arxiv.org/abs/2604.21254' }],
    state: String.raw`\mathbf{Y}_l \in \mathbb{R}^{r \times d}`,
    proj: String.raw`\boldsymbol{o}_l = \mathbf{H}^{\mathrm{pre}}_l\mathbf{Y}_l`,
    map: String.raw`\mathbf{H}^{\mathrm{in}}_l = \mathbf{H}^{\mathrm{pre}}_l`, decay: String.raw`\mathbf{I}_r - \mathbf{\Lambda}_l = \mathbf{H}^{\mathrm{res}}_l`, step: String.raw`\eta_l = 1`, mismatch: true, note: 'H^pre ≠ H^post',
  },
]

/* Animated derivation: projection → target → chain-rule gradient → gradient step → closed form */
const derivationSteps = [
  {
    label: 'Projection',
    tex: String.raw`\boldsymbol{o}_l = \mathbf{H}_l^{\mathrm{in}}\mathbf{Y}_l + \boldsymbol{b}_l`,
    caption: 'read the fast weight through the input map',
  },
  {
    label: 'Local objective',
    tex: String.raw`\mathcal{L} := f(\boldsymbol{o}_l), \quad \boldsymbol{t}_l = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    caption: 'the shared blocks predict the target the update optimizes toward',
  },
  {
    label: 'Gradient',
    tex: String.raw`\nabla_{\mathbf{Y}_l}\mathcal{L} = (\mathbf{H}^{\mathrm{in}}_l)^{\top} f^{\prime}(\boldsymbol{o}_l)`,
    caption: 'chain rule through the projection — hence the transpose',
  },
  {
    label: 'Optimizer step',
    tex: String.raw`\mathbf{Y}_{l+1} = \mathbf{Y}_{l} - \eta_l \left( \nabla_{\mathbf{Y}_l}\mathcal{L} + \mathbf{\Lambda}_l \mathbf{Y}_{l} \right)`,
    caption: 'gradient descent with decay Λ and step size η',
  },
  {
    label: 'Closed form',
    tex: EQ.prop1,
    caption: 'substitute the gradient — this is Proposition 1',
  },
]

const linkCls =
  'underline decoration-dotted underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground hover:text-gold-soft transition-colors'

/** Derivation that reveals itself line by line, then loops; pauses while hovered. */
function Derivation() {
  const [n, setN] = useState(1)
  const hover = useRef(false)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (hover.current) return
      setN((v) => (v % derivationSteps.length) + 1)
    }, 1400)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div
      className="rounded-xl border border-border bg-card/60 px-5 md:px-8 py-6"
      onMouseEnter={() => {
        hover.current = true
        setN(derivationSteps.length)
      }}
      onMouseLeave={() => {
        hover.current = false
        setN(1)
      }}
    >
      <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
        Derivation — line by line (hover to hold)
      </div>
      <ol className="space-y-2.5">
        {derivationSteps.map((s, i) => {
          const shown = i < n
          return (
            <li
              key={s.label}
              className="grid md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 transition-opacity duration-500"
              style={{ opacity: shown ? 1 : 0.22 }}
            >
              <span className="font-mono2 text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground whitespace-nowrap">
                {String(i + 1)} · {s.label}
              </span>
              <span className={`overflow-x-auto eq-scroll ${shown ? '' : 'pointer-events-none'}`}>
                <Tex>{s.tex}</Tex>
              </span>
              <span className="hidden md:block text-[12.5px] text-muted-foreground/80">{s.caption}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function Framework() {
  return (
    <section id="framework" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionTag>01 — Unify · One Framework for All Loops</SectionTag>
        <SectionTitle>
          One equation. <span className="text-orange-soft">Three choices.</span> Every loop transition, derived in closed form.
        </SectionTitle>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <Derivation />
        <div className="mt-2 text-center font-mono2 text-[12px] text-muted-foreground tracking-wide">
          Proposition 1 — optimization interpretation of loop transitions
        </div>
      </Reveal>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <Reveal key={p.name} delay={0.1 + i * 0.1}>
            <div className="h-full rounded-xl border border-border bg-card/40 p-6 flex flex-col">
              <div className={`font-mono2 text-[11px] tracking-[0.25em] uppercase ${p.textClass}`}>{p.name}</div>
              <div className="mt-5 overflow-x-auto eq-scroll flex-1">
                <Tex>{p.eq}</Tex>
              </div>
              <p className="mt-4 text-[13.5px] text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* mapping table */}
      <Reveal delay={0.15} className="mt-10">
        <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
          Mapping existing loops into the framework
        </div>
        <div className="rounded-xl border border-border bg-card/60 px-6 md:px-10 py-6 mb-4 overflow-x-auto eq-scroll">
          <Tex block className="text-center">
            {EQ.prop1}
          </Tex>
          <div className="mt-2 text-center font-mono2 text-[12px] text-muted-foreground tracking-wide">
            Every row below is a special case of this closed-form update
          </div>
        </div>
        <div className="overflow-x-auto eq-scroll rounded-xl border border-border">
          <table className="w-full text-[13.5px] min-w-[920px]">
            <thead>
              <tr className="bg-secondary/50 text-left font-mono2 text-[11px] tracking-widest uppercase text-muted-foreground">
                <th className="px-5 py-3.5 font-medium">Model</th>
                <th className="px-5 py-3.5 font-medium">Fast weight</th>
                <th className="px-5 py-3.5 font-medium">Projection</th>
                <th className="px-5 py-3.5 font-medium">Input map</th>
                <th className="px-5 py-3.5 font-medium">Decay</th>
                <th className="px-5 py-3.5 font-medium">Step size</th>
                <th className="px-5 py-3.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.model} className="border-t border-border">
                  <td className="px-5 py-4 text-foreground font-medium whitespace-nowrap">
                    {m.links?.[0] ? (
                      <a href={m.links[0].href} target="_blank" rel="noreferrer" className={linkCls}>
                        {m.model}
                      </a>
                    ) : (
                      m.model
                    )}
                  </td>
                  <td className="px-5 py-4 text-[13px]"><Tex>{m.state}</Tex></td>
                  <td className="px-5 py-4 text-[13px]"><Tex>{m.proj}</Tex></td>
                  <td className="px-5 py-4 text-[13px]"><Tex>{m.map}</Tex></td>
                  <td className="px-5 py-4 text-[13px]"><Tex>{m.decay}</Tex></td>
                  <td className="px-5 py-4 text-[13px]"><Tex>{m.step}</Tex></td>
                  <td className="px-5 py-4">
                    {m.mismatch ? (
                      <span className="text-red-soft font-mono2 text-[12px]">✕ {m.note}</span>
                    ) : (
                      <span className="text-green-soft font-mono2 text-[12px]">✓ {m.note}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground leading-relaxed max-w-3xl">
          Under the optimizer update rule, the gradient requires the <em>transpose</em> of the projection's input map.
          Parcae omits <Tex>{EQ.parcaeMissing}</Tex>; HyperLoop uses separate read/write maps. These are{' '}
          <span className="text-red-soft">input-map mismatches</span> — and correcting them is the framework's first application.
        </p>
      </Reveal>
    </section>
  )
}
