import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config' // initialises i18n
import App from './App.jsx'
import { APP_DIRECTION } from './theme/muiTheme'
import { brand } from './config'

// Direction and language before the first render, so there is no flash of the wrong side.
document.documentElement.dir = APP_DIRECTION
document.documentElement.lang = APP_DIRECTION === 'rtl' ? 'he' : 'en'

// The brand: tab title and favicon (see src/config.js).
document.title = brand.name
const favicon = document.querySelector("link[rel='icon']")
if (favicon) favicon.href = brand.icon

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
