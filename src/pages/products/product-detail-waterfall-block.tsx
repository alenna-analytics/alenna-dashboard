import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Segment } from '@/pages/reports/waterfall-chart'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'

type ProductDetailWaterfallBlockProps = {
  title?: string
  description?: string
  segments: Segment[]
  currency: string
  grossRevenue: number
  t: (key: ShellStringKey) => string
  finalBarCaption: string
  isLoading?: boolean
}

export function ProductDetailWaterfallBlock({
  title,
  description,
  segments,
  currency,
  grossRevenue,
  t,
  finalBarCaption,
  isLoading = false,
}: ProductDetailWaterfallBlockProps) {
  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      {title || description ? (
        <CardHeader className="p-0">
          {title ? <CardTitle className="text-xl">{title}</CardTitle> : null}
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={title || description ? 'p-0 pt-4' : 'p-0'}>
        {isLoading ? (
          <Skeleton className="h-72 w-full" aria-hidden />
        ) : (
          <WaterfallChart
            segments={segments}
            currency={currency}
            grossRevenue={grossRevenue}
            formatPctOfGross={(pct) =>
              t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))
            }
            finalBarCaption={finalBarCaption}
            className="p-0 pb-0"
          />
        )}
      </CardContent>
    </Card>
  )
}
