import { SignIn } from '@clerk/react'

import { Card, CardContent } from '@/components/ui/card'

const signInAppearance = {
  variables: {
    colorBackground: '#0b1220',
    colorInputBackground: '#0f172a',
    colorInputText: '#e2e8f0',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    colorPrimary: '#5b8cff',
    colorDanger: '#f87171',
    colorSuccess: '#34d399',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'w-full clerk-signin-dark',
    card: 'shadow-none border border-white/10 bg-transparent',
    headerTitle: 'text-slate-100',
    headerSubtitle: 'text-slate-300',
    socialButtonsBlockButtonText: 'text-slate-100',
    socialButtonsBlockButton:
      'border border-white/15 bg-slate-900/60 text-slate-100 hover:bg-slate-800/70',
    socialButtonsBlockButtonArrow: 'text-slate-200',
    dividerLine: 'bg-white/15',
    dividerText: 'text-slate-300',
    formFieldLabel: 'text-slate-200',
    formButtonPrimary:
      'bg-[#5b8cff] text-white hover:bg-[#7ca3ff] focus-visible:ring-[#5b8cff]',
    formFieldInput:
      'border border-white/15 bg-slate-900/70 text-slate-100 placeholder:text-slate-500',
    formFieldInputShowPasswordButton: 'text-slate-300 hover:text-slate-100',
    formResendCodeLink: 'text-[#9db7ff] hover:text-[#c2d3ff]',
    footerActionText: 'text-slate-300',
    footerActionLink: 'text-[#7ca3ff] hover:text-[#9db7ff]',
    identityPreviewText: 'text-slate-100',
    identityPreviewEditButton: 'text-[#9db7ff] hover:text-[#c2d3ff]',
  },
}

export function AuthLoginPage() {
  return (
    <section className="w-full max-w-6xl">
      <Card className="border-transparent bg-transparent backdrop-blur-none shadow-none md:border-white/10 md:bg-slate-950/60 md:backdrop-blur">
        <CardContent className="grid items-center border-none gap-8 px-0 py-2 md:grid-cols-2 md:p-8">
          <div className="space-y-3 md:pr-6 md:border-r md:border-white/10">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7ca3ff]">
              Ecommerce Analytics
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
              Sign in to your analytics workspace
            </h1>
            <p className="text-sm text-slate-400 md:text-base">
              Access sales trends, channel performance, and operational insights
              from your dashboard.
            </p>
          </div>

          <div className="w-full md:pl-2 flex justify-center items-center">
            <SignIn appearance={signInAppearance} forceRedirectUrl="/dashboard/sales" />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
