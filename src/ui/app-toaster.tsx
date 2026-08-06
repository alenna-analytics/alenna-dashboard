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
            '!min-h-0 !w-auto !max-w-[min(calc(100vw-2rem),24rem)] !rounded-xl !border-0 !bg-[#1f1f1f] !px-2.5 !py-2 !text-white shadow-lg [&_[data-icon]]:!hidden',
          title: '!text-center !text-sm !font-normal !text-white',
          description: '!text-center !text-sm !text-white/80',
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
