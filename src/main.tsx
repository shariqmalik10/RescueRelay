import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App'
import './styles.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim()
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App backend="convex" />
      </ConvexProvider>
    ) : (
      <App backend="local" />
    )}
  </StrictMode>,
)
