import { ClerkProvider } from '@clerk/react'
import { ui } from '@clerk/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AppErrorBoundary } from '@/shell/app-error-boundary'
import { AppProviders } from '@/shell/providers/app-providers'

import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      ui={ui}
    >
      <AppProviders>
        <BrowserRouter>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </BrowserRouter>
      </AppProviders>
    </ClerkProvider>
  </StrictMode>,
)
