export type AmazonSyncSuccessBaselineInput = {
  baselineCompletedAt: string | null
  currentCompletedAt: string | null
}

function completedAtMs(value: string | null): number | null {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? null : ms
}

export function shouldShowAmazonSyncSuccessFromConnector(
  input: AmazonSyncSuccessBaselineInput,
): boolean {
  const baselineMs = completedAtMs(input.baselineCompletedAt)
  const currentMs = completedAtMs(input.currentCompletedAt)
  if (currentMs == null) return false
  if (baselineMs == null) return true
  return currentMs > baselineMs
}
