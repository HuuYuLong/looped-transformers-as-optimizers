import { useMemo } from 'react'
import katex from 'katex'

// Equations transcribed verbatim from the arXiv LaTeX source (main.tex).
// Matrices: \mathbf (upright bold); vectors/scalars: \boldsymbol (italic bold);
// operators: \operatorname{Blocks}_{\theta}; dims: \mathbb{R}.
export const EQ = {
  // §3.2 optimizer-form transition, Proposition 1
  prop1: String.raw`\mathbf{Y}_{l+1} =\left(\mathbf{I}_{d_1}-\eta_l\mathbf{\Lambda}_l\right)\mathbf{Y}_l -\eta_l \left(  (\mathbf{H}^{\mathrm{in}}_l)^{\top} f^{\prime}(\boldsymbol{o}_l) \right)`,
  // projection
  proj: String.raw`\boldsymbol{o}_l = \mathbf{H}_l^{\mathrm{in}}\mathbf{Y}_l + \boldsymbol{b}_l`,
  // implicit target
  target: String.raw`\boldsymbol{t}_l = \operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
  // gradient w.r.t. fast weight
  grad: String.raw`\nabla_{\mathbf{Y}_l}\mathcal{L} = (\mathbf{H}^{\mathrm{in}}_l)^{\top} f^{\prime}(\boldsymbol{o}_l)`,
  // sanity-check symbols
  sanityH: String.raw`\mathbf{H}^{\mathrm{in}} = \mathbf{I}`,
  sanityLN: String.raw`\lambda = \eta = 1`,
  sanityF: String.raw`f^{\prime}(\boldsymbol{o}_l) = -\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l)`,
  // Parcae
  parcaeBefore: String.raw`\boldsymbol{y}_{l+1}=\operatorname{Blocks}_{\theta}(\bar{\mathbf{A}}\boldsymbol{y}_{l}+\bar{\mathbf{B}}\boldsymbol{e})`,
  parcaeAfter: String.raw`\boldsymbol{y}_{l+1}=\bar{\mathbf{A}}^{\top} \operatorname{Blocks}_{\theta}(\bar{\mathbf{A}}\boldsymbol{y}_{l}+\bar{\mathbf{B}}\boldsymbol{e})`,
  // HyperLoop
  hyperBefore: String.raw`\mathbf{Y}_{l+1} = \mathbf{H}^{\mathrm{res}}_l\mathbf{Y}_l + (\mathbf{H}^{\mathrm{post}}_l)^{\top} \left( \operatorname{Blocks}_{\theta} \left( \mathbf{H}^{\mathrm{pre}}_l\mathbf{Y}_l \right) +\mathbf{b}_l \right)`,
  hyperAfter: String.raw`\mathbf{Y}_{l+1}=\mathbf{H}^{\mathrm{res}}_l\mathbf{Y}_l+ (\mathbf{H}^{\mathrm{pre}}_l)^{\top}(\operatorname{Blocks}_{\theta}(\mathbf{H}^{\mathrm{pre}}_l\mathbf{Y}_l)+\mathbf{b}_l)`,
  parcaeMissing: String.raw`\bar{\mathbf{A}}^{\top}`,
  // OperLoop
  operMain: String.raw`\mathbf{Y}_{l+1} = (\mathbf{I} - \eta_l \mathbf{\Lambda}_l) \ \mathbf{Y}_l +\eta_l \ (\mathbf{H}^{\mathrm{in}}_l)^{\top} \left(\operatorname{Blocks}_{\theta}(\boldsymbol{o}_l) - \boldsymbol{o}_l \right)`,
  operDelta: String.raw`\mathcal{L} = \frac{1}{2} \left\|\boldsymbol{o}_l- \boldsymbol{t}_l \right\|_2^2`,
  operEta: String.raw`\eta_l = \sigma\cdot\eta_{l-1}, \quad \eta_{-1} = 1`,
  operLambda: String.raw`\mathbf{\Lambda}_l = \operatorname{Diag}\!\left(\sigma(\cdot)\right)`,
} as const

// Pre-rendered KaTeX HTML string: set once at render time via
// dangerouslySetInnerHTML, so the markup is already complete in the initial
// DOM (some preview/snapshot pipelines serialize the DOM before effects run).
export function Tex({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false }),
    [children, block]
  )
  if (block) return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
