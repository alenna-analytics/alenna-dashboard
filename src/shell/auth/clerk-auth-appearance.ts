/** Shared Clerk appearance for SignIn / SignUp on the split auth layout. */
export const clerkAuthAppearance = {
  layout: {
    logoPlacement: 'none' as const,
    socialButtonsPlacement: 'top' as const,
  },
  variables: {
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: 'var(--text-primary)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorPrimary: 'var(--brand)',
    colorDanger: 'var(--danger)',
    colorSuccess: 'var(--success)',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    rootBox: 'auth-login-clerk-shell clerk-signin-light w-full max-w-full !overflow-visible',
    card: 'border-0 bg-transparent shadow-none !overflow-visible',
    cardBox: 'shadow-none border-0 bg-transparent !overflow-visible w-full',
    logoBox: 'hidden',
    logoImage: 'hidden',
    headerTitle:
      'text-[color:var(--text-primary)] text-[1.45rem] font-semibold tracking-[-0.02em] text-left',
    headerSubtitle: '!text-neutral-600 text-[0.95rem] leading-relaxed mt-1 text-left',
    header: 'text-left w-full',
    main: '!overflow-visible w-full',
    scrollBox: '!overflow-visible !p-0',
    form: 'w-full',
    formFieldRow: 'w-full',
    socialButtons: 'w-full',
    socialButtonsBlockButtonText: 'text-[color:var(--text-primary)] text-[14px] font-medium',
    socialButtonsBlockButton:
      '!min-h-11 !rounded-xl border border-neutral-200 bg-white text-[color:var(--text-primary)] hover:bg-neutral-50',
    socialButtonsBlockButtonArrow: 'text-[color:var(--text-secondary)]',
    dividerLine: 'bg-neutral-200',
    dividerText: 'text-neutral-500 text-[13px]',
    formFieldLabel: 'text-[color:var(--text-primary)] text-[13px] font-medium mb-1.5 text-left',
    formButtonPrimary:
      '!min-h-[46px] !rounded-xl !py-0 !text-[14px] font-semibold !shadow-none !bg-[var(--zara-base)] !text-[var(--firefly-base)] transition-[filter,transform] duration-200 hover:!bg-[var(--zara-100)] hover:!-translate-y-px active:!translate-y-0',
    formFieldInput:
      '!min-h-[46px] !rounded-xl border border-neutral-200 bg-white text-[color:var(--text-primary)] placeholder:text-neutral-400',
    formFieldInputShowPasswordButton:
      'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
    formResendCodeLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    footerAction: 'w-full',
    footerActionText: 'text-neutral-600 text-[14px]',
    footerActionLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)] font-medium',
    identityPreviewText: 'text-[color:var(--text-primary)]',
    identityPreviewEditButton:
      'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    footer: '!pb-0',
  },
}
