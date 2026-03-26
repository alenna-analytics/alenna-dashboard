import { EmptyState } from '@/components/composed/empty-state'
import { usePageChrome } from '@/components/providers/page-chrome-context'
import { ReceiptIcon } from 'lucide-react'
import { useEffect } from 'react'

export function ExpensesPage() {
  const { setPageMeta } = usePageChrome()

  useEffect(() => {
    setPageMeta({ title: 'Expenses' })
    return () => setPageMeta({ title: '' })
  }, [setPageMeta])

  return (
    <div className="space-y-6">
      <EmptyState
        icon={<ReceiptIcon className="size-6 text-text-secondary" />}
        title="No expenses"
        description="CRUD for expenses ships in Phase 9."
        action={{ label: 'Add expense', onClick: () => {} }}
      />
    </div>
  )
}
