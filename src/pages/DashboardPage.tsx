import { BarChartPanel } from '@/components/charts/bar-chart-panel'
import { LineChartPanel } from '@/components/charts/line-chart-panel'
import { PieChartPanel } from '@/components/charts/pie-chart-panel'
import { ChannelBadge } from '@/components/composed/channel-badge'
import { DataTable } from '@/components/composed/data-table'
import { DeltaBadge } from '@/components/composed/delta-badge'
import { MetricCard } from '@/components/composed/metric-card'
import { PageHeader } from '@/components/composed/page-header'
import { SyncStatusIndicator } from '@/components/composed/sync-status-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LINE_DATA = [
  { day: 'Mon', a: 120, b: 80 },
  { day: 'Tue', a: 140, b: 95 },
  { day: 'Wed', a: 128, b: 110 },
  { day: 'Thu', a: 190, b: 130 },
  { day: 'Fri', a: 210, b: 160 },
]

const BAR_DATA = [
  { name: 'A', v1: 40, v2: 24 },
  { name: 'B', v1: 30, v2: 38 },
  { name: 'C', v1: 20, v2: 42 },
]

const PIE_DATA = [
  { name: 'Shopify', value: 440 },
  { name: 'ML', value: 320 },
  { name: 'Amazon', value: 210 },
]

const TABLE_ROWS: { product: string; revenue: string; channel: 'shopify' }[] = [
  { product: 'SKU-100', revenue: '$12,430', channel: 'shopify' },
  { product: 'SKU-220', revenue: '$9,200', channel: 'shopify' },
]

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview placeholders until analytics API is wired."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          variant="hero"
          label="Gross revenue"
          currency="MXN"
          value="$284,391"
          footer={
            <>
              <DeltaBadge positive value="8.2%" />
              <span className="text-xs text-text-tertiary">vs last period</span>
            </>
          }
        />
        <MetricCard
          label="Orders"
          value="1,024"
          footer={<DeltaBadge value="2.1%" positive={false} />}
        />
        <MetricCard
          label="Sync"
          value={
            <span className="inline-flex items-center gap-2 text-base">
              <SyncStatusIndicator status="active" />
            </span>
          }
        />
        <MetricCard
          label="Channel"
          value={<ChannelBadge channel="mercadolibre" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border-default bg-bg-surface lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-text-primary">
              Revenue (sample)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartPanel
              data={LINE_DATA}
              dataKeyX="day"
              series={[
                { key: 'a', name: 'Channel A' },
                { key: 'b', name: 'Channel B' },
              ]}
            />
          </CardContent>
        </Card>
        <Card className="border-border-default bg-bg-surface">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-text-primary">
              Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartPanel data={PIE_DATA} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border-default bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Stacked bar (sample)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartPanel
            data={BAR_DATA}
            dataKeyX="name"
            bars={[
              { key: 'v1', name: 'Net', stackId: 's' },
              { key: 'v2', name: 'Fees', stackId: 's' },
            ]}
            heightClassName="h-40"
          />
        </CardContent>
      </Card>

      <Card className="border-border-default bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Sample table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'product',
                header: 'Product',
                cell: (r) => r.product,
              },
              {
                key: 'revenue',
                header: 'Revenue',
                align: 'right',
                mono: true,
                cell: (r) => r.revenue,
              },
              {
                key: 'channel',
                header: 'Channel',
                cell: (r) => <ChannelBadge channel={r.channel} />,
              },
            ]}
            rows={TABLE_ROWS}
            getRowKey={(r) => r.product}
          />
        </CardContent>
      </Card>
    </div>
  )
}
