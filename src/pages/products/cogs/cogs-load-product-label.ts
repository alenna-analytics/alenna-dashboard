const DEFAULT_VARIANT_LABELS = new Set(['default title', 'default'])

function isDefaultVariantLabel(value: string): boolean {
  return DEFAULT_VARIANT_LABELS.has(value.toLowerCase())
}

function stripParentPrefix(parentTitle: string, variant: string): string {
  const parentLower = parentTitle.toLowerCase()
  const variantLower = variant.toLowerCase()
  if (!variantLower.startsWith(parentLower)) return variant
  let rest = variant.slice(parentTitle.length).trim()
  rest = rest.replace(/^[-–—|:·>]+\s*/u, '').trim()
  if (rest.startsWith('(') && rest.endsWith(')')) {
    rest = rest.slice(1, -1).trim()
  }
  return rest
}

const TITLE_VARIANT_SEPARATORS = [' — ', ' – '] as const

export type SplitDisplayTitle = {
  parentTitle: string
  variantLabel: string | null
}

export function splitDisplayTitle(title: string): SplitDisplayTitle {
  const raw = title.trim()
  for (const sep of TITLE_VARIANT_SEPARATORS) {
    const index = raw.indexOf(sep)
    if (index <= 0) continue
    const parentTitle = raw.slice(0, index).trim()
    const rest = raw.slice(index + sep.length).trim()
    return {
      parentTitle,
      variantLabel: distinctVariantLabel(parentTitle, rest),
    }
  }
  return { parentTitle: raw, variantLabel: null }
}

export function distinctVariantLabel(
  parentTitle: string,
  variantLabel: string | null | undefined,
): string | null {
  const variant = variantLabel?.trim() ?? ''
  if (!variant || isDefaultVariantLabel(variant)) return null
  const parent = parentTitle.trim()
  if (!parent) return variant
  if (variant.toLowerCase() === parent.toLowerCase()) return null
  const stripped = stripParentPrefix(parent, variant)
  if (!stripped || isDefaultVariantLabel(stripped)) return null
  if (stripped.toLowerCase() === parent.toLowerCase()) return null
  return stripped
}
