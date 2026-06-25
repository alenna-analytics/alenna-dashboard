import { Outlet, useLocation } from 'react-router-dom'

import { ConfigurationInternalSidebar } from '@/pages/configuration/configuration-internal-sidebar'
import { hasConfigurationInnerNav } from '@/pages/configuration/configuration-inner-nav'

export function ConfigurationShellLayout() {
  const { pathname } = useLocation()
  const showInnerSidebar = hasConfigurationInnerNav(pathname)

  if (!showInnerSidebar) {
    return <Outlet />
  }

  return (
    <div className="-mx-4 -mt-3 flex w-[calc(100%+2rem)] max-w-none lg:-mx-5 lg:-mt-4 lg:w-[calc(100%+2.5rem)]">
      <ConfigurationInternalSidebar />
      <div className="min-w-0 flex-1 px-4 py-3 lg:px-5 lg:py-4">
        <Outlet />
      </div>
    </div>
  )
}
