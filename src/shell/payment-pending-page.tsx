import { Navigate } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { AppShellBootSkeleton } from '@/shell/layout/app-shell-boot-skeleton'
import { ShellBootstrapError } from '@/shell/layout/shell-bootstrap-error'
import { PaymentPendingScreen } from '@/shell/payment-pending-screen'
import { WorkspaceProvider } from '@/shell/providers/workspace-context'
import { useLanguage } from '@/shell/providers/language-provider'

export function PaymentPendingPage() {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const { me, refetchMe, error, tenantsLoading, meLoading, resolvingSingleTenant, tenantsReady } =
    useAppBootstrap()

  const bootLoading =
    !tenantsReady ||
    tenantsLoading ||
    resolvingSingleTenant ||
    meLoading

  if (bootLoading) {
    return <AppShellBootSkeleton />
  }

  if (error) {
    return <ShellBootstrapError lang={lang} />
  }

  if (!tenantId) {
    return <Navigate to="/dashboard" replace />
  }

  if (!me?.payment_required) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <WorkspaceProvider value={{ me, refetchMe }}>
      <PaymentPendingScreen />
    </WorkspaceProvider>
  )
}
