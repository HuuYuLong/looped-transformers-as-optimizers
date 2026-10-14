/*
 * Mobile-first result visualizations: horizontal bar pairs instead of grouped
 * vertical bar charts. Each row shows label → bar → value, readable at 360px.
 */
import { motion } from 'framer-motion'

export type PairRow = {
  label: string
  a: { name: string; value: number; color: string }
  b: { name: string; value: number; color: string }
}

export type GroupBar = { name: string; value: number; color: string; hk?: string }
export type GroupRow = {
  label: string
  bars: GroupBar[]
  baseline?: { name: string; value: number }  // dashed reference line
}

function Bar({ value, base, max, color, name, delay }: { value: number; base: number; max: number; color: string; name: string; delay: number }) {
  // bars are measured from `base` so small deltas stay visible
  const span = Math.max(max - base, 1e-6)
  const pct = Math.min(Math.max(((value - base) / span) * 100, 2), 100)
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono2 text-[11px] text-muted-foreground w-[92px] shrink-0 text-right">{name}</span>
      <div className="flex-1 h-6 rounded-sm bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full rounded-sm"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="font-mono2 text-[12px] text-foreground w-12 shrink-0">{value}</span>
    </div>
  )
}

export function PairBars({ title, sub, rows, max, base = 0 }: { title: string; sub: string; rows: PairRow[]; max: number; base?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 md:p-7">
      <div className="font-medium text-[15px]">{title}</div>
      <div className="text-[12.5px] text-muted-foreground mt-1 mb-6 leading-relaxed">{sub}</div>
      <div className="space-y-6">
        {rows.map((r, ri) => (
          <div key={r.label}>
            <div className="text-[13px] text-foreground mb-2 font-medium">{r.label}</div>
            <div className="space-y-2">
              <Bar name={r.a.name} value={r.a.value} base={base} max={max} color={r.a.color} delay={ri * 0.12} />
              <Bar name={r.b.name} value={r.b.value} base={base} max={max} color={r.b.color} delay={ri * 0.12 + 0.08} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * Grouped bars on a shared axis: each axis group renders its rows against
 * one scale with tick marks, a dashed baseline per row, and compact spacing.
 */
export type AxisGroup = {
  title: string
  tickValues: number[]
  rows: GroupRow[]
}

export function GroupBars({ title, sub, axes, active, onHover, note }: {
  title: string; sub: string; axes: AxisGroup[]
  active?: string | null
  onHover?: (hk: string | null) => void
  note?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 md:p-7">
      <div className="font-medium text-[15px]">{title}</div>
      <div className="text-[12.5px] text-muted-foreground mt-1 mb-2 leading-relaxed">{sub}</div>
      {note && (
        <div className="font-mono2 text-[10.5px] tracking-[0.2em] text-muted-foreground/80 mb-5 space-y-1 leading-relaxed">
          {note}
        </div>
      )}
      {/* cap the plot width on desktop — long bars make small deltas hard to scan */}
      <div className="space-y-7 md:max-w-[640px]">
        {axes.map((ax) => {
          const lo = Math.min(...ax.tickValues)
          const hi = Math.max(...ax.tickValues)
          const span = hi - lo
          const pct = (v: number) => Math.min(Math.max(((v - lo) / span) * 100, 1.5), 100)
          return (
            <div key={ax.title}>
              <div className="font-mono2 text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground/80 mb-2.5">{ax.title}</div>
              <div className="space-y-3.5">
                {ax.rows.map((r, ri) => (
                  <div key={r.label}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-[13px] text-foreground font-medium">{r.label}</span>
                      {r.baseline && (
                        <span className="font-mono2 text-[10px] text-muted-foreground/70">
                          - - {r.baseline.name} {r.baseline.value}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {r.bars.map((bar, bi) => (
                        <div
                          key={bar.name}
                          className="flex items-center gap-3 rounded-sm"
                          style={{
                            opacity: active && bar.hk && active !== bar.hk ? 0.22 : 1,
                            transition: 'opacity 0.25s ease',
                            cursor: bar.hk ? 'pointer' : undefined,
                          }}
                          onMouseEnter={() => bar.hk && onHover?.(bar.hk)}
                          onMouseLeave={() => bar.hk && onHover?.(null)}
                        >
                          <span className="font-mono2 text-[10.5px] text-muted-foreground w-[104px] shrink-0 text-right leading-tight">{bar.name}</span>
                          <div className="flex-1 relative h-5 rounded-sm bg-secondary/50 overflow-hidden">
                            <motion.div
                              className="h-full rounded-sm"
                              style={{ background: bar.color }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct(bar.value)}%` }}
                              viewport={{ once: true, margin: '-40px' }}
                              transition={{ duration: 0.9, delay: ri * 0.1 + bi * 0.06, ease: [0.22, 1, 0.36, 1] }}
                            />
                            {r.baseline && (
                              <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-foreground/45" style={{ left: `${pct(r.baseline.value)}%` }} />
                            )}
                          </div>
                          <span className="font-mono2 text-[11.5px] text-foreground w-12 shrink-0">{bar.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* shared axis ticks */}
              <div className="flex items-center gap-3 mt-2">
                <span className="w-[104px] shrink-0" />
                <div className="flex-1 relative h-4 border-t border-border/70">
                  {ax.tickValues.map((v) => (
                    <span
                      key={v}
                      className="absolute -top-0.5 font-mono2 text-[9.5px] text-muted-foreground/60 -translate-x-1/2"
                      style={{ left: `${((v - lo) / span) * 100}%` }}
                    >
                      <span className="block w-px h-1 bg-border mx-auto mb-0.5" />
                      {v}
                    </span>
                  ))}
                </div>
                <span className="w-12 shrink-0" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const CH = { green: '#6da574', blue: '#5f7fa8', orange: '#db8b4d', dim: '#93a0b4' }
