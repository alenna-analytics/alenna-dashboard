import { ClerkProvider } from '@clerk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AppProviders } from '@/components/providers/app-providers'

import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <AppProviders>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProviders>
    </ClerkProvider>
  </StrictMode>,
)
