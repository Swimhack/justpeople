import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SecurityHeaders } from './components/security/SecurityHeader'

createRoot(document.getElementById("root")!).render(
  <>
    <SecurityHeaders />
    <App />
  </>
);
