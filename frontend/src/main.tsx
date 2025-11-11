import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './App.tsx'
import { appTheme } from './theme'
import { AppErrorBoundary } from './core/AppErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppErrorBoundary>
    <App />
      </AppErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
