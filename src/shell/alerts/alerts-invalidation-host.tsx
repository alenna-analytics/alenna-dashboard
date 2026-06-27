import { useAlertsSyncInvalidation } from './use-alerts-sync-invalidation'

/** Keeps header alert counts in sync after connector sync jobs finish. */
export function AlertsInvalidationHost() {
  useAlertsSyncInvalidation()
  return null
}
