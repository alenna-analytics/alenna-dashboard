import { DatePickerField } from '@/components/composed/date-picker-field'
import { PageHeader } from '@/components/composed/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export function SettingsPage() {
  const [sampleDate, setSampleDate] = useState<Date | undefined>(undefined)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace preferences and integrations."
      />
      <Card className="max-w-md border-border-default bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-base text-text-primary">
            Date picker (sample)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DatePickerField value={sampleDate} onChange={setSampleDate} />
        </CardContent>
      </Card>
    </div>
  )
}
