import { Navigate, Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/shell/app-auth-boundary'
import { AppShellLayout } from '@/shell/layout/app-shell-layout'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { IntegrationsListPage } from '@/pages/integrations/dashboard/IntegrationsListPage'
import { IntegrationsAdsComingSoonPage } from '@/pages/integrations/dashboard/IntegrationsAdsComingSoonPage'
import { IntegrationDetailPage } from '@/pages/integrations/dashboard/IntegrationDetailPage'
import { DashboardHomePageV2 } from '@/pages/dashboard/DashboardHomePageV2'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { ComponentsShowcasePage } from '@/pages/dev/ComponentsShowcasePage'
import { ProductsListPage } from '@/pages/products/ProductsListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { SalesPage } from '@/pages/sales/SalesPage'
import { AdsPage } from '@/pages/ads/AdsPage'
import { SimulationsPage } from '@/pages/simulations/SimulationsPage'
import { ChannelsPage } from '@/pages/channels/ChannelsPage'
import { ConfigurationShellLayout } from '@/pages/configuration/configuration-shell-layout'
import { ConfigurationIndexRedirect } from '@/pages/configuration/configuration-index-redirect'
import { AlarmsConfigurationListPage } from '@/pages/configuration/alarms/AlarmsConfigurationListPage'
import { StockAlarmConfigurationPage } from '@/pages/configuration/alarms/stock/StockAlarmConfigurationPage'
import { GeneralConfigurationPage } from '@/pages/configuration/general/GeneralConfigurationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<DashboardHomePageV2 />} />
          <Route path="home-v2" element={<Navigate to="/dashboard" replace />} />
          <Route path="components" element={<ComponentsShowcasePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="integrations/ecommerce" element={<IntegrationsListPage category="ecommerce" />} />
          <Route path="integrations/ads" element={<IntegrationsAdsComingSoonPage />} />
          <Route path="integrations/:slug" element={<IntegrationDetailPage />} />
          <Route path="integrations" element={<IntegrationsListPage category="all" />} />
          <Route path="configuration" element={<ConfigurationShellLayout />}>
            <Route index element={<ConfigurationIndexRedirect />} />
            <Route path="general" element={<GeneralConfigurationPage />} />
            <Route path="alarms" element={<AlarmsConfigurationListPage />} />
            <Route path="alarms/stock" element={<StockAlarmConfigurationPage />} />
          </Route>
          <Route path="sales" element={<SalesPage />} />
          <Route path="ads" element={<AdsPage />} />
          <Route path="simulations" element={<SimulationsPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="connections" element={<Navigate to="/dashboard/integrations" replace />} />
          <Route path="*" element={<NotFoundPage variant="embedded" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
