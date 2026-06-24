import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import type { AlertScopeType, StockOverrideApi } from '@/lib/types/alert-rules'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { PlatformConnection } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Switch } from '@/ui/switch'

type OverrideSheetProps = {
  lang: string
  open: boolean
  editing: StockOverrideApi | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: {
    scope_type: AlertScopeType
    scope_id: string | null
    platform_connection_id: string | null
    enabled: boolean
    velocity_pct: number
  }) => void
}

type OverrideSheetFormProps = {
  lang: string
  editing: StockOverrideApi | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: OverrideSheetProps['onSave']
}

function connectionLabel(lang: string, connection: PlatformConnection): string {
  const ui = INTEGRATION_UI[connection.platform]
  if (ui) return shellT(lang, ui.nameKey)
  return connection.shop_domain?.trim() || connection.platform
}

function initialProductId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type !== 'product') return ''
  return editing.scope_id ?? ''
}

function initialListingId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type !== 'product_listing') return ''
  return editing.scope_id ?? ''
}

function OverrideSheetForm({
  lang,
  editing,
  saving,
  onOpenChange,
  onSave,
}: OverrideSheetFormProps) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const [scopeType, setScopeType] = useState<AlertScopeType>(() => editing?.scope_type ?? 'channel')
  const [connectionId, setConnectionId] = useState(() => editing?.platform_connection_id ?? '')
  const [productId, setProductId] = useState(() => initialProductId(editing))
  const [listingId, setListingId] = useState(() => initialListingId(editing))
  const [enabled, setEnabled] = useState(() => editing?.enabled ?? true)
  const [velocityPct, setVelocityPct] = useState(() =>
    editing ? String(Math.round(editing.velocity_pct * 100)) : '20',
  )

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', 'picker', tenantId],
    enabled: Boolean(tenantId) && scopeType !== 'channel',
    queryFn: async (): Promise<{ id: string; title: string | null }[]> => {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        sort_by: 'title',
        sort_dir: 'asc',
      })
      const res = await apiFetch(
        `/catalog/products?${params.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      const body = (await res.json()) as { items: { id: string; title: string | null }[] }
      return body.items
    },
  })

  const productDetailQuery = useQuery({
    queryKey: ['catalog', 'product-detail', tenantId, productId],
    enabled: Boolean(tenantId) && scopeType === 'product_listing' && Boolean(productId),
    queryFn: async (): Promise<ProductDetailApi> => {
      const res = await apiFetch(
        `/catalog/products/${productId}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductDetailApi
    },
  })

  const selectedConnection = useMemo(
    () => (connectionsQuery.data ?? []).find((item) => item.id === connectionId) ?? null,
    [connectionsQuery.data, connectionId],
  )

  const listingOptions = useMemo(() => {
    const listings = productDetailQuery.data?.listings ?? []
    if (!selectedConnection) return listings
    return listings.filter((listing) => listing.platform === selectedConnection.platform)
  }, [productDetailQuery.data?.listings, selectedConnection])

  const handleSave = () => {
    const parsed = Number(velocityPct)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return
    let scope_id: string | null = null
    let platform_connection_id: string | null = null
    if (scopeType === 'channel') {
      if (!connectionId) return
      platform_connection_id = connectionId
    } else if (scopeType === 'product') {
      if (!productId) return
      scope_id = productId
    } else {
      if (!productId || !connectionId || !listingId) return
      scope_id = listingId
      platform_connection_id = connectionId
    }
    onSave({
      scope_type: scopeType,
      scope_id,
      platform_connection_id,
      enabled,
      velocity_pct: parsed / 100,
    })
  }

  const needsConnection = scopeType === 'channel' || scopeType === 'product_listing'
  const needsProduct = scopeType === 'product' || scopeType === 'product_listing'

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {editing ? shellT(lang, 'alarmsEditRule') : shellT(lang, 'alarmsAddRule')}
        </SheetTitle>
        <SheetDescription>{shellT(lang, 'alarmsOverrideSheetDescription')}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>{shellT(lang, 'alarmsColScope')}</Label>
          <Select
            value={scopeType}
            onValueChange={(value) => setScopeType(value as AlertScopeType)}
            disabled={Boolean(editing) || saving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="channel">{shellT(lang, 'alarmsScopeChannel')}</SelectItem>
              <SelectItem value="product">{shellT(lang, 'alarmsScopeProduct')}</SelectItem>
              <SelectItem value="product_listing">{shellT(lang, 'alarmsScopeListing')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {needsConnection ? (
          <div className="space-y-2">
            <Label>{shellT(lang, 'alarmsChannelLabel')}</Label>
            <Select
              value={connectionId || undefined}
              onValueChange={(value) => {
                setConnectionId(value ?? '')
                setListingId('')
              }}
              disabled={saving || Boolean(editing)}
            >
              <SelectTrigger>
                <SelectValue placeholder={shellT(lang, 'alarmsChannelPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(connectionsQuery.data ?? []).map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connectionLabel(lang, connection)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {needsProduct ? (
          <div className="space-y-2">
            <Label>{shellT(lang, 'alarmsProductLabel')}</Label>
            <Select
              value={productId || undefined}
              onValueChange={(value) => {
                setProductId(value ?? '')
                setListingId('')
              }}
              disabled={saving || Boolean(editing)}
            >
              <SelectTrigger>
                <SelectValue placeholder={shellT(lang, 'alarmsProductPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(productsQuery.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title?.trim() || product.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {scopeType === 'product_listing' ? (
          <div className="space-y-2">
            <Label>{shellT(lang, 'alarmsListingLabel')}</Label>
            <Select
              value={listingId || undefined}
              onValueChange={(value) => setListingId(value ?? '')}
              disabled={saving || !productId || Boolean(editing)}
            >
              <SelectTrigger>
                <SelectValue placeholder={shellT(lang, 'alarmsListingPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {listingOptions.map((listing) => (
                  <SelectItem key={listing.id} value={listing.id}>
                    {listing.platform_title?.trim() || listing.platform_sku || listing.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="override-enabled">{shellT(lang, 'alarmsLowStockEnabledLabel')}</Label>
          <Switch id="override-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={saving} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="override-threshold">{shellT(lang, 'alarmsThresholdLabel')}</Label>
          <div className="flex max-w-xs items-center gap-2">
            <Input
              id="override-threshold"
              type="number"
              min={1}
              max={100}
              value={velocityPct}
              onChange={(e) => setVelocityPct(e.target.value)}
              disabled={saving || !enabled}
            />
            <span className="text-sm text-text-secondary">%</span>
          </div>
        </div>
      </div>

      <SheetFooter>
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
          {shellT(lang, 'alarmsCancel')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveRule')}
        </Button>
      </SheetFooter>
    </>
  )
}

export function OverrideSheet({
  lang,
  open,
  editing,
  saving,
  onOpenChange,
  onSave,
}: OverrideSheetProps) {
  const formKey = editing?.id ?? 'create'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {open ? (
          <OverrideSheetForm
            key={formKey}
            lang={lang}
            editing={editing}
            saving={saving}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
