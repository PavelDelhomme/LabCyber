import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import '../css/style.css';
import App from './App';

const storage = typeof window !== 'undefined' ? window.LabCyberStorage : null;
const logger = typeof window !== 'undefined' ? window.LabCyberLogger : null;

async function init() {
  if (storage) await storage.ready();
  if (logger && logger.hydrateFromStorage) await logger.hydrateFromStorage();
}

init().then(() => {
  render(<App />, document.getElementById('root'));
});
