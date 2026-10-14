import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  const reduced = useReducedMotion()
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 34 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.01 : 1.0, delay: reduced ? 0 : delay, ease: EASE },
  })
  return (
    <section id="top" className="relative min-h-screen flex flex-col justify-center grid-bg overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(95,127,168,0.14), transparent 65%)' }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(109,165,116,0.07), transparent 65%)' }} />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-14 w-full">
        <motion.h1
          {...rise(0)}
          className="font-display font-semibold tracking-tight leading-[1.02] text-[clamp(2.4rem,6.5vw,4.8rem)]"
        >
          Looped Transformers
          <br />
          <span className="text-green-soft">as Optimizers</span>
        </motion.h1>

        <motion.p
          {...rise(0.18)}
          className="mt-6 max-w-2xl text-xl md:text-2xl text-foreground/90 leading-snug font-display"
        >
          Every loop iteration is <span className="text-foreground font-medium">one step of gradient-based optimization</span>{' '}
          on a fast weight.
        </motion.p>
        <motion.p
          {...rise(0.32)}
          className="mt-4 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
        >
          Under this view, the recurrent state is a <span className="text-foreground font-medium">fast weight</span>{' '}
          <span className="text-muted-foreground/70 text-[0.85em]">
            (
            <a
              href="https://doi.org/10.1162/neco.1992.4.1.131"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors"
            >
              Schmidhuber 1992
            </a>
            ;{' '}
            <a
              href="https://arxiv.org/abs/1610.06258"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors"
            >
              Ba et al. 2016
            </a>
            ;{' '}
            <a
              href="https://arxiv.org/abs/2006.16236"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors"
            >
              Katharopoulos et al. 2020
            </a>
            ;{' '}
            <a
              href="https://arxiv.org/abs/2102.11174"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 hover:text-foreground transition-colors"
            >
              Schlag et al. 2021
            </a>
            )
          </span>{' '}
          <span className="text-foreground font-medium">updated across depth</span>:
          an input map reads it out, the shared blocks predict a target, and an optimizer rule writes the
          update back. Existing transitions can then be corrected, and new ones derived in closed form.
        </motion.p>

        <motion.div
          {...rise(0.46)}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <a
            href="https://arxiv.org/abs/2609.37379"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-7 min-h-[48px] rounded-full bg-green-soft text-background font-medium hover:opacity-90 transition-opacity"
          >
            Read the Paper ↗
          </a>
          <a
            href="#background"
            className="inline-flex items-center gap-2 px-7 min-h-[48px] rounded-full border border-border text-foreground hover:border-green-soft/50 hover:text-green-soft transition-colors"
          >
            Explore the Idea ↓
          </a>
        </motion.div>

        <motion.div {...rise(0.6)} className="mt-10">
          <p className="font-mono2 text-[12px] text-muted-foreground/80 leading-relaxed">
            Yulong Huang*<sup>1</sup> · Chen Jiang*<sup>2</sup> · Zhanpeng Zhou<sup>3</sup> · Hongtao Zhang<sup>4</sup> · Tianyu Li<sup>5</sup> · Tianyu He<sup>2</sup> · Xiangyu Zhang<sup>2</sup> · Bojun Cheng<sup>1</sup>
            <span className="block mt-1 text-muted-foreground/60">
              <sup>1</sup>HKUST(GZ) · <sup>2</sup>StepFun · <sup>3</sup>SJTU · <sup>4</sup>UCAS · <sup>5</sup>THU — *equal contribution
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://arxiv.org/abs/2609.37379"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 min-h-[38px] rounded-full border border-border text-[12.5px] font-mono2 text-foreground hover:border-green-soft/50 hover:text-green-soft transition-colors"
            >
              Paper ↗
            </a>
            <span className="inline-flex items-center gap-1.5 px-4 min-h-[38px] rounded-full border border-dashed border-border text-[12.5px] font-mono2 text-muted-foreground/70">
              Code — coming soon
            </span>
            <a
              href="mailto:yhuang496@connect.hkust-gz.edu.cn"
              className="inline-flex items-center gap-1.5 px-4 min-h-[38px] rounded-full border border-border text-[12.5px] font-mono2 text-foreground hover:border-green-soft/50 hover:text-green-soft transition-colors"
            >
              Contact ↗
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
