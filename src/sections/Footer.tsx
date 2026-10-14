import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Reveal } from './Reveal'

const bibtex = `@article{huang2026looped,
  title  = {Looped Transformers as Optimizers},
  author = {Huang, Yulong and Jiang, Chen and Zhou, Zhanpeng and Zhang, Hongtao and Li, Tianyu and He, Tianyu and Zhang, Xiangyu and Cheng, Bojun},
  journal= {arXiv preprint arXiv:2609.37379},
  year   = {2026}
}`

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bibtex)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <Reveal>
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Cite this work</span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 text-[12px] font-mono2 text-muted-foreground hover:text-green-soft transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
            <pre className="rounded-xl border border-border bg-background/70 p-5 text-[12px] leading-relaxed font-mono2 text-muted-foreground overflow-x-auto eq-scroll">
              {bibtex}
            </pre>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
