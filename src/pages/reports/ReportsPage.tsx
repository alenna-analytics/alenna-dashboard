import { Navigate } from 'react-router-dom'

/** Legacy route; reports UI lives on the dashboard home. */
export function ReportsPage() {
  return <Navigate to="/dashboard" replace />
}
