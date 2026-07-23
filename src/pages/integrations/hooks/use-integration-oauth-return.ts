import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function useIntegrationOAuthReturn() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang } = useLanguage()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const connected = searchParams.get('connected')
    const amazonError = searchParams.get('amazon_error')
    if (!connected && !amazonError) return

    handled.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('connected')
    next.delete('amazon_error')
    setSearchParams(next, { replace: true })

    if (connected === 'amazon') {
      toast.success(shellT(lang, 'integrationAmazonOAuthConnected'))
    } else if (amazonError) {
      toast.error(amazonError)
    }
  }, [searchParams, setSearchParams, lang])
}
