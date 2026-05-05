import { Navigate, Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/shell/app-auth-boundary'
import { AppShellLayout } from '@/shell/layout/app-shell-layout'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { IntegrationsListPage } from '@/pages/integrations/dashboard/IntegrationsListPage'
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage'
import { ComponentsShowcasePage } from '@/pages/dev/ComponentsShowcasePage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { ProductsListPage } from '@/pages/products/ProductsListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="components" element={<ComponentsShowcasePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="integrations" element={<IntegrationsListPage />} />
          <Route path="integrations/:slug" element={<Navigate to="/dashboard/integrations" replace />} />
          <Route path="connections" element={<Navigate to="/dashboard/integrations" replace />} />
          <Route path="*" element={<NotFoundPage variant="embedded" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
