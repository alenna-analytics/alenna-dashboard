import { toast } from 'sonner'

import { shellT } from '@/lib/i18n/shell-strings'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

function apiErrorDetail(error: unknown): string | null {
  if (!(error instanceof Error)) return null
  const raw = error.message.trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown }
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
      return parsed.detail.trim()
    }
  } catch {
    /* plain text response */
  }
  if (raw.length <= 160) return raw
  return null
}

export function showAlarmConfigSuccessToast(lang: string, key: ShellStringKey) {
  toast.success(shellT(lang, key))
}

export function showAlarmConfigErrorToast(lang: string, error: unknown) {
  const detail = apiErrorDetail(error)
  const fallback = shellT(lang, 'alarmsToastSaveFailed')
  toast.error(detail ?? fallback)
}
