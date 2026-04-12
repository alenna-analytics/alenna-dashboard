import { SignIn } from '@clerk/react'

import { Card, CardContent } from '@/ui/card'

const signInAppearance = {
  variables: {
    colorBackground: '#2c3140',
    colorInputBackground: '#363b4d',
    colorInputText: 'rgba(255, 255, 255, 0.9)',
    colorText: 'rgba(255, 255, 255, 0.9)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.55)',
    colorPrimary: '#da9790',
    colorDanger: '#b76e6a',
    colorSuccess: '#da9790',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'w-full clerk-signin-dark',
    card: 'shadow-none border border-[rgba(255,255,255,0.12)] bg-[#2c3140]/96 backdrop-blur-md',
    headerTitle: 'text-[rgba(255,255,255,0.92)]',
    headerSubtitle: 'text-[rgba(255,255,255,0.55)]',
    socialButtonsBlockButtonText: 'text-[rgba(255,255,255,0.9)]',
    socialButtonsBlockButton:
      'border border-[rgba(255,255,255,0.14)] bg-[#363b4d] text-[rgba(255,255,255,0.9)] hover:bg-[#414a61]',
    socialButtonsBlockButtonArrow: 'text-[rgba(255,255,255,0.65)]',
    dividerLine: 'bg-[rgba(255,255,255,0.12)]',
    dividerText: 'text-[rgba(255,255,255,0.5)]',
    formFieldLabel: 'text-[rgba(255,255,255,0.82)]',
    formButtonPrimary:
      'bg-[#da9790] text-[#fff6f2] hover:bg-[#c88982] focus-visible:ring-[#da9790]',
    formFieldInput:
      'border border-[rgba(255,255,255,0.14)] bg-[#363b4d] text-[rgba(255,255,255,0.9)] placeholder:text-[rgba(255,255,255,0.4)]',
    formFieldInputShowPasswordButton: 'text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.9)]',
    formResendCodeLink: 'text-[#e8b4ae] hover:text-[#fff6f2]',
    footerActionText: 'text-[rgba(255,255,255,0.5)]',
    footerActionLink: 'text-[#e8b4ae] hover:text-[#fff6f2]',
    identityPreviewText: 'text-[rgba(255,255,255,0.9)]',
    identityPreviewEditButton: 'text-[#e8b4ae] hover:text-[#fff6f2]',
  },
}

export function AuthLoginPage() {
  return (
    <section className="w-full max-w-6xl">
      <Card className="border-transparent bg-transparent shadow-none backdrop-blur-none md:border-white/45 md:bg-white/[0.38] md:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_32px_rgba(65,74,97,0.1)] md:backdrop-blur-[12px]">
        <CardContent className="grid items-center border-none gap-8 px-0 py-2 md:grid-cols-2 md:p-8">
          <div className="space-y-3 md:pr-6 md:border-r md:border-border-default/70">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
              Alenna Analytics
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              Sign in to your analytics workspace
            </h1>
            <p className="text-sm text-text-secondary md:text-base">
              Access sales trends, channel performance, and operational insights
              from your dashboard.
            </p>
          </div>

          <div className="flex w-full items-center justify-center md:pl-2">
            <SignIn appearance={signInAppearance} forceRedirectUrl="/dashboard/sales" />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
