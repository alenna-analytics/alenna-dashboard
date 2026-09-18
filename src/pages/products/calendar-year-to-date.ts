import { toYmd } from '@/pages/reports/reports-ui-helpers'

/** Inclusive calendar YTD range in local YYYY-MM-DD. */
export function calendarYearToDateRange(now = new Date()): { start: string; end: string } {
  return {
    start: `${now.getFullYear()}-01-01`,
    end: toYmd(now),
  }
}
