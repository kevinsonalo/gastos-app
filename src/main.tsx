import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createDependencies } from './infrastructure/container'
import App from './presentation/App'

// Composition root: único punto que conoce las implementaciones concretas.
const deps = createDependencies({
  dataSource: import.meta.env.VITE_DATA_SOURCE,
  apiUrl: import.meta.env.VITE_API_URL,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App deps={deps} />
  </StrictMode>,
)
