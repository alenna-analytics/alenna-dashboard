import { SignIn } from '@clerk/react'

import { Card, CardContent } from '@/ui/card'

const signInAppearance = {
  variables: {
    colorBackground: 'var(--clerk-bg)',
    colorInputBackground: 'var(--clerk-input-bg)',
    colorInputText: 'var(--clerk-text)',
    colorText: 'var(--clerk-text)',
    colorTextSecondary: 'var(--clerk-text-muted)',
    colorPrimary: 'var(--brand)',
    colorDanger: 'var(--clerk-danger)',
    colorSuccess: 'var(--clerk-success)',
    borderRadius: '10px',
  },
  elements: {
    rootBox: 'w-full clerk-signin-dark',
    card:
      'shadow-none border border-[color:var(--clerk-border-subtle)] bg-[color:var(--clerk-bg)]/96 backdrop-blur-md',
    headerTitle: 'text-[color:var(--clerk-text-strong)]',
    headerSubtitle: 'text-[color:var(--clerk-text-muted)]',
    socialButtonsBlockButtonText: 'text-[color:var(--clerk-text)]',
    socialButtonsBlockButton:
      'border border-[color:var(--clerk-border)] bg-[color:var(--clerk-input-bg)] text-[color:var(--clerk-text)] hover:bg-[color:var(--clerk-hover-elevated)]',
    socialButtonsBlockButtonArrow: 'text-[color:var(--clerk-text-muted)]',
    dividerLine: 'bg-[color:var(--clerk-border-subtle)]',
    dividerText: 'text-[color:var(--clerk-text-dim)]',
    formFieldLabel: 'text-[color:var(--clerk-text-label)]',
    formButtonPrimary:
      'bg-[color:var(--brand)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--clerk-primary-hover)] focus-visible:ring-[color:var(--brand)]',
    formFieldInput:
      'border border-[color:var(--clerk-border)] bg-[color:var(--clerk-input-bg)] text-[color:var(--clerk-text)] placeholder:text-[color:var(--clerk-placeholder)]',
    formFieldInputShowPasswordButton:
      'text-[color:var(--clerk-text-muted)] hover:text-[color:var(--clerk-text)]',
    formResendCodeLink: 'text-[color:var(--clerk-link)] hover:text-[color:var(--primary-foreground)]',
    footerActionText: 'text-[color:var(--clerk-text-dim)]',
    footerActionLink: 'text-[color:var(--clerk-link)] hover:text-[color:var(--primary-foreground)]',
    identityPreviewText: 'text-[color:var(--clerk-text)]',
    identityPreviewEditButton:
      'text-[color:var(--clerk-link)] hover:text-[color:var(--primary-foreground)]',
  },
}

export function AuthLoginPage() {
  return (
    <section className="w-full max-w-6xl">
      <Card className="border-transparent bg-transparent shadow-none backdrop-blur-none md:border-border md:bg-card md:shadow-[var(--glass-shadow)]">
        <CardContent className="grid items-center border-none gap-8 px-0 py-2 md:grid-cols-2 md:p-8">
          <div className="space-y-3 md:pr-6 md:border-r md:border-border">
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
