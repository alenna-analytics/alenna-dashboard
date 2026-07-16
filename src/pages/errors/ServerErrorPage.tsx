import { ServiceErrorScreen } from '@/shell/service-error-screen'
import { useLanguage } from '@/shell/providers/language-provider'

export function ServerErrorPage() {
  const { lang } = useLanguage()

  return <ServiceErrorScreen lang={lang} />
}
