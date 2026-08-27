import { createPortal } from 'react-dom'
import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'

import { AppIcon } from '@/ui/app-icon'

export function AppToaster() {
  if (typeof document === 'undefined') return null

  return createPortal(
    <Toaster
      className="alenna-sonner"
      position="bottom-right"
      theme="dark"
      offset={16}
      mobileOffset={16}
      icons={{
        success: <AppIcon name="validation" colorize className="size-full text-current" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'alenna-toast',
          title: 'alenna-toast-title',
          description: 'alenna-toast-description',
          actionButton: 'alenna-toast-action',
          cancelButton: 'alenna-toast-cancel',
          default: '',
          success: '',
          error: '',
          warning: '',
          info: '',
        },
      }}
    />,
    document.body,
  )
}
