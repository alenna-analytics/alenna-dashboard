import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { cn } from '@/lib/utils'

import { ProductTableThumb } from './product-table-thumb'
import { productDetailChannelPillClassName } from './product-detail-platform-badges'
import { productPlatformLabel } from './product-platform-label'

const NUM = 'font-numeric tabular-nums'

type ProductDetailVariantsTableProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  baseCurrency: string
  fmtBase: (value: number) => string
}

export function ProductDetailVariantsTable({
  detail,
  t,
  baseCurrency,
  fmtBase,
}: ProductDetailVariantsTableProps) {
  if (!detail.variants?.length) return null

  return (
    <Card id="product-variants-section">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('productsDetailVariantsTitle')}</CardTitle>
        <CardDescription>{t('productsDetailVariantsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>{t('productsDetailVariantsColName')}</TableHead>
              <TableHead>{t('productsDetailVariantsColChannel')}</TableHead>
              <TableHead className="text-right">{t('productsDetailKpiSales')}</TableHead>
              <TableHead className="text-right">{t('productsDetailKpiOrders')}</TableHead>
              <TableHead className="text-right">{t('productsDetailKpiUnitsSold')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.variants.map((variant) => {
              const label = variant.variant_label ?? variant.title
              const platforms = variant.platforms ?? []
              return (
                <TableRow key={variant.id}>
                  <TableCell>
                    <ProductTableThumb url={variant.image_url} alt={label} />
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/dashboard/products/${variant.id}`}
                      className="font-medium text-[var(--country-green-base)] hover:text-[var(--country-green-100)] hover:underline"
                    >
                      {label}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {platforms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {platforms.map((platform) => {
                          const slug = platform.trim().toLowerCase()
                          const ui = slug ? INTEGRATION_UI[slug] : undefined
                          return (
                            <Badge
                              key={platform}
                              variant="outline"
                              className={productDetailChannelPillClassName}
                            >
                              {ui?.logoSrc != null ? (
                                <img
                                  src={ui.logoSrc}
                                  alt=""
                                  className="size-4 shrink-0 object-contain"
                                  aria-hidden
                                />
                              ) : null}
                              <span>{productPlatformLabel(platform, t)}</span>
                            </Badge>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn('text-right', NUM)}>
                    {fmtBase(variant.period_sales)} {baseCurrency}
                  </TableCell>
                  <TableCell className={cn('text-right', NUM)}>
                    {variant.period_orders}
                  </TableCell>
                  <TableCell className={cn('text-right', NUM)}>
                    {variant.period_units_sold}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
