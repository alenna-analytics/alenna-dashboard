/** Session-only column resize defaults for statement / matrix tables (not persisted). */
export const statementTableColumnResize = {
  enableColumnResizing: true,
  columnResizeMode: 'onChange' as const,
  defaultColumn: {
    minSize: 72,
    size: 140,
    maxSize: 480,
  },
}
