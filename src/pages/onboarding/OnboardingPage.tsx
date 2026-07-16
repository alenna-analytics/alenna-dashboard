import { Show, useAuth, useUser } from '@clerk/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  createWorkspace,
  fetchMyTenants,
  useTenantSwitcher,
  WorkspaceAlreadyExistsError,
  WorkspaceCreatedNeedsActiveTenantError,
} from '@/auth/hooks'
import { TRIAL_DAYS, TRIAL_PRICE_USD } from '@/lib/onboarding-constants'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { AuthShell } from '@/shell/auth/auth-shell'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { LoadingIcon } from '@/ui/app-icon'

type Step = 1 | 2 | 3
type StepDirection = 'forward' | 'back'

export function OnboardingPage() {
  return (
    <Show when="signed-in" fallback={<Navigate to="/login" replace />}>
      <OnboardingWizard />
    </Show>
  )
}

function OnboardingWizard() {
  const { getToken, isLoaded } = useAuth()
  const { user } = useUser()
  const { switchTenant } = useTenantSwitcher()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = (key: ShellStringKey, vars?: Record<string, string | number>) =>
    shellT(lang, key, vars)

  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState<StepDirection>('forward')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  function goToStep(next: Step) {
    setDirection(next > step ? 'forward' : 'back')
    setError(null)
    setStep(next)
  }

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    void fetchMyTenants((a) => getTokenRef.current(a))
      .then((tenants) => {
        if (cancelled) return
        if (tenants.length > 0) {
          navigate('/dashboard', { replace: true })
          return
        }
        setChecking(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : shellT(lang, 'onboardingLoadError'))
        setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, navigate, lang])

  useEffect(() => {
    if (!user) return
    setFirstName((prev) => prev || user.firstName?.trim() || '')
    setLastName((prev) => prev || user.lastName?.trim() || '')
  }, [user])

  async function activateAndEnterDashboard(tenantId: string) {
    await switchTenant(tenantId)
    navigate('/dashboard', { replace: true })
  }

  async function finishOnboarding() {
    setError(null)
    setSubmitting(true)
    try {
      const result = await createWorkspace((a) => getTokenRef.current(a), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
      })
      await activateAndEnterDashboard(result.tenant_id)
    } catch (e: unknown) {
      if (e instanceof WorkspaceCreatedNeedsActiveTenantError) {
        try {
          await activateAndEnterDashboard(e.tenantId)
          return
        } catch (retryErr: unknown) {
          setError(retryErr instanceof Error ? retryErr.message : t('onboardingSubmitFailed'))
          return
        }
      }
      if (e instanceof WorkspaceAlreadyExistsError) {
        try {
          const tenants = await fetchMyTenants((a) => getTokenRef.current(a))
          if (tenants.length === 1) {
            await activateAndEnterDashboard(tenants[0].tenant_id)
            return
          }
          if (tenants.length > 1) {
            navigate('/dashboard', { replace: true })
            return
          }
        } catch (retryErr: unknown) {
          setError(retryErr instanceof Error ? retryErr.message : t('onboardingSubmitFailed'))
          return
        }
      }
      setError(e instanceof Error ? e.message : t('onboardingSubmitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function onProfile(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('onboardingNameRequired'))
      return
    }
    goToStep(2)
  }

  function onCompany(e: FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError(t('onboardingCompanyRequired'))
      return
    }
    goToStep(3)
  }

  const stepAnimClass =
    direction === 'forward' ? 'auth-onboarding-step-forward' : 'auth-onboarding-step-back'

  if (checking) {
    return (
      <AuthShell headlineKey="onboardingHeadline" supportingKey="onboardingSupporting">
        <div
          className="flex min-h-[12rem] items-center justify-center text-neutral-600"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">{t('bootLoadingLabel')}</span>
          <LoadingIcon className="size-5 animate-spin" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell headlineKey="onboardingHeadline" supportingKey="onboardingSupporting">
      <div className="w-full sm:rounded-md sm:border sm:border-neutral-200/80 sm:bg-white sm:p-6 sm:shadow-[0_18px_48px_rgba(11,37,40,0.12)] lg:p-7">
        <div className="mb-5 flex items-center gap-2">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                n <= step ? 'bg-[color:var(--brand)]' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-500">
          {t('onboardingStepLabel', { step, total: 3 })}
        </p>

        <div key={step} className={stepAnimClass}>
          {step === 1 ? (
            <form className="mt-3 flex flex-col gap-3.5" onSubmit={onProfile}>
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[color:var(--text-primary)]">
                {t('onboardingProfileTitle')}
              </h2>
              <p className="text-[14px] text-neutral-600">{t('onboardingProfileSubtitle')}</p>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">{t('onboardingFirstName')}</span>
                <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">{t('onboardingLastName')}</span>
                <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              {error ? <p className="text-[13px] text-[color:var(--danger)]">{error}</p> : null}
              <Button type="submit" variant="primary" size="lg" className="mt-1 w-full">
                {t('onboardingContinue')}
              </Button>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="mt-3 flex flex-col gap-3.5" onSubmit={onCompany}>
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[color:var(--text-primary)]">
                {t('onboardingCompanyTitle')}
              </h2>
              <p className="text-[14px] text-neutral-600">{t('onboardingCompanySubtitle')}</p>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">{t('onboardingCompanyName')}</span>
                <Input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>
              {error ? <p className="text-[13px] text-[color:var(--danger)]">{error}</p> : null}
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => goToStep(1)}
                >
                  {t('onboardingBack')}
                </Button>
                <Button type="submit" variant="primary" size="lg" className="flex-1">
                  {t('onboardingContinue')}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="mt-3 flex flex-col gap-4">
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[color:var(--text-primary)]">
                {t('onboardingTrialTitle')}
              </h2>
              <p className="text-[14px] text-neutral-600">
                {t('onboardingTrialIntro', { days: TRIAL_DAYS, price: TRIAL_PRICE_USD })}
              </p>
              <ul className="flex flex-col gap-2 text-[14px] text-[color:var(--text-primary)]">
                <li className="flex gap-2">
                  <span className="text-[color:var(--brand)]">✓</span>
                  {t('onboardingTrialBulletReports')}
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--brand)]">✓</span>
                  {t('onboardingTrialBulletCogs')}
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--brand)]">✓</span>
                  {t('onboardingTrialBulletChannels')}
                </li>
                <li className="flex gap-2">
                  <span className="text-[color:var(--brand)]">✓</span>
                  {t('onboardingTrialBulletAlerts')}
                </li>
              </ul>
              <p className="rounded-md bg-[color:var(--platinum-blonde-300)] px-3 py-2.5 text-[13px] text-neutral-700">
                {t('onboardingTrialNoCard', { days: TRIAL_DAYS, price: TRIAL_PRICE_USD })}
              </p>
              {error ? <p className="text-[13px] text-[color:var(--danger)]">{error}</p> : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => goToStep(2)}
                >
                  {t('onboardingBack')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void finishOnboarding()}
                >
                  {submitting ? t('authSubmitting') : t('onboardingGoDashboard')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthShell>
  )
}
