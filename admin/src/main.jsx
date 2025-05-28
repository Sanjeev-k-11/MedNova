import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom' 
import AdminContextProvider from './context/AdminContext.jsx'
import DoctorContextProvider from './context/doctorContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import { StaffContextProvider } from './context/StaffContext.jsx'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StaffContextProvider>
    <AdminContextProvider>
      <DoctorContextProvider>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </DoctorContextProvider>
    </AdminContextProvider>
    </StaffContextProvider>
  
    
  </BrowserRouter>,
)
