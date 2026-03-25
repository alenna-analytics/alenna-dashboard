import { PageHeader } from '@/components/composed/page-header'

export function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Plan and Stripe checkout (Phase 9)."
      />
      <p className="text-sm text-text-secondary">Shell page — content TBD.</p>
    </div>
  )
}
