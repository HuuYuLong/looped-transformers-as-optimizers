import { Reveal, SectionTag, SectionTitle } from './Reveal'
import { Tex, EQ } from './Tex'
import { GroupBars, CH } from './PairBars'

/* OperLoop vs HyperLoop — same expanded-state backbone, same params and FLOPs (paper main table).
 * Each metric gets its own zoomed axis so the improvements read clearly at a glance. */
const VS_AXES = [
  {
    title: 'PPL (Lamb.) ↓',
    tickValues: [4.5, 5.5, 6.5, 7.5, 8],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 6.56 }, bars: [
        { name: 'HyperLoop', value: 7.68, color: CH.dim },
        { name: 'OperLoop', value: 7.21, color: CH.green },
      ]},
      { label: '10B · params 0.48×', baseline: { name: 'non-looped 10B', value: 4.82 }, bars: [
        { name: 'HyperLoop', value: 5.32, color: CH.dim },
        { name: 'OperLoop', value: 5.14, color: CH.green },
      ]},
    ],
  },
  {
    title: 'LL Avg. ↑ (%)',
    tickValues: [56, 60, 64, 68],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 62.19 }, bars: [
        { name: 'HyperLoop', value: 58.93, color: CH.dim },
        { name: 'OperLoop', value: 59.77, color: CH.green },
      ]},
      { label: '10B · params 0.48×', baseline: { name: 'non-looped 10B', value: 66.40 }, bars: [
        { name: 'HyperLoop', value: 65.77, color: CH.dim },
        { name: 'OperLoop', value: 65.90, color: CH.green },
      ]},
    ],
  },
  {
    title: 'EM Avg. ↑ (%)',
    tickValues: [20, 26, 32, 38, 44],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 23.89 }, bars: [
        { name: 'HyperLoop', value: 22.67, color: CH.dim },
        { name: 'OperLoop', value: 25.58, color: CH.green },
      ]},
      { label: '10B · params 0.48×', baseline: { name: 'non-looped 10B', value: 36.42 }, bars: [
        { name: 'HyperLoop', value: 36.57, color: CH.dim },
        { name: 'OperLoop', value: 37.46, color: CH.green },
      ]},
    ],
  },
  {
    title: 'BBH CoT ↑ (%)',
    tickValues: [28, 33, 38, 43, 48],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 31.75 }, bars: [
        { name: 'HyperLoop', value: 31.05, color: CH.dim },
        { name: 'OperLoop', value: 32.18, color: CH.green },
      ]},
      { label: '10B · params 0.48×', baseline: { name: 'non-looped 10B', value: 41.86 }, bars: [
        { name: 'HyperLoop', value: 39.64, color: CH.dim },
        { name: 'OperLoop', value: 43.04, color: CH.green },
      ]},
    ],
  },
]

/* Loop3 → Loop6, both models (paper loop-count ablation table, 5B scale) */
const SCALING_AXES = [
  {
    title: 'EM Avg. ↑ (%)',
    tickValues: [22, 26, 30, 34],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 23.89 }, bars: [
        { name: 'HyperLoop Loop3', value: 22.67, color: CH.dim },
        { name: 'HyperLoop Loop6', value: 29.75, color: CH.blue },
        { name: 'OperLoop Loop3', value: 25.58, color: '#9dc4a1' },
        { name: 'OperLoop Loop6', value: 31.90, color: CH.green },
      ]},
    ],
  },
  {
    title: 'GSM8K CoT ↑ (%)',
    tickValues: [14, 20, 26, 32],
    rows: [
      { label: '5B · params 0.56×', baseline: { name: 'non-looped 5B', value: 17.44 }, bars: [
        { name: 'HyperLoop Loop3', value: 14.03, color: CH.dim },
        { name: 'HyperLoop Loop6', value: 27.14, color: CH.blue },
        { name: 'OperLoop Loop3', value: 17.13, color: '#9dc4a1' },
        { name: 'OperLoop Loop6', value: 31.08, color: CH.green },
      ]},
    ],
  },
]


export default function OperLoop() {
  return (
    <section id="operloop" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionTag>03 — Design · Designing a New Loop</SectionTag>
        <SectionTitle>
          A new transition, <span className="text-green-soft">derived from the framework</span> in closed form.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">
          OperLoop is derived, not discovered: pick a delta objective, add explicit weight decay, schedule the step
          size — and the transition falls out of the framework in closed form. This is the framework used as a design
          tool, not just an analysis tool.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="rounded-xl border border-border bg-card/40 px-6 md:px-10 py-8 overflow-x-auto eq-scroll">
          <Tex block className="text-center">
            {EQ.operMain}
          </Tex>
          <div className="mt-2 text-center font-mono2 text-[12px] text-green-soft/80 tracking-wide">
            delta objective · explicit weight decay · adaptive step size
          </div>
        </div>
      </Reveal>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Reveal delay={0.1}>
          <div className="h-full rounded-xl border border-border bg-card/40 p-6">
            <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Delta objective</div>
            <div className="mt-4 overflow-x-auto eq-scroll">
              <Tex>{EQ.operDelta}</Tex>
            </div>
            <p className="mt-4 text-[13.5px] text-muted-foreground leading-relaxed">
              Unlike the negative inner-product objective behind most loops, the delta objective explicitly corrects for
              the <em>current projection</em> — inspired by{' '}
              <a
                href="https://arxiv.org/abs/2406.06484"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors"
              >
                Delta Linear Attention
              </a>
              .
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="h-full rounded-xl border border-border bg-card/40 p-6">
            <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Adaptive step size</div>
            <div className="mt-4 overflow-x-auto eq-scroll">
              <Tex>{EQ.operEta}</Tex>
            </div>
            <p className="mt-4 text-[13.5px] text-muted-foreground leading-relaxed">
              A causal, monotonically decreasing schedule — the loop-space analogue of learning-rate decay. Without
              monotonicity, step-size fluctuations induce oscillatory updates that hurt generation.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="h-full rounded-xl border border-border bg-card/40 p-6">
            <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Learned decay</div>
            <div className="mt-4 overflow-x-auto eq-scroll">
              <Tex>{EQ.operLambda}</Tex>
            </div>
            <p className="mt-4 text-[13.5px] text-muted-foreground leading-relaxed">
              State-dependent weight decay, input map, and step size — all predicted from the current fast weight. Drop-in
              compatible with the HyperLoop implementation.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.08} className="mt-12">
        <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
          OperLoop vs{' '}
          <a href="https://arxiv.org/abs/2604.21254" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors">HyperLoop</a>
          {' '}— same backbone, same budget
          <span className="ml-3 normal-case tracking-normal text-muted-foreground/60">dashed line (- - baseline) = the non-looped baseline at that scale · paper, main results table</span>
        </div>
        <GroupBars
          title="OperLoop vs HyperLoop — 5B and 10B on shared axes"
          sub="Identical parameters (× the non-looped baseline) and training FLOPs for the two models, so the transition is the only difference. Dashed line (- - non-looped) marks that row's baseline. Each metric has its own zoomed axis — paper, main results table."
          axes={VS_AXES}
          note={
            <div className="inline-block">
              <table className="text-left">
                <thead>
                  <tr className="text-muted-foreground/70">
                    <th className="pr-5 pb-1 font-medium">scale</th>
                    <th className="pr-5 pb-1 font-medium">loop pattern</th>
                    <th className="pb-1 font-medium">non-looped baseline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-5 py-0.5"><span className="text-foreground/80">5B</span></td>
                    <td className="pr-5 py-0.5"><Tex>{String.raw`\texttt{[4L} − \texttt{4L×3} − \texttt{2L]}`}</Tex></td>
                    <td className="py-0.5"><Tex>{String.raw`\texttt{[18L]}`}</Tex></td>
                  </tr>
                  <tr>
                    <td className="pr-5 py-0.5"><span className="text-foreground/80">10B</span></td>
                    <td className="pr-5 py-0.5"><Tex>{String.raw`\texttt{[4L} − \texttt{8L×3} − \texttt{4L]}`}</Tex></td>
                    <td className="py-0.5"><Tex>{String.raw`\texttt{[32L]}`}</Tex></td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-1.5">same effective depth, same FLOPs (1×)</div>
            </div>
          }
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <GroupBars
          title="Compute scaling: Loop3 → Loop6"
          sub="Loop6 uses 1.67× the non-looped baseline's FLOPs (Loop3: 1×). Additional loops help both models — OperLoop leads at every point. Dashed line (- - non-looped) = the 5B non-looped baseline · paper, loop-count ablation table."
          axes={SCALING_AXES}
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card/40 px-6 py-5 text-[14px] text-muted-foreground leading-relaxed">
            <span className="text-foreground font-mono2 text-[12px] tracking-widest uppercase">Why EM matters — </span>
            EM is exact match on generation tasks (math, code, reasoning). All looped models sit slightly below the
            non-looped baseline on PPL and log-likelihood accuracy, yet OperLoop wins the exact-match average. Judging
            loops by perplexity alone would understate their generative performance.
          </div>
          <div className="rounded-lg border border-border bg-card/40 px-6 py-5 text-[14px] text-muted-foreground leading-relaxed">
            <span className="text-foreground font-mono2 text-[12px] tracking-widest uppercase">
              Why build on{' '}
              <a href="https://arxiv.org/abs/2604.21254" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-gold-soft transition-colors">HyperLoop</a>
              , not{' '}
              <a href="https://arxiv.org/abs/2604.12946" target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-gold-soft transition-colors">Parcae</a>
              ? —{' '}
            </span>
            OperLoop deliberately reuses HyperLoop's expanded state and parameterization: the transition reduces to
            setting H<sup>pre</sup>, H<sup>post</sup>, H<sup>res</sup> to specific values, so the authors implement it
            within their own HyperLoop codebase at identical parameters and FLOPs. That controlled setup isolates what
            this study tests — the delta objective and the adaptive step size — rather than the backbone. Nothing in
            the framework is specific to HyperLoop: the same derivation applies to any projection, including Parcae's.
          </div>
        </div>
      </Reveal>
    </section>
  )
}
