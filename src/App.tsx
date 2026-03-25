import { Navigate, Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/pages/app-auth-boundary'
import { AppShellLayout } from '@/pages/app-shell-layout'
import { BillingPage } from '@/pages/BillingPage'
import { ConnectorsPage } from '@/pages/ConnectorsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/app" element={<AppShellLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="connectors" element={<ConnectorsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
