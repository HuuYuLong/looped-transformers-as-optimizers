import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduced ? 0.01 : 0.7, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function SectionTag({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono2 text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-5 flex items-center gap-3">
      <span className="inline-block h-px w-8 bg-muted-foreground/50" />
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-3xl md:text-5xl font-semibold leading-[1.08] tracking-tight text-balance max-w-3xl">
      {children}
    </h2>
  )
}
