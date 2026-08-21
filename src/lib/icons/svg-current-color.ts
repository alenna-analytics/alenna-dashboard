/** Rewrites black SVG fills/strokes so icons inherit `color` from the parent. */
export function svgWithCurrentColor(raw: string, idPrefix?: string): string {
  let next = raw
    .replace(/\bfill="black"/gi, 'fill="currentColor"')
    .replace(/\bstroke="black"/gi, 'stroke="currentColor"')
    .replace(/\bfill="#000000"/gi, 'fill="currentColor"')
    .replace(/\bstroke="#000000"/gi, 'stroke="currentColor"')
    .replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"')
  if (idPrefix) {
    const prefix = idPrefix.replace(/[^a-zA-Z0-9_-]/g, '')
    next = next
      .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
  }
  return next
}
