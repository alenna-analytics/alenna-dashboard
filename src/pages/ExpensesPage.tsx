import { EmptyState } from '@/components/composed/empty-state'
import { PageHeader } from '@/components/composed/page-header'
import { ReceiptIcon } from 'lucide-react'

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Periodic costs and allocations."
      />
      <EmptyState
        icon={<ReceiptIcon className="size-6 text-text-secondary" />}
        title="No expenses"
        description="CRUD for expenses ships in Phase 9."
        action={{ label: 'Add expense', onClick: () => {} }}
      />
    </div>
  )
}
