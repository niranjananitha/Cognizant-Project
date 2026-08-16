import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { EquipmentProvider } from './contexts/EquipmentContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EquipmentProvider>
          <App />
        </EquipmentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
