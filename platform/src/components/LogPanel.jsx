import { useState, useEffect } from 'preact/hooks';

const logger = typeof window !== 'undefined' ? window.LabCyberLogger : null;

export default function LogPanel({ open, onClose }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!logger) return;
    setEntries(logger.getEntries ? logger.getEntries() : []);
    const handler = () => setEntries(logger.getEntries ? logger.getEntries() : []);
    window.addEventListener('labcyber-log', handler);
    return () => window.removeEventListener('labcyber-log', handler);
  }, [open]);

  const clear = () => {
    if (logger && logger.clear) logger.clear();
    setEntries([]);
  };

  const exportJson = () => {
    const blob = new Blob([logger ? logger.exportAsJson() : '[]'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `labcyber-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportTxt = () => {
    const blob = new Blob([logger ? logger.exportAsText() : ''], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `labcyber-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!open) return null;

  return (
    <aside class="log-panel" id="log-panel">
      <div class="log-panel-header">
        <h3>Journal d'activité</h3>
        <div class="log-panel-actions">
          <button type="button" onClick={exportJson} title="Exporter JSON">Export JSON</button>
          <button type="button" onClick={exportTxt} title="Exporter TXT">Export TXT</button>
          <button type="button" onClick={clear} title="Effacer">Effacer</button>
          <button type="button" onClick={onClose} title="Fermer">−</button>
        </div>
      </div>
      <div class="log-panel-body">
        <ul id="log-entries">
          {entries.slice().reverse().map((e, i) => (
            <li key={i} class={`log-level-${e.level || 'INFO'}`}>
              <span class="log-ts">{e.ts}</span>
              <span class="log-component">{e.component}</span>
              <span class="log-action">{e.action}</span>
              {e.details && Object.keys(e.details).length ? <pre class="log-details">{JSON.stringify(e.details)}</pre> : null}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
