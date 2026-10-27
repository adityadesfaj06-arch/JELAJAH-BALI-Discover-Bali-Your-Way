import { createRoot } from 'react-dom/client';
import { APIProvider } from '@vis.gl/react-google-maps';
import App from './App.tsx';
import { I18nProvider } from './i18n/useTranslation.tsx';
import './index.css';

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __gmpQuotaExceeded?: boolean;
  }
}

function notifyGmpQuotaExceeded() {
  if (window.__gmpQuotaExceeded) return;
  window.__gmpQuotaExceeded = true;
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

// 1. Official Maps JS API auth/quota failure callback
const prevAuthFailure = window.gm_authFailure;
window.gm_authFailure = () => {
  prevAuthFailure?.();
  notifyGmpQuotaExceeded();
};

// 2. Maps JS API logs OverQuotaMapError to console.error even when gm_authFailure does not fire
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  if (
    args.some(
      (a) =>
        typeof a === 'string' &&
        /OverQuotaMapError|QuotaExceededError|ApiTargetBlockedMapError/i.test(a)
    )
  ) {
    notifyGmpQuotaExceeded();
  }
};

const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <APIProvider apiKey={mapsApiKey}>
      <App />
    </APIProvider>
  </I18nProvider>
);
