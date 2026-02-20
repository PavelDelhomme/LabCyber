import { render } from 'preact';
import '../css/style.css';
import App from './App';

function getStorage() {
  return typeof window !== 'undefined' ? window.LabCyberStorage : null;
}
function getLogger() {
  return typeof window !== 'undefined' ? window.LabCyberLogger : null;
}

const INIT_TIMEOUT_MS = 8000;

function doRender() {
  const root = document.getElementById('root');
  if (root) render(<App />, root);
}

async function init() {
  try {
    const storage = getStorage();
    if (storage && storage.ready) {
      await Promise.race([
        storage.ready(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('storage.ready timeout')), INIT_TIMEOUT_MS))
      ]);
    }
    const logger = getLogger();
    if (logger && logger.hydrateFromStorage) {
      await Promise.race([
        logger.hydrateFromStorage(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('logger.hydrate timeout')), 3000))
      ]);
    }
  } catch (e) {
    console.warn('Lab Cyber init:', e?.message || e);
  }
  doRender();
}

// Attendre que le document et les scripts synchrones (storage.js, logger.js) soient chargés avant d'exécuter l'app
function boot() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
}
boot();
