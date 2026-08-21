import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AppAuthBoundary } from '@/shell/app-auth-boundary'
import { AppShellLayout } from '@/shell/layout/app-shell-layout'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { AuthLoginPage } from '@/shell/auth/auth-login-page'
import { AuthSignUpPage } from '@/shell/auth/auth-sign-up-page'
import { SsoCallbackPage } from '@/shell/auth/sso-callback-page'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { PaymentPendingPage } from '@/shell/payment-pending-page'
import { IntegrationsListPage } from '@/pages/integrations/dashboard/IntegrationsListPage'
import { IntegrationDetailPage } from '@/pages/integrations/dashboard/IntegrationDetailPage'
import { DashboardHomePageV2 } from '@/pages/dashboard/DashboardHomePageV2'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { ComponentsShowcasePage } from '@/pages/dev/ComponentsShowcasePage'
import { ProductsListPage } from '@/pages/products/ProductsListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { ProductsShellLayout } from '@/pages/products/products-shell-layout'
import { CogsHubPage } from '@/pages/products/cogs/CogsHubPage'
import { CogsShellLayout } from '@/pages/products/cogs/cogs-shell-layout'
import { CogsLoadsListPage } from '@/pages/products/cogs/CogsLoadsListPage'
import { CogsLoadEditorPage } from '@/pages/products/cogs/CogsLoadEditorPage'
import { CogsLoadDetailPage } from '@/pages/products/cogs/CogsLoadDetailPage'
import { CogsPlatformSyncPage } from '@/pages/products/cogs/CogsPlatformSyncPage'
import { SalesPage } from '@/pages/sales/SalesPage'
import { AdsPage } from '@/pages/ads/AdsPage'
import { SimulationsPage } from '@/pages/simulations/SimulationsPage'
import { ChannelsPage } from '@/pages/channels/ChannelsPage'
import { ExpensesPage } from '@/pages/expenses/ExpensesPage'
import { ConfigurationShellLayout } from '@/pages/configuration/configuration-shell-layout'
import { ConfigurationIndexRedirect } from '@/pages/configuration/configuration-index-redirect'
import { AlarmsConfigurationListPage } from '@/pages/configuration/alarms/AlarmsConfigurationListPage'
import { StockAlarmConfigurationPage } from '@/pages/configuration/alarms/stock/StockAlarmConfigurationPage'
import { GeneralConfigurationPage } from '@/pages/configuration/general/GeneralConfigurationPage'
import { PnlTermsConfigurationPage } from '@/pages/configuration/pnl-terms/PnlTermsConfigurationPage'
import { BillingConfigurationPage } from '@/pages/configuration/billing/BillingConfigurationPage'
import { TeamPage } from '@/pages/team/TeamPage'
import { TeamRolesPage } from '@/pages/team/TeamRolesPage'
import { RequireModule } from '@/shell/require-module'

function BillingLegacyRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/dashboard/billing${search}`} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login/*" element={<AuthLoginPage />} />
      <Route path="/sign-up/*" element={<AuthSignUpPage />} />
      <Route path="/sso-callback" element={<SsoCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route element={<AppAuthBoundary />}>
        <Route path="/payment-pending" element={<PaymentPendingPage />} />
        <Route path="/dashboard" element={<AppShellLayout />}>
          <Route index element={<DashboardHomePageV2 />} />
          <Route path="home-v2" element={<Navigate to="/dashboard" replace />} />
          <Route path="components" element={<ComponentsShowcasePage />} />
          <Route path="reports" element={<RequireModule moduleId="reports"><ReportsPage /></RequireModule>} />
          <Route path="products" element={<RequireModule moduleId="products"><ProductsShellLayout /></RequireModule>}>
            <Route index element={<ProductsListPage />} />
            <Route path="cogs" element={<CogsShellLayout />}>
              <Route index element={<CogsHubPage />} />
              <Route path="loads" element={<CogsLoadsListPage />} />
              <Route path="loads/:loadId" element={<CogsLoadEditorPage />} />
              <Route path="loads/:loadId/view" element={<CogsLoadDetailPage />} />
              <Route path="sync" element={<CogsPlatformSyncPage />} />
            </Route>
            <Route path=":productId" element={<ProductDetailPage />} />
          </Route>
          <Route path="integrations/ecommerce" element={<RequireModule moduleId="integrations"><IntegrationsListPage category="ecommerce" /></RequireModule>} />
          <Route path="integrations/ads" element={<RequireModule moduleId="integrations"><IntegrationsListPage category="ads" /></RequireModule>} />
          <Route path="integrations/:slug" element={<RequireModule moduleId="integrations"><IntegrationDetailPage /></RequireModule>} />
          <Route path="integrations" element={<RequireModule moduleId="integrations"><IntegrationsListPage category="all" /></RequireModule>} />
          <Route path="team" element={<RequireModule permission="team.view"><TeamPage /></RequireModule>} />
          <Route path="team/roles" element={<RequireModule permission="team.view"><TeamRolesPage /></RequireModule>} />
          <Route path="billing" element={<BillingConfigurationPage />} />
          <Route path="configuration/billing" element={<BillingLegacyRedirect />} />
          <Route path="configuration" element={<RequireModule anyModuleIds={['workspace-config', 'alarms']}><ConfigurationShellLayout /></RequireModule>}>
            <Route index element={<ConfigurationIndexRedirect />} />
            <Route path="general" element={<RequireModule moduleId="workspace-config"><GeneralConfigurationPage /></RequireModule>} />
            <Route path="pnl-terms" element={<RequireModule moduleId="workspace-config"><PnlTermsConfigurationPage /></RequireModule>} />
            <Route path="alarms" element={<RequireModule moduleId="alarms"><AlarmsConfigurationListPage /></RequireModule>} />
            <Route path="alarms/stock" element={<RequireModule moduleId="alarms"><StockAlarmConfigurationPage /></RequireModule>} />
          </Route>
          <Route path="sales" element={<RequireModule moduleId="sales"><SalesPage /></RequireModule>} />
          <Route path="ads" element={<RequireModule moduleId="ads" permission="ads.view"><AdsPage /></RequireModule>} />
          <Route path="simulations" element={<RequireModule moduleId="simulations"><SimulationsPage /></RequireModule>} />
          <Route path="channels" element={<RequireModule moduleId="channels"><ChannelsPage /></RequireModule>} />
          <Route path="expenses" element={<RequireModule moduleId="expenses"><ExpensesPage /></RequireModule>} />
          <Route path="connections" element={<Navigate to="/dashboard/integrations" replace />} />
          <Route path="*" element={<NotFoundPage variant="embedded" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
