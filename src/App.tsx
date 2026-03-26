import { Navigate, Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/pages/app-auth-boundary'
import { AppShellLayout } from '@/pages/app-shell-layout'
import { BillingPage } from '@/pages/BillingPage'
import { ConnectorsPage } from '@/pages/ConnectorsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { HomePage } from '@/pages/HomePage'
import { LegacyAppRedirect } from '@/pages/legacy-app-redirect'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ServerErrorPage } from '@/pages/ServerErrorPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/app/*" element={<LegacyAppRedirect />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<Navigate to="/dashboard/sales" replace />} />
          <Route path="sales" element={<DashboardPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="connections" element={<ConnectorsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="*" element={<NotFoundPage variant="embedded" />} />
        </Route>
        <Route path="/products" element={<Navigate to="/dashboard/products" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
