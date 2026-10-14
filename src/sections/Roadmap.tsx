import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reveal, SectionTag, SectionTitle } from './Reveal'
import { Tex } from './Tex'

/* ---------------------------------- data ---------------------------------- */

type Cell = { tex: string; bad?: boolean }

const RULE = String.raw`\mathbf{W}_{i+1} = (1-\eta\lambda)\,\mathbf{W}_{i} - \eta\, (\boldsymbol{x}^{\top} f^{\prime}(\boldsymbol{o}_l))`

type RowLink = { label: string; href: string }

const rows: { model: string; sub?: string; subLinks?: RowLink[]; href: string; transition: string; cells: Cell[] }[] = [
  {
    model: 'Vanilla',
    sub: 'various authors · 2018–25',
    subLinks: [
      { label: 'UT', href: 'https://arxiv.org/abs/1807.03819' },
      { label: 'MoEUT', href: 'https://arxiv.org/abs/2405.16039' },
      { label: 'RT', href: 'https://arxiv.org/abs/2410.20672' },
      { label: 'Ouro', href: 'https://arxiv.org/abs/2510.25741' },
    ],
    href: 'https://arxiv.org/abs/2510.25741',
    transition: String.raw`\boldsymbol{y}_{l+1} = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\boldsymbol{y}_l` },
      { tex: String.raw`1` },
      { tex: String.raw`1` },
      { tex: String.raw`\mathbf{I}` },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'Huginn ‡',
    sub: 'Geiping et al. 2025',
    href: 'https://arxiv.org/abs/2502.05171',
    transition: String.raw`\boldsymbol{y}_{l+1} = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\mathbf{W}_y\,\boldsymbol{y}_l + \mathbf{W}_e\,\boldsymbol{e}`, bad: true },
      { tex: String.raw`1` },
      { tex: String.raw`1` },
      { tex: String.raw`\mathbf{I}`, bad: true },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'Parcae',
    sub: 'Prairie et al. 2026',
    href: 'https://arxiv.org/abs/2604.12946',
    transition: String.raw`\boldsymbol{y}_{l+1} = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\bar{\mathbf{A}}\boldsymbol{y}_l + \bar{\mathbf{B}}\boldsymbol{e}`, bad: true },
      { tex: String.raw`1` },
      { tex: String.raw`1` },
      { tex: String.raw`\mathbf{I}`, bad: true },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'Full-Bandwidth *',
    sub: 'Wang et al. 2026',
    href: 'https://arxiv.org/abs/2608.08888',
    transition: String.raw`\boldsymbol{y}_{l+1} = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\sigma(\mathbf{W}^{\mathrm{g}} \boldsymbol{e}_l) \odot \mathbf{W}^{\mathrm{u}} \boldsymbol{y}_l`, bad: true },
      { tex: String.raw`1` },
      { tex: String.raw`1` },
      { tex: String.raw`\mathbf{I}`, bad: true },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'RecurrentGPT',
    sub: 'Hegazy et al. 2026',
    href: 'https://arxiv.org/abs/2608.15062',
    transition: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{g}_{l} \odot \boldsymbol{y}_{l} + (1-\boldsymbol{g}_{l}) \odot \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\mathbf{W}\,[\boldsymbol{y}_l + \boldsymbol{\epsilon},\, \boldsymbol{e}]`, bad: true },
      { tex: String.raw`1` },
      { tex: String.raw`1 - \boldsymbol{g}_{l}` },
      { tex: String.raw`\mathbf{I}`, bad: true },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'Recirculation * †',
    sub: 'Mozer et al. 2026',
    href: 'https://arxiv.org/abs/2608.17981',
    transition: String.raw`\boldsymbol{y}_{l+1} = (1-\alpha)\,\boldsymbol{y}_{l} + \alpha \|\boldsymbol{y}_l\|_2\, \frac{\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_2}`,
    cells: [
      { tex: String.raw`\boldsymbol{y}_l` },
      { tex: String.raw`\tfrac{1}{\|\boldsymbol{y}_l\|_2}` },
      { tex: String.raw`\alpha \|\boldsymbol{y}_l\|_2` },
      { tex: String.raw`\mathbf{I}` },
      { tex: String.raw`-\langle\tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2},\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'HyperLoop',
    sub: 'Zeitoun et al. 2026',
    href: 'https://arxiv.org/abs/2604.21254',
    transition: String.raw`\mathbf{Y}_{l+1} = \mathbf{H}^{\mathrm{res}}_l \mathbf{Y}_l + (\mathbf{H}^{\mathrm{post}}_l)^{\top} \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
    cells: [
      { tex: String.raw`\mathbf{H}^{\mathrm{pre}}_l\, \mathbf{Y}_l`, bad: true },
      { tex: String.raw`\mathbf{I}-\mathbf{H}^{\mathrm{res}}_l` },
      { tex: String.raw`1` },
      { tex: String.raw`\mathbf{H}^{\mathrm{post}}_l`, bad: true },
      { tex: String.raw`-\langle\boldsymbol{t}_l,\boldsymbol{o}_l\rangle` },
    ],
  },
  {
    model: 'OperLoop',
    sub: 'this work',
    href: 'https://arxiv.org/abs/2609.37379',
    transition: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\,\mathbf{Y}_l + \eta_l (\mathbf{H}^{\mathrm{in}}_l)^{\top}\big(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l\big)`,
    cells: [
      { tex: String.raw`\mathbf{H}^{\mathrm{in}}_l\, \mathbf{Y}_l` },
      { tex: String.raw`\mathbf{\Lambda}_l = \operatorname{Diag}(\sigma(\cdot))` },
      { tex: String.raw`\eta_l = \sigma\cdot\eta_{l-1}` },
      { tex: String.raw`\mathbf{H}^{\mathrm{in}}_l` },
      { tex: String.raw`\tfrac{1}{2}\|\boldsymbol{o}_l-\boldsymbol{t}_l\|_2^2` },
    ],
  },
]

const HEADS = [
  { label: 'Projection', tex: String.raw`\boldsymbol{o}_l` },
  { label: 'Decay', tex: String.raw`\lambda` },
  { label: 'Step', tex: String.raw`\eta` },
  { label: 'Input map', tex: String.raw`\boldsymbol{x}` },
  { label: 'Objective', tex: String.raw`\mathcal{L}` },
]

/* ------------------------------- collapsible ------------------------------ */

function Panel({
  id,
  index,
  title,
  hint,
  children,
  staticOpen = false,
}: {
  id: string
  index: string
  title: React.ReactNode
  hint: string
  children: React.ReactNode
  staticOpen?: boolean
}) {
  const [open, setOpen] = useState(true)
  const expanded = staticOpen || open
  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      {staticOpen ? (
        <div className="w-full flex items-center gap-4 px-5 md:px-7 py-5">
          <span className="font-mono2 text-[11px] tracking-[0.25em] text-muted-foreground shrink-0">{index}</span>
          <span className="flex-1 min-w-0">
            <span className="block font-display text-[16px] md:text-lg font-medium text-foreground leading-snug">{title}</span>
            <span className="block mt-1 text-[12.5px] text-muted-foreground">{hint}</span>
          </span>
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={expanded}
          aria-controls={id}
          className="w-full flex items-center gap-4 px-5 md:px-7 py-5 text-left hover:bg-secondary/30 transition-colors"
        >
          <span className="font-mono2 text-[11px] tracking-[0.25em] text-muted-foreground shrink-0">{index}</span>
          <span className="flex-1 min-w-0">
            <span className="block font-display text-[16px] md:text-lg font-medium text-foreground leading-snug">{title}</span>
            <span className="block mt-1 text-[12.5px] text-muted-foreground">{hint}</span>
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-muted-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </button>
      )}
      {staticOpen ? (
        <div id={id} className="px-5 md:px-7 pb-7 pt-1 border-t border-border/60">{children}</div>
      ) : (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 md:px-7 pb-7 pt-1 border-t border-border/60">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

/* --------------------------------- section -------------------------------- */

/* ------------------ design-your-own loop: pick 3 parts, derive the transition ------------------ */

type OptKey = 'sgd' | 'momentum' | 'nsgd'
type ProjKey = 'identity' | 'expanded' | 'decayinject'
type ObjKey = 'ip' | 'delta' | 'normip'

const PROJ_CHOICES: { key: ProjKey; name: string; tex: string; desc: string }[] = [
  { key: 'identity', name: 'Identity', tex: String.raw`\boldsymbol{o}_l = \boldsymbol{y}_l`, desc: 'vector fast weight, as in UT / Ouro' },
  { key: 'expanded', name: 'Expanded state', tex: String.raw`\boldsymbol{o}_l = \mathbf{H}^{\mathrm{in}}_l \mathbf{Y}_l`, desc: 'r-stream fast weight, as in HyperLoop / OperLoop' },
  { key: 'decayinject', name: 'Decay + input inject', tex: String.raw`\boldsymbol{o}_l = \bar{\mathbf{A}}\boldsymbol{y}_l + \bar{\mathbf{B}}\boldsymbol{e}`, desc: 'structured decay with input injection, as in Parcae' },
]
const OBJ_CHOICES: { key: ObjKey; name: string; tex: string; fp: string; desc: string }[] = [
  { key: 'ip', name: 'Inner product', tex: String.raw`\mathcal{L} = -\langle \boldsymbol{o}_l, \boldsymbol{t}_l \rangle`, fp: String.raw`f^{\prime}(\boldsymbol{o}_l) = -\boldsymbol{t}_l`, desc: 'the implicit objective behind most existing loops' },
  { key: 'delta', name: 'Delta', tex: String.raw`\mathcal{L} = \tfrac{1}{2}\|\boldsymbol{t}_l - \boldsymbol{o}_l\|_2^2`, fp: String.raw`f^{\prime}(\boldsymbol{o}_l) = \boldsymbol{o}_l - \boldsymbol{t}_l`, desc: 'explicitly corrects the current projection — OperLoop' },
  { key: 'normip', name: 'Normalized inner product', tex: String.raw`\mathcal{L} = -\big\langle \boldsymbol{o}_l, \tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2} \big\rangle`, fp: String.raw`f^{\prime}(\boldsymbol{o}_l) = -\tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2}`, desc: 'target direction only, unit-norm signal — Recirculation-style' },
]
const OPT_CHOICES: { key: OptKey; name: string; tex: string; desc: string }[] = [
  { key: 'sgd', name: 'SGD + weight decay', tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I} - \eta_l \mathbf{\Lambda}_l)\mathbf{Y}_l - \eta_l \nabla_{\mathbf{Y}_l}\mathcal{L}`, desc: 'the default rule of the framework' },
  { key: 'momentum', name: 'Heavy-ball momentum', tex: String.raw`\boldsymbol{m}_{l+1} = \beta \boldsymbol{m}_l - \nabla_{\mathbf{Y}_l}\mathcal{L}, \quad \mathbf{Y}_{l+1} = \mathbf{Y}_l + \eta_l \boldsymbol{m}_{l+1}`, desc: 'carries an optimizer state across loops' },
  { key: 'nsgd', name: 'Normalized SGD', tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I} - \eta_l \mathbf{\Lambda}_l)\mathbf{Y}_l - \eta_l \frac{\nabla_{\mathbf{Y}_l}\mathcal{L}}{\|\nabla_{\mathbf{Y}_l}\mathcal{L}\|_F}`, desc: 'unit-scale steps — toward Muon / Hyperball-style updates' },
]

/* gradient of the local objective w.r.t. the fast weight — the chain rule does the work */
const GRAD: Record<ProjKey, Record<ObjKey, string>> = {
  identity: {
    ip: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = -\boldsymbol{t}_l`,
    delta: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = \boldsymbol{o}_l - \boldsymbol{t}_l`,
    normip: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = -\tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2}`,
  },
  expanded: {
    ip: String.raw`\nabla_{\mathbf{Y}_l}\mathcal{L} = -(\mathbf{H}^{\mathrm{in}}_l)^{\top} \boldsymbol{t}_l`,
    delta: String.raw`\nabla_{\mathbf{Y}_l}\mathcal{L} = (\mathbf{H}^{\mathrm{in}}_l)^{\top}\big(\boldsymbol{o}_l - \boldsymbol{t}_l\big)`,
    normip: String.raw`\nabla_{\mathbf{Y}_l}\mathcal{L} = -(\mathbf{H}^{\mathrm{in}}_l)^{\top}\tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2}`,
  },
  decayinject: {
    ip: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = -\bar{\mathbf{A}}^{\top} \boldsymbol{t}_l`,
    delta: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = \bar{\mathbf{A}}^{\top}\big(\boldsymbol{o}_l - \boldsymbol{t}_l\big)`,
    normip: String.raw`\nabla_{\boldsymbol{y}_l}\mathcal{L} = -\bar{\mathbf{A}}^{\top}\tfrac{\boldsymbol{t}_l}{\|\boldsymbol{t}_l\|_2}`,
  },
}

/* the closed-form transition each (projection, objective, optimizer) triple derives */
const RESULT: Record<OptKey, Record<ProjKey, Record<ObjKey, { tex: string; known?: string }>>> = {
  sgd: {
    identity: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)`, known: 'the Vanilla loop (with decay added)' },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = \big(1-\eta_l(\lambda_l+1)\big)\,\boldsymbol{y}_l + \eta_l\,\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)`, known: 'a Vanilla-style loop with self-correcting decay' },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)\|_2}`, known: 'a normalized-write variant of the Vanilla loop' },
    },
    expanded: {
      ip: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l (\mathbf{H}^{\mathrm{in}}_l)^{\top} \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`, known: 'the input-map-aligned HyperLoop' },
      delta: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l (\mathbf{H}^{\mathrm{in}}_l)^{\top}\big(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l\big)`, known: 'OperLoop — this paper' },
      normip: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l (\mathbf{H}^{\mathrm{in}}_l)^{\top}\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_2}`, known: 'an expanded-state Recirculation analogue' },
    },
    decayinject: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\bar{\mathbf{A}}\boldsymbol{y}_l + \bar{\mathbf{B}}\boldsymbol{e})`, known: 'the input-map-aligned Parcae (with decay)' },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = \big((1-\eta_l\lambda_l)\mathbf{I}-\eta_l\bar{\mathbf{A}}^{\top}\bar{\mathbf{A}}\big)\boldsymbol{y}_l + \eta_l\,\bar{\mathbf{A}}^{\top}\big(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l) - \bar{\mathbf{B}}\boldsymbol{e}\big)` },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\bar{\mathbf{A}}^{\top}\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_2}` },
    },
  },
  momentum: {
    identity: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)\Big]`, known: 'a Vanilla loop with a momentum buffer across loops' },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \operatorname{Blocks}_{\theta}(\boldsymbol{y}_l) - \boldsymbol{y}_l\Big]` },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)\|_2}\Big]` },
    },
    expanded: {
      ip: { tex: String.raw`\mathbf{Y}_{l+1} = \mathbf{Y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + (\mathbf{H}^{\mathrm{in}}_l)^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\Big]` },
      delta: { tex: String.raw`\mathbf{Y}_{l+1} = \mathbf{Y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + (\mathbf{H}^{\mathrm{in}}_l)^{\top}\big(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l\big)\Big]`, known: 'momentum-OperLoop — the worked example in this section' },
      normip: { tex: String.raw`\mathbf{Y}_{l+1} = \mathbf{Y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + (\mathbf{H}^{\mathrm{in}}_l)^{\top}\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_2}\Big]` },
    },
    decayinject: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\Big]` },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \bar{\mathbf{A}}^{\top}\big(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l\big)\Big]` },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = \boldsymbol{y}_l + \eta_l\Big[\beta\,\boldsymbol{m}_l + \bar{\mathbf{A}}^{\top}\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_2}\Big]` },
    },
  },
  nsgd: {
    identity: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)\|_F}` },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)-\boldsymbol{y}_l}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)-\boldsymbol{y}_l\|_F}` },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)}{\|\operatorname{Blocks}_{\theta}(\boldsymbol{y}_l)\|_F}`, known: 'normalized objective + normalized step coincide' },
    },
    expanded: {
      ip: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l\,\tfrac{(\mathbf{H}^{\mathrm{in}}_l)^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|(\mathbf{H}^{\mathrm{in}}_l)^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_F}` },
      delta: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l\,\tfrac{(\mathbf{H}^{\mathrm{in}}_l)^{\top}(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l)}{\|(\mathbf{H}^{\mathrm{in}}_l)^{\top}(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l)\|_F}`, known: 'a step toward Muon-style spectral updates on the fast weight' },
      normip: { tex: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I}-\eta_l\mathbf{\Lambda}_l)\mathbf{Y}_l + \eta_l\,\tfrac{(\mathbf{H}^{\mathrm{in}}_l)^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|(\mathbf{H}^{\mathrm{in}}_l)^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_F}`, known: 'normalized objective + normalized step coincide' },
    },
    decayinject: {
      ip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_F}` },
      delta: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\bar{\mathbf{A}}^{\top}(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l)}{\|\bar{\mathbf{A}}^{\top}(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)-\boldsymbol{o}_l)\|_F}` },
      normip: { tex: String.raw`\boldsymbol{y}_{l+1} = (1-\eta_l\lambda_l)\,\boldsymbol{y}_l + \eta_l\,\tfrac{\bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)}{\|\bar{\mathbf{A}}^{\top}\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)\|_F}`, known: 'normalized objective + normalized step coincide' },
    },
  },
}

/* row-by-row reveal of the derivation once all three parts are chosen */
function Derivation({ proj, obj, opt, stepTick }: { proj: ProjKey; obj: ObjKey; opt: OptKey; stepTick: number }) {
  const p = PROJ_CHOICES.find((c) => c.key === proj)!
  const o = OBJ_CHOICES.find((c) => c.key === obj)!
  const m = OPT_CHOICES.find((c) => c.key === opt)!
  const res = RESULT[opt][proj][obj]
  const steps = [
    { n: '01', label: 'Specify the projection', tex: p.tex },
    { n: '02', label: 'Select the local objective', tex: `${o.tex} \\;\\Rightarrow\\; ${o.fp}` },
    { n: '03', label: 'Chain rule — the transpose input map appears by itself', tex: GRAD[proj][obj] },
    { n: '04', label: `Substitute into the update rule — ${m.name}`, tex: m.tex },
  ]
  const total = steps.length + 1
  return (
    <ol className="space-y-4">
      {steps.slice(0, stepTick).map((s) => (
        <motion.li key={s.n} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex gap-4">
          <span className="shrink-0 mt-0.5 font-mono2 text-[11px] text-blue-soft">{s.n}</span>
          <div className="min-w-0">
            <div className="text-[12.5px] text-muted-foreground mb-1.5">{s.label}</div>
            <div className="overflow-x-auto eq-scroll">
              <Tex>{s.tex}</Tex>
            </div>
          </div>
        </motion.li>
      ))}
      {stepTick >= total && (
        <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-4">
          <span className="shrink-0 mt-0.5 font-mono2 text-[11px] text-green-soft">→</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] text-green-soft mb-1.5">Closed-form loop transition — a new architecture</div>
            <div className="overflow-x-auto eq-scroll rounded-md border border-green-soft/25 bg-green-soft/[0.03] px-4 py-3">
              <Tex block>{res.tex}</Tex>
            </div>
            <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed max-w-2xl">
              {res.known ? (
                <>This triple recovers a known design: <span className="text-foreground">{res.known}</span>. </>
              ) : (
                <>No published loop has this exact transition — it fell out of the derivation, not of architecture search. </>
              )}
              Every (projection, objective, optimizer) triple induces a different transition: the framework turns "design a loop" into "derive one".
            </p>
          </div>
        </motion.li>
      )}
    </ol>
  )
}

function LoopDesigner() {
  const [proj, setProj] = useState<ProjKey | null>(null)
  const [obj, setObj] = useState<ObjKey | null>(null)
  const [opt, setOpt] = useState<OptKey | null>(null)
  const [tick, setTick] = useState(0)
  const ready = proj !== null && obj !== null && opt !== null

  // derive line by line once the triple is complete
  useEffect(() => {
    if (!ready) { setTick(0); return }
    setTick(0)
    let n = 0
    const id = setInterval(() => {
      n += 1
      setTick(n)
      if (n >= 5) clearInterval(id)
    }, 420)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proj, obj, opt])

  const groups = [
    { label: 'Projection', hint: 'how the fast weight is read', choices: PROJ_CHOICES, cur: proj, set: setProj, accent: '#5f7fa8', more: 'Not only these — gating, attention readouts, or your own input map slots in the same way.' },
    { label: 'Objective', hint: 'what the update optimizes', choices: OBJ_CHOICES, cur: obj, set: setObj, accent: '#db8b4d', more: 'Not only these — any differentiable local objective on the projection works.' },
    { label: 'Optimizer', hint: 'the update rule applied', choices: OPT_CHOICES, cur: opt, set: setOpt, accent: '#6da574', more: 'Not only these — momentum, Muon, signSGD, Adam… any update rule composes.' },
  ] as const

  return (
    <div className="pt-6">
      <div className="grid md:grid-cols-3 gap-4 items-stretch">
        {groups.map((g) => (
          <div key={g.label} className="rounded-lg border border-border bg-background/40 p-5 h-full flex flex-col">
            <div className="font-mono2 text-[10.5px] tracking-[0.25em] uppercase" style={{ color: g.accent }}>
              {g.label}
              <span className="ml-2 text-muted-foreground/60 normal-case tracking-normal">— {g.hint}</span>
            </div>
            <div className="mt-4 space-y-2 flex-1">
              {g.choices.map((c) => {
                const on = g.cur === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => g.set(on ? null : (c.key as never))}
                    aria-pressed={on}
                    className="w-full text-left rounded-lg border px-3.5 py-2.5 transition-all duration-200"
                    style={{
                      borderColor: on ? g.accent : 'hsl(var(--border))',
                      background: on ? `${g.accent}10` : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono2 text-[12px]" style={{ color: on ? g.accent : 'hsl(var(--foreground))' }}>{c.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: g.accent, opacity: on ? 1 : 0.25 }} />
                    </div>
                    <div className="mt-1 overflow-x-auto eq-scroll text-[12px]"><Tex>{c.tex}</Tex></div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground/80 leading-snug">{c.desc}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-border text-[11.5px] text-muted-foreground/70 leading-snug italic">
              {g.more}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card/40 p-5 md:p-7 min-h-[180px]">
        {!ready ? (
          <div className="h-full flex items-center justify-center text-center font-mono2 text-[12px] text-muted-foreground/70 py-10">
            pick one projection, one objective, and one optimizer above —
            <br className="hidden md:block" /> the closed-form loop transition derives itself, line by line
          </div>
        ) : (
          <Derivation proj={proj} obj={obj} opt={opt} stepTick={tick} />
        )}
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto">
        These are only the options shown here — the framework is open-ended. Bring your own projection, objective,
        or optimizer (Muon, Hyperball, signSGD…) and the same three-step derivation turns it into a new loop design.
      </p>
    </div>
  )
}

export default function Roadmap() {
  return (
    <section id="roadmap" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <Reveal>
        <SectionTag>04 — Guide · An Optimizer’s Lens on Loop Design</SectionTag>
        <SectionTitle>
          A recipe for the next loop: <span className="text-blue-soft">specify, select, derive.</span>
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">
          Loop design becomes a three-step procedure: specify the projection and local objective, select an optimizer
          update rule, and derive the transition in closed form. Two views below — where existing loops sit in the
          framework, and how a new one gets derived.
        </p>
      </Reveal>

      <div className="mt-8 space-y-5">
        {/* ------- Panel A: existing works under the framework ------- */}
        <Reveal>
          <Panel
            id="panel-mapping"
            index="04 · Mapping"
            title={<>Existing loops, mapped into one update rule</>}
            hint="Eight loop transitions expressed as optimizer steps — projection, decay, step size, input map, objective."
          >
            <div className="pt-4 overflow-x-auto eq-scroll rounded-lg border border-border">
              <table className="w-full text-[13px] min-w-[1080px]">
                <thead>
                  <tr className="bg-secondary/50 text-left font-mono2 text-[10.5px] tracking-widest uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium align-bottom">Loop</th>
                    <th className="px-4 py-3 font-medium align-bottom">Original transition</th>
                    <th colSpan={5} className="px-4 py-2 font-medium border-l border-border/60">
                      <div className="normal-case tracking-normal text-[12px] text-foreground/80 py-1">
                        <Tex>{RULE}</Tex>
                      </div>
                      <div className="grid grid-cols-5 border-t border-border/60 mt-1 pt-2">
                        {HEADS.map((h) => (
                          <span key={h.label} className="pr-3 flex items-baseline gap-1.5">
                            {h.label} <Tex>{h.tex}</Tex>
                          </span>
                        ))}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.model} className="border-t border-border align-top">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`font-medium underline decoration-dotted underline-offset-4 decoration-muted-foreground/40 hover:decoration-current transition-colors ${
                            r.sub === 'this work' ? 'text-green-soft' : 'text-foreground hover:text-gold-soft'
                          }`}
                        >
                          {r.model}
                        </a>
                        {r.sub && (
                          <div className="mt-0.5 font-mono2 text-[10.5px] text-muted-foreground/70">{r.sub}</div>
                        )}
                        {r.subLinks && (
                          <div className="mt-1 flex flex-wrap gap-x-2 font-mono2 text-[10.5px]">
                            {r.subLinks.map((l) => (
                              <a
                                key={l.href}
                                href={l.href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/40 text-muted-foreground/80 hover:text-foreground transition-colors"
                              >
                                {l.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap"><Tex>{r.transition}</Tex></td>
                      <td className="px-4 py-4 border-l border-border/60">
                        <div className="grid grid-cols-5 gap-0">
                          {r.cells.map((c, i) => (
                            <div key={i} className={`pr-3 ${c.bad ? 'text-red-soft' : ''}`}>
                              <Tex>{c.tex}</Tex>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 font-mono2 text-[11px] text-muted-foreground/80 max-w-3xl">
              <p>* token shifts — the state read at position t comes from token t−1: feedback along the context, not just along depth (following the paper).</p>
              <p>† training-free — no gradient training; only its loop transition is compared here.</p>
              <p>‡ Huginn concatenates the recurrent state with the input representation and applies a learned linear projection — written here in the split form W_y·y_l + W_e·e (concat-and-project, as Parcae's related work also describes it). The paper's own mapping abstracts this as plain injection o_l = y_l + e (bias b = e); the form shown here keeps the projection matrices explicit, while the input-map column stays I — matching the original transition, whose write-back contains no transposed map (hence the red mismatch).</p>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed max-w-3xl">
              <span className="text-red-soft">Red</span> marks input-map mismatches under the chosen update rule. The
              comparison covers <em>only the loop transition</em> — each of these works contributes far more than its
              recurrence (training recipes, parameterizations, system design), which the table does not attempt to
              capture. RecurrentGPT's gate g_l enters both decay and
              write terms; the table shows the equivalent decomposition under the update rule (paper appendix).
            </p>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed max-w-3xl">
              The table is a <em>representative sample</em>, not a census: it does not try to list every looped
              architecture in the literature. The point is that the mapping is mechanical — any loop transition with a
              projection, an objective, and an update rule admits the same decomposition, so further designs
              (existing or future) slot into the same five columns without changing the framework.
            </p>
          </Panel>
        </Reveal>

        {/* ------- Panel B: future guidance, worked example ------- */}
        <Reveal delay={0.08}>
          <Panel
            id="panel-guidance"
            index="04 · Derivation"
            title={<>Design guidance — derive a new loop yourself</>}
            hint="Pick a projection, an objective, and an optimizer — the closed-form transition derives itself, line by line."
          >
            <LoopDesigner />
          </Panel>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mt-10">
        <div className="border-l-2 border-green-soft/60 pl-6 max-w-3xl">
          <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-display">
            "A unified framework that treats recurrent states as fast weights — identifying input-map mismatches in
            existing transitions and guiding the design of OperLoop."
          </p>
        </div>
      </Reveal>
    </section>
  )
}
