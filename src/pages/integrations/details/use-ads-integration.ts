import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPostJson } from '@/lib/api'
import { readApiErrorDetail } from '@/lib/integrations/platform-full-sync-error'
import type { ShopifySyncEnqueueResponse } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { formatShopifyLastSync } from '@/lib/integrations/shopify-format'
import { findActiveConnection, findPendingGoogleAdsConnection } from '@/pages/integrations/dashboard/integration-connection'
import { useCatalogJobQuery, useRetryCatalogJobMutation } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_ADS_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

export type AdsPlatformSlug = 'amazon_ads' | 'mercadolibre_ads' | 'google_ads'

export type AdsSyncPhase = 'idle' | 'working' | 'done_ok' | 'done_fail'

export type GoogleAdsPendingCandidate = {
  id: string
  descriptive_name: string
  currency_code: string
}

function adsActivityHref(slug: AdsPlatformSlug): string {
  return `/dashboard/integrations/${slug}?tab=settings`
}

function adsAuthUrl(slug: AdsPlatformSlug): string {
  if (slug === 'amazon_ads') return '/connectors/amazon-ads/authorization-url'
  if (slug === 'google_ads') return '/connectors/google-ads/authorization-url'
  return '/connectors/mercadolibre/authorization-url?intent=ads'
}

function adsSyncPath(slug: AdsPlatformSlug): string {
  if (slug === 'amazon_ads') return '/connectors/amazon-ads/sync'
  if (slug === 'google_ads') return '/connectors/google-ads/sync'
  return '/connectors/mercadolibre-ads/sync'
}

function adsDisconnectPath(slug: AdsPlatformSlug, id: string): string {
  if (slug === 'amazon_ads') return `/connectors/amazon-ads/${id}`
  if (slug === 'google_ads') return `/connectors/google-ads/${id}`
  return `/connectors/mercadolibre-ads/${id}`
}

export function useAdsIntegration(slug: AdsPlatformSlug) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity } = useGlobalActivity()
  const isAdmin = can(me, 'integrations.manage')
  const { connections, pageLoading, pageError } = useIntegrationsListQueries()
  const activeConnection = findActiveConnection(connections, slug)
  const pendingGoogleAds =
    slug === 'google_ads' ? findPendingGoogleAdsConnection(connections) : null
  const pendingGoogleAdsId = pendingGoogleAds?.id ?? null
  const [connectStarting, setConnectStarting] = useState(false)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [pendingCandidates, setPendingCandidates] = useState<GoogleAdsPendingCandidate[]>(
    [],
  )
  const [pendingAccountsLoading, setPendingAccountsLoading] = useState(false)
  const [pendingAccountsError, setPendingAccountsError] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const settledJobSigRef = useRef<string | null>(null)

  const authUrl = adsAuthUrl(slug)
  const syncPath = adsSyncPath(slug)
  const disconnectPath = (id: string) => adsDisconnectPath(slug, id)

  const invalidateAds = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    void queryClient.invalidateQueries({ queryKey: ['ads'] })
  }, [queryClient, tenantId])

  useEffect(() => {
    if (slug !== 'google_ads' || !pendingGoogleAdsId || !isAdmin) {
      setPendingCandidates([])
      setPendingAccountsError(null)
      setSelectedCustomerId(null)
      return
    }
    let cancelled = false
    setPendingAccountsLoading(true)
    setPendingAccountsError(null)
    void (async () => {
      try {
        const res = await apiFetch(
          '/connectors/google-ads/pending-accounts',
          (a) => getToken(a),
          {},
          tenantId,
        )
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            if (!cancelled) {
              setPendingCandidates([])
              setPendingAccountsError(
                shellT(
                  lang,
                  res.status === 410
                    ? 'integrationGoogleAdsSelectExpired'
                    : 'integrationGoogleAdsSelectEmpty',
                ),
              )
            }
            return
          }
          throw new Error(await res.text())
        }
        const body = (await res.json()) as { candidates: GoogleAdsPendingCandidate[] }
        if (cancelled) return
        setPendingCandidates(body.candidates ?? [])
        setSelectedCustomerId(body.candidates?.[0]?.id ?? null)
      } catch (e) {
        if (!cancelled) {
          setPendingAccountsError(
            e instanceof Error ? e.message : shellT(lang, 'integrationGoogleAdsSelectError'),
          )
        }
      } finally {
        if (!cancelled) setPendingAccountsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, pendingGoogleAdsId, isAdmin, getToken, tenantId, lang])

  const confirmAccountMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiPostJson(
        '/connectors/google-ads/confirm-account',
        (a) => getToken(a),
        { customer_id: customerId },
        {},
        tenantId,
      )
      if (!res.ok) {
        if (res.status === 410) {
          throw new Error(shellT(lang, 'integrationGoogleAdsSelectExpired'))
        }
        if (res.status === 404) {
          throw new Error(shellT(lang, 'integrationGoogleAdsSelectEmpty'))
        }
        const detail = await readApiErrorDetail(res)
        throw new Error(detail ?? shellT(lang, 'integrationGoogleAdsSelectError'))
      }
      return (await res.json()) as { connection_id: string; customer_id: string }
    },
    onSuccess: () => {
      setPendingCandidates([])
      setSelectedCustomerId(null)
      invalidateAds()
      toast.success(shellT(lang, 'integrationAdsOAuthConnected'))
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const startConnect = useCallback(async () => {
    setConnectStarting(true)
    try {
      const res = await apiFetch(authUrl, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const body = (await res.json()) as { url: string }
      window.location.href = body.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : shellT(lang, 'integrationConnectFailed'))
      setConnectStarting(false)
    }
  }, [authUrl, getToken, tenantId, lang])

  const disconnectMutation = useMutation({
    mutationFn: async (purgeData: boolean) => {
      if (!activeConnection) return
      const res = await apiFetch(
        `${disconnectPath(activeConnection.id)}?purge_data=${purgeData ? 'true' : 'false'}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok && res.status !== 204) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
    },
    onSuccess: () => {
      removeActivity(GLOBAL_ACTIVITY_ADS_SYNC_ID)
      invalidateAds()
      toast.success(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const syncPlan = activeConnection?.sync_plan ?? null
  const serverJobId = syncPlan?.current_job_id ?? null
  const effectiveJobId = pendingJobId ?? serverJobId
  const adsJobQuery = useCatalogJobQuery(effectiveJobId, Boolean(effectiveJobId && activeConnection))
  const liveJobStatus = adsJobQuery.data?.status ?? null
  const retryCatalogJobMutation = useRetryCatalogJobMutation()

  const syncMutation = useMutation({
    mutationFn: async (): Promise<ShopifySyncEnqueueResponse> => {
      if (!activeConnection) {
        throw new Error(shellT(lang, 'integrationsStatusNotConnected'))
      }
      const res = await apiPostJson(
        syncPath,
        (a) => getToken(a),
        { full: true, platform_connection_id: activeConnection.id },
        {},
        tenantId,
      )
      if (!res.ok) {
        const detail = await readApiErrorDetail(res)
        if (res.status === 409 && detail === 'platform_sync_in_progress') {
          throw new Error(shellT(lang, 'syncInProgressToast'))
        }
        throw new Error(detail ?? res.statusText)
      }
      return (await res.json()) as ShopifySyncEnqueueResponse
    },
    onSuccess: (data) => {
      setPendingJobId(data.job_id)
      upsertActivity({
        id: GLOBAL_ACTIVITY_ADS_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'adsSyncProgressTitle'),
        subtitle: shellT(lang, 'amazonSyncProgressQueued'),
        href: adsActivityHref(slug),
        minimized: false,
        jobId: data.job_id,
      })
      invalidateAds()
    },
    onError: (e: Error) => {
      toast.error(e.message)
      invalidateAds()
    },
  })

  useEffect(() => {
    if (!effectiveJobId) return
    const job = adsJobQuery.data
    if (!job || job.id !== effectiveJobId) return
    if (job.status === 'queued' || job.status === 'running') {
      settledJobSigRef.current = null
      upsertActivity({
        id: GLOBAL_ACTIVITY_ADS_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'adsSyncProgressTitle'),
        subtitle:
          job.status === 'queued'
            ? shellT(lang, 'amazonSyncProgressQueued')
            : shellT(lang, 'syncRunning'),
        href: adsActivityHref(slug),
        minimized: false,
        jobId: job.id,
      })
      return
    }
    const sig = `${job.id}:${job.status}`
    if (settledJobSigRef.current === sig) return
    settledJobSigRef.current = sig
    setPendingJobId(null)
    if (job.status === 'succeeded') {
      upsertActivity({
        id: GLOBAL_ACTIVITY_ADS_SYNC_ID,
        phase: 'success',
        title: shellT(lang, 'adsSyncProgressTitle'),
        subtitle: shellT(lang, 'integrationSyncQueued'),
        href: adsActivityHref(slug),
        minimized: false,
        jobId: job.id,
      })
      invalidateAds()
      return
    }
    if (job.status === 'failed') {
      upsertActivity({
        id: GLOBAL_ACTIVITY_ADS_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'adsSyncProgressTitle'),
        subtitle: job.error_message ?? shellT(lang, 'integrationConnectFailed'),
        href: adsActivityHref(slug),
        minimized: false,
        jobId: job.id,
      })
      invalidateAds()
    }
  }, [adsJobQuery.data, effectiveJobId, invalidateAds, lang, slug, upsertActivity])

  const adsSyncPhase = useMemo((): AdsSyncPhase => {
    if (!activeConnection) return 'idle'
    if (effectiveJobId && liveJobStatus === 'queued') return 'working'
    if (effectiveJobId && liveJobStatus === 'running') return 'working'
    if (effectiveJobId && liveJobStatus === 'failed') return 'done_fail'
    if (effectiveJobId && liveJobStatus === 'succeeded') return 'done_ok'
    if (pendingJobId && !liveJobStatus && !adsJobQuery.isFetched) return 'working'
    if (syncPlan?.current_job_id && !liveJobStatus && !adsJobQuery.isFetched) return 'working'
    if (syncPlan?.last_sync_status === 'syncing') return 'working'
    if (syncPlan?.last_sync_status === 'failed') return 'done_fail'
    return 'idle'
  }, [
    activeConnection,
    adsJobQuery.isFetched,
    effectiveJobId,
    liveJobStatus,
    pendingJobId,
    syncPlan?.current_job_id,
    syncPlan?.last_sync_status,
  ])

  const retryAdsSync = useCallback(() => {
    const jobId = adsJobQuery.data?.id ?? effectiveJobId
    if (jobId) {
      retryCatalogJobMutation.mutate(jobId)
      return
    }
    syncMutation.mutate()
  }, [adsJobQuery.data?.id, effectiveJobId, retryCatalogJobMutation, syncMutation])

  const siblingSlug =
    slug === 'amazon_ads' ? 'amazon' : slug === 'mercadolibre_ads' ? 'mercadolibre' : null
  const sibling = siblingSlug ? findActiveConnection(connections, siblingSlug) : null
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(
    activeConnection?.last_synced_at,
    lang,
    neverLabel,
  )

  return {
    isAdmin,
    connected: Boolean(activeConnection),
    needsAccountSelection: Boolean(pendingGoogleAds) && !activeConnection,
    pendingCandidates,
    pendingAccountsLoading,
    pendingAccountsError,
    selectedCustomerId,
    setSelectedCustomerId,
    confirmAccountMutation,
    activeConnection,
    sibling,
    isLoading: pageLoading,
    error: pageError,
    connectStarting,
    startConnect,
    disconnectMutation,
    syncMutation,
    syncPlan,
    lastSyncDisplay,
    adsSyncPhase,
    adsJobQuery,
    activeSyncJobId: effectiveJobId,
    retryAdsSync,
    retryAdsSyncPending: retryCatalogJobMutation.isPending,
    caseC: Boolean(siblingSlug) && Boolean(activeConnection) && !sibling,
    caseA: Boolean(siblingSlug) && Boolean(sibling) && !activeConnection,
  }
}
