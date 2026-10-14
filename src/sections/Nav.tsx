import { useEffect, useState } from 'react'

const links = [
  { href: '#background', label: 'Background' },
  { href: '#framework', label: 'Framework' },
  { href: '#mismatch', label: 'Consistency Check' },
  { href: '#operloop', label: 'OperLoop' },
  { href: '#roadmap', label: 'Design Guide' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#top" className="font-mono2 text-[10.5px] md:text-sm tracking-wide md:tracking-wider font-medium whitespace-nowrap">
          <span className="text-foreground">Looped Transformers</span>{' '}
          <span className="text-green-soft">as Optimizers</span>
        </a>
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://arxiv.org/abs/2609.37379"
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-mono2 px-4 min-h-[44px] inline-flex items-center border border-green-soft/40 text-green-soft rounded-full hover:bg-green-soft/10 transition-colors"
          >
            Paper ↗
          </a>
        </nav>
        <a
          href="https://arxiv.org/abs/2609.37379"
          target="_blank"
          rel="noreferrer"
          className="md:hidden text-[13px] font-mono2 px-4 min-h-[44px] inline-flex items-center border border-green-soft/40 text-green-soft rounded-full"
        >
          Paper ↗
        </a>
      </div>
    </header>
  )
}
