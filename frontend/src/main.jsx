import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
