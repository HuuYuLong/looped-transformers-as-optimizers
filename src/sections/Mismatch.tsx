import { useState } from 'react'
import { Reveal, SectionTag, SectionTitle } from './Reveal'
import { Tex } from './Tex'
import { GroupBars } from './PairBars'

// The changed term is color-coded: red = the violating write-back, green = the aligned fix.
const RED = '#c25a48', GREEN = '#4e8a56'
const fixes = [
  {
    model: 'Parcae',
    before: String.raw`\boldsymbol{y}_{l+1}=\operatorname{Blocks}_{\theta}(\bar{\mathbf{A}}\boldsymbol{y}_{l}+\bar{\mathbf{B}}\boldsymbol{e})`,
    after: String.raw`\boldsymbol{y}_{l+1}=\textcolor{${GREEN}}{\bar{\mathbf{A}}^{\top}}\,\operatorname{Blocks}_{\theta}(\bar{\mathbf{A}}\boldsymbol{y}_{l}+\bar{\mathbf{B}}\boldsymbol{e})`,
    fix: 'Restore the transposed input map Āᵀ in the write term',
    color: '#6da574',
  },
  {
    model: 'HyperLoop',
    before: String.raw`\mathbf{Y}_{l+1} = \mathbf{H}^{\mathrm{res}}_l\mathbf{Y}_l + \textcolor{${RED}}{(\mathbf{H}^{\mathrm{post}}_l)^{\top}} \left( \operatorname{Blocks}_{\theta} \left( \mathbf{H}^{\mathrm{pre}}_l\mathbf{Y}_l \right) +\mathbf{b}_l \right)`,
    after: String.raw`\mathbf{Y}_{l+1}=\mathbf{H}^{\mathrm{res}}_l\mathbf{Y}_l+ \textcolor{${GREEN}}{(\mathbf{H}^{\mathrm{pre}}_l)^{\top}}(\operatorname{Blocks}_{\theta}(\mathbf{H}^{\mathrm{pre}}_l\mathbf{Y}_l)+\mathbf{b}_l)`,
    fix: 'Tie the write map to the read map: H^post = H^pre — fewer parameters',
    color: '#5f7fa8',
  },
]

// highlight keys: `${model}-pub` (mismatch) / `${model}-ali` (the fix)
export default function Mismatch() {
  const [hl, setHl] = useState<string | null>(null)
  const dim = (key: string) => (hl === null || hl === key ? 1 : 0.22)

  return (
    <section id="mismatch" className="border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <Reveal>
          <SectionTag>02 — Refine · A Consistency Check for Existing Loops</SectionTag>
          <SectionTitle>
            A case study: existing loops write back through a <span className="text-red-soft">misaligned map.</span> Tying it improves accuracy.
          </SectionTitle>
          <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            A gradient step writes back through the <em>transpose</em> of the read map. Under this view, the
            transitions of Parcae and HyperLoop do not satisfy that condition. Aligning them adds nothing new —
            for HyperLoop it ties the write map to the read map, removing the separate H<sup>post</sup> parameters.
          </p>
        </Reveal>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          {fixes.map((f, i) => (
            <Reveal key={f.model} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-background/60 p-5 md:p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono2 text-sm text-foreground">{f.model}</span>
                  <span className="font-mono2 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                    hover a formula — see its result
                  </span>
                </div>

                {/* mismatch — as published */}
                <div
                  className="rounded-lg px-3 py-3 -mx-3 transition-opacity duration-300 cursor-pointer"
                  style={{ opacity: dim(`${f.model}-pub`) }}
                  onMouseEnter={() => setHl(`${f.model}-pub`)}
                  onMouseLeave={() => setHl(null)}
                >
                  <div className="font-mono2 text-[10px] tracking-widest uppercase text-red-soft mb-1">
                    as published — mismatch
                  </div>
                  <div className="overflow-x-auto eq-scroll">
                    <Tex>{f.before}</Tex>
                  </div>
                </div>

                {/* fix — directly below the mismatch */}
                <div
                  className="rounded-lg px-3 py-3 -mx-3 mt-2 border-t border-border/60 transition-opacity duration-300 cursor-pointer"
                  style={{ opacity: dim(`${f.model}-ali`) }}
                  onMouseEnter={() => setHl(`${f.model}-ali`)}
                  onMouseLeave={() => setHl(null)}
                >
                  <div className="font-mono2 text-[10px] tracking-widest uppercase text-green-soft mb-1 mt-1">
                    input-map aligned — the fix
                  </div>
                  <div className="overflow-x-auto eq-scroll">
                    <Tex>{f.after}</Tex>
                  </div>
                </div>

                <p className="mt-5 text-[13.5px] text-muted-foreground border-t border-border pt-4">{f.fix}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* measured results */}
        <Reveal delay={0.1} className="mt-8">
          <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
            The fix shows up in the final numbers
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5 md:p-6">
            <div className="max-w-2xl mx-auto">
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
              <span className="font-display text-[15px] text-foreground">Input-map alignment, measured — before vs after</span>
              <span className="font-mono2 text-[10.5px] text-muted-foreground/70"><Tex>{String.raw`\texttt{[4L} − \texttt{4L×3} − \texttt{2L]}`}</Tex> at 5B · identical parameters and training FLOPs — paper, input-map alignment table</span>
            </div>
            <GroupBars
              title=""
              sub=""
              active={hl}
              onHover={setHl}
              axes={[
                {
                  title: 'PPL (Lamb.) ↓',
                  tickValues: [7.2, 7.4, 7.6, 7.8],
                  rows: [
                    { label: 'Parcae', bars: [
                      { name: 'as published', value: 7.71, color: '#8fb896', hk: 'Parcae-pub' },
                      { name: 'aligned', value: 7.41, color: '#4e8a56', hk: 'Parcae-ali' },
                    ]},
                    { label: 'HyperLoop', bars: [
                      { name: 'as published', value: 7.68, color: '#8ba7c4', hk: 'HyperLoop-pub' },
                      { name: 'aligned', value: 7.35, color: '#4a6f99', hk: 'HyperLoop-ali' },
                    ]},
                  ],
                },
                {
                  title: 'Commonsense Avg. ↑ (%)',
                  tickValues: [58.8, 59.0, 59.2, 59.4, 59.6],
                  rows: [
                    { label: 'Parcae', bars: [
                      { name: 'as published', value: 59.14, color: '#8fb896', hk: 'Parcae-pub' },
                      { name: 'aligned *', value: 59.29, color: '#4e8a56', hk: 'Parcae-ali' },
                    ]},
                    { label: 'HyperLoop', bars: [
                      { name: 'as published', value: 58.93, color: '#8ba7c4', hk: 'HyperLoop-pub' },
                      { name: 'aligned', value: 59.47, color: '#4a6f99', hk: 'HyperLoop-ali' },
                    ]},
                  ],
                },
              ]}
            />
            <div className="mt-3 font-mono2 text-[10px] text-muted-foreground/60">* within run-to-run variation.</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
