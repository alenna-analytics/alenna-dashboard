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
    const connectedError = searchParams.get('connected_error')
    if (!connected && !amazonError && !connectedError) return

    handled.current = true
    const next = new URLSearchParams(searchParams)
    next.delete('connected')
    next.delete('amazon_error')
    next.delete('connected_error')
    setSearchParams(next, { replace: true })

    if (connected === 'amazon') {
      toast.success(shellT(lang, 'integrationAmazonOAuthConnected'))
    } else if (connected === 'amazon_ads') {
      toast.success(shellT(lang, 'integrationAdsOAuthConnected'))
    } else if (connected === 'mercadolibre') {
      toast.success(shellT(lang, 'integrationMercadoLibreOAuthConnected'))
    } else if (connected === 'mercadolibre_ads') {
      toast.success(shellT(lang, 'integrationAdsOAuthConnected'))
    } else if (connected === 'google_ads') {
      toast.success(shellT(lang, 'integrationAdsOAuthConnected'))
    } else if (amazonError) {
      toast.error(shellT(lang, 'integrationAmazonOAuthFailed'))
    } else if (connectedError === 'google_ads') {
      toast.error(shellT(lang, 'integrationConnectFailed'))
    }
  }, [searchParams, setSearchParams, lang])
}
