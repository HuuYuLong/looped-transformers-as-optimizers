import { Reveal, SectionTag, SectionTitle } from './Reveal'
import FoldTransition from './FoldTransition'

export default function Background() {
  return (
    <section id="background" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionTag>00 — Background &amp; Overview</SectionTag>
        <SectionTitle>
          Depth improves reasoning. Parameters are expensive. <span className="text-blue-soft">Loops decouple the two</span> — but existing loop designs lack a unifying principle.
        </SectionTitle>
      </Reveal>

      <div className="mt-10 grid md:grid-cols-3 gap-10 md:gap-8">
        <Reveal delay={0.1}>
          <div className="border-t-2 border-blue-soft/60 pt-6">
            <div className="font-mono2 text-[12px] tracking-widest text-blue-soft mb-3">THE TENSION</div>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Scaling LLMs means jointly growing size, data, and compute. Stacking more independently parameterized blocks
              buys depth — but under data constraints, extra parameters yield diminishing returns.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="border-t-2 border-orange-soft/60 pt-6">
            <div className="font-mono2 text-[12px] tracking-widest text-orange-soft mb-3">THE LOOP ANSWER</div>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Looped Transformers repeatedly reuse shared blocks, decoupling depth from parameter count. Repeated
              computation adds latent refinement — a form of test-time compute that enhances reasoning.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="border-t-2 border-green-soft/60 pt-6">
            <div className="font-mono2 text-[12px] tracking-widest text-green-soft mb-3">THE OPEN QUESTION</div>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Designs vary in <em>where</em> to loop and <em>how</em> to loop — yet every iteration must transform one
              state into the next. That <span className="text-foreground">recurrent transition</span> lacked general
              design principles. This framework provides them.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-10">
        <div className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
          From a Standard Transformer to a Looped one — click to compare
        </div>
        <FoldTransition />
      </Reveal>
    </section>
  )
}
