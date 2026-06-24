import { Info } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'

type OutOfStockInfoCardProps = {
  lang: string
}

export function OutOfStockInfoCard({ lang }: OutOfStockInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-text-secondary" aria-hidden />
          <CardTitle className="text-base">{shellT(lang, 'alarmsOutOfStockTitle')}</CardTitle>
        </div>
        <CardDescription>{shellT(lang, 'alarmsOutOfStockDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsOutOfStockNote')}</p>
      </CardContent>
    </Card>
  )
}
