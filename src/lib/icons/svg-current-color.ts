/** Rewrites black SVG fills/strokes so icons inherit `color` from the parent. */
export function svgWithCurrentColor(raw: string): string {
  return raw
    .replace(/\bfill="black"/gi, 'fill="currentColor"')
    .replace(/\bstroke="black"/gi, 'stroke="currentColor"')
    .replace(/\bfill="#000000"/gi, 'fill="currentColor"')
    .replace(/\bstroke="#000000"/gi, 'stroke="currentColor"')
    .replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"')
}
