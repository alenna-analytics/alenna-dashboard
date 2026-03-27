import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardT } from '@/lib/dashboard-strings'

export function ProductsPage() {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof dashboardT>[1]) => dashboardT(lang, key)

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{t('productsPageTitle')}</h1>
        <p className="text-sm text-text-secondary">{t('productsEmptyNoDataDescription')}</p>
      </div>
      <Card variant="solid">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('productsPageTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-text-secondary">
          {t('productsEmptyNoDataDescription')}
        </CardContent>
      </Card>
    </div>
  )
}
