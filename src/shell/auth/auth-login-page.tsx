import { SignIn } from '@clerk/react'

import { Card, CardContent } from '@/ui/card'

const signInAppearance = {
  variables: {
    colorBackground: 'rgba(255, 252, 247, 0.98)',
    colorInputBackground: 'rgba(255, 255, 255, 0.96)',
    colorInputText: 'var(--text-primary)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorPrimary: 'var(--brand)',
    colorDanger: 'var(--danger)',
    colorSuccess: 'var(--success)',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'w-full clerk-signin-light',
    card:
      'shadow-none border border-[color:var(--card-solid-border)] bg-[rgba(255,252,247,0.98)] backdrop-blur-md',
    headerTitle: 'text-[color:var(--text-primary)]',
    headerSubtitle: 'text-[color:var(--text-secondary)]',
    socialButtonsBlockButtonText: 'text-[color:var(--text-primary)]',
    socialButtonsBlockButton:
      'border border-[color:var(--border-default)] bg-white text-[color:var(--text-primary)] hover:bg-[color:var(--bg-section)]',
    socialButtonsBlockButtonArrow: 'text-[color:var(--text-secondary)]',
    dividerLine: 'bg-[color:var(--border-subtle)]',
    dividerText: 'text-[color:var(--text-tertiary)]',
    formFieldLabel: 'text-[color:var(--text-primary)]',
    formButtonPrimary:
      'bg-[color:var(--brand)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--brand-hover)] focus-visible:ring-[color:var(--brand)]',
    formFieldInput:
      'border border-[color:var(--border-default)] bg-white text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)]',
    formFieldInputShowPasswordButton:
      'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
    formResendCodeLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    footerActionText: 'text-[color:var(--text-tertiary)]',
    footerActionLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    identityPreviewText: 'text-[color:var(--text-primary)]',
    identityPreviewEditButton:
      'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
  },
}

export function AuthLoginPage() {
  return (
    <section className="w-full max-w-6xl">
      <Card className="border-transparent bg-transparent shadow-none backdrop-blur-none md:border-border md:bg-card md:shadow-(--glass-shadow)">
        <CardContent className="grid items-center border-none gap-8 px-0 py-2 md:grid-cols-2 md:p-8">
          <div className="space-y-3 md:pr-6 md:border-r md:border-border">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
              alenna - analytics
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
