import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'

export function AppToaster() {
  return (
    <Toaster
      className="alenna-sonner"
      position="bottom-center"
      theme="dark"
      offset={16}
      mobileOffset={16}
      toastOptions={{
        classNames: {
          toast:
            '!min-h-0 !w-full !max-w-none !rounded-xl !border-0 !bg-[#1f1f1f] !px-4 !py-3 !text-white shadow-lg [&_[data-icon]]:!hidden',
          title: '!w-full !text-center !text-sm !font-normal !text-white',
          description: '!w-full !text-center !text-sm !text-white/80',
          default: '',
          success: '',
          error: '',
          warning: '',
          info: '',
        },
      }}
    />
  )
}
