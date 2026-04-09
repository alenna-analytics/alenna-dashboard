import { Route, Routes } from 'react-router-dom'

import { AppAuthBoundary } from '@/pages/app-auth-boundary'
import { AppShellLayout } from '@/pages/app-shell-layout'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ServerErrorPage } from '@/pages/ServerErrorPage'
import { WelcomeDashboardPage } from '@/pages/WelcomeDashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<WelcomeDashboardPage />} />
          <Route path="*" element={<NotFoundPage variant="embedded" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
