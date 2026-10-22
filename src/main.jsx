import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FiltrosProvider } from './state/FiltrosContext';
import './theme/estilos.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FiltrosProvider>
      <App />
    </FiltrosProvider>
  </StrictMode>,
);
