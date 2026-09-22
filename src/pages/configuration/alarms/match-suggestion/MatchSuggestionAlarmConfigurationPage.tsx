import { useWorkspace } from '@/shell/providers/workspace-context'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import {
  showAlarmConfigErrorToast,
  showAlarmConfigSuccessToast,
} from '@/pages/configuration/alarms/stock/alarm-config-toast'
import { MatchSuggestionAlertToggleCard } from '@/pages/configuration/alarms/match-suggestion/match-suggestion-alert-toggle-card'
import {
  useMatchSuggestionRuleQuery,
  usePatchMatchSuggestionRuleMutation,
} from '@/pages/configuration/alarms/match-suggestion/use-match-suggestion-rule-queries'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Skeleton } from '@/ui/skeleton'

export function MatchSuggestionAlarmConfigurationPage() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const isAdmin = can(me, 'alerts.manage')

  const ruleQuery = useMatchSuggestionRuleQuery()
  const patchMutation = usePatchMatchSuggestionRuleMutation()

  const rule = ruleQuery.data
  const loading = ruleQuery.isLoading
  const saving = patchMutation.isPending

  const handleEnabledChange = async (enabled: boolean) => {
    if (!rule || enabled === rule.enabled) return
    try {
      await patchMutation.mutateAsync({ enabled })
      showAlarmConfigSuccessToast(lang, 'alarmsToastRuleUpdated')
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    }
  }

  return (
    <DashboardPage className="space-y-8">
      <section className="max-w-2xl">
        <h1 className={pageTitleClassName}>{shellT(lang, 'alarmsMatchTypeTitle')}</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
          {shellT(lang, 'alarmsMatchTypeDescription')}
        </p>
      </section>

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <section className="grid w-full gap-3">
          <MatchSuggestionAlertToggleCard
            lang={lang}
            titleKey="alarmsMatchEnabledLabel"
            descriptionKey="alarmsMatchEnabledDescription"
            helpKey="alarmsMatchEnabledHelp"
            active={rule?.enabled ?? false}
            disabled={!isAdmin}
            saving={saving}
            onEnabledChange={(next) => {
              void handleEnabledChange(next)
            }}
          />
        </section>
      )}
    </DashboardPage>
  )
}
