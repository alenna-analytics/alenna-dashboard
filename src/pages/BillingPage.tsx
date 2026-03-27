import { usePageChrome } from '@/components/providers/page-chrome-context'
import { useEffect } from 'react'

export function BillingPage() {
  const { setPageMeta } = usePageChrome()

  useEffect(() => {
    setPageMeta({ title: 'Billing' })
    return () => setPageMeta({ title: '' })
  }, [setPageMeta])

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">Shell page — content TBD.</p>
    </div>
  )
}
