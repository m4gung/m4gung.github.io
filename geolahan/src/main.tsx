import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import './styles/index.css';
import { App } from './app/App';
import { initPwa } from './pwa/pwa-store';

initPwa();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemen #root tidak ditemukan');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
