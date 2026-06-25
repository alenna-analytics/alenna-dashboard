import { Navigate, Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/shell/app-auth-boundary'
import { AppShellLayout } from '@/shell/layout/app-shell-layout'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { IntegrationsListPage } from '@/pages/integrations/dashboard/IntegrationsListPage'
import { IntegrationDetailPage } from '@/pages/integrations/dashboard/IntegrationDetailPage'
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage'
import { ComponentsShowcasePage } from '@/pages/dev/ComponentsShowcasePage'
import { ProductsListPage } from '@/pages/products/ProductsListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { SalesPage } from '@/pages/sales/SalesPage'
import { AdsPage } from '@/pages/ads/AdsPage'
import { SimulationsPage } from '@/pages/simulations/SimulationsPage'
import { ChannelsPage } from '@/pages/channels/ChannelsPage'
import { ConfigurationShellLayout } from '@/pages/configuration/configuration-shell-layout'
import { ConfigurationHomePage } from '@/pages/configuration/ConfigurationHomePage'
import { AlarmsConfigurationListPage } from '@/pages/configuration/alarms/AlarmsConfigurationListPage'
import { StockAlarmConfigurationPage } from '@/pages/configuration/alarms/stock/StockAlarmConfigurationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="components" element={<ComponentsShowcasePage />} />
          <Route path="reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="integrations" element={<IntegrationsListPage />} />
          <Route path="integrations/:slug" element={<IntegrationDetailPage />} />
          <Route path="configuration" element={<ConfigurationShellLayout />}>
            <Route index element={<ConfigurationHomePage />} />
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
