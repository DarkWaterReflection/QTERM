import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error logging for production debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error('QTERM_GLOBAL_ERROR:', msg, 'at', lineNo, ':', columnNo, error);
  return false;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
