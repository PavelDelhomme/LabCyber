import { useState, useEffect, useRef } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

function readU32LE(arr, off) {
  return arr[off] | (arr[off + 1] << 8) | (arr[off + 2] << 16) | (arr[off + 3] << 24);
}
function readU16BE(arr, off) {
  return (arr[off] << 8) | arr[off + 1];
}

function parsePacketL3(data) {
  const out = { src: '—', dst: '—', protocol: '—', srcPort: '', dstPort: '' };
  if (data.length < 14) return out;
  const ethType = readU16BE(data, 12);
  let off = 14;
  if (ethType === 0x0800 && data.length >= 34) {
    const ihl = (data[14] & 0x0f) * 4;
    if (data.length < 14 + ihl + 4) return out;
    const proto = data[14 + 9];
    out.src = [data[26], data[27], data[28], data[29]].join('.');
    out.dst = [data[30], data[31], data[32], data[33]].join('.');
    out.protocol = proto === 6 ? 'TCP' : proto === 17 ? 'UDP' : proto === 1 ? 'ICMP' : 'IPv4';
    if (proto === 6 && data.length >= 14 + ihl + 4) {
      out.srcPort = String(readU16BE(data, 14 + ihl));
      out.dstPort = String(readU16BE(data, 14 + ihl + 2));
      if (out.srcPort || out.dstPort) out.protocol += ` (${out.srcPort} → ${out.dstPort})`;
    } else if (proto === 17 && data.length >= 14 + ihl + 4) {
      out.srcPort = String(readU16BE(data, 14 + ihl));
      out.dstPort = String(readU16BE(data, 14 + ihl + 2));
      if (out.srcPort || out.dstPort) out.protocol += ` (${out.srcPort} → ${out.dstPort})`;
    }
  } else if (ethType === 0x86dd && data.length >= 54) {
    out.protocol = 'IPv6';
    const fmt = (slice) => Array.from(slice).map(b => ('0' + b.toString(16)).slice(-2)).join('').replace(/(.{4})/g, '$1:').slice(0, -1);
    out.src = fmt(data.slice(22, 38));
    out.dst = fmt(data.slice(38, 54));
  } else {
    out.protocol = 'Ethernet';
  }
  return out;
}

function parsePcap(buffer) {
  const arr = new Uint8Array(buffer);
  if (arr.length < 24) return { packets: [], error: 'Fichier trop court (en-tête pcap 24 octets)' };
  const magic = readU32LE(arr, 0);
  const isMicrosecond = (magic === 0xa1b2c3d4 || magic === 0xa1b2cd34);
  const packets = [];
  let offset = 24;
  let idx = 0;
  while (offset + 16 <= arr.length) {
    const tsSec = readU32LE(arr, offset);
    const tsUsec = readU32LE(arr, offset + 4);
    const inclLen = readU32LE(arr, offset + 8);
    const origLen = readU32LE(arr, offset + 12);
    offset += 16;
    const data = inclLen > 0 && offset + inclLen <= arr.length ? arr.slice(offset, offset + inclLen) : new Uint8Array(0);
    const date = new Date(tsSec * 1000 + (isMicrosecond ? tsUsec / 1000 : tsUsec));
    const l3 = parsePacketL3(data);
    packets.push({
      index: idx++,
      ts: date.toISOString(),
      tsShort: date.toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      length: inclLen,
      origLen,
      data,
      hex: Array.from(data).slice(0, 64).map(b => ('0' + b.toString(16)).slice(-2)).join(' '),
      ...l3,
    });
    offset += inclLen;
  }
  return { packets, error: null };
}

export default function CaptureView({ currentLabId = 'default', storage, isPanel }) {
  const [packets, setPackets] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawBlob, setRawBlob] = useState(null);
  const [restoreStatus, setRestoreStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [sessionsList, setSessionsList] = useState([]);
  const restoringRef = useRef(false);

  const labId = currentLabId || 'default';

  const loadSessionsList = () => {
    if (!storage?.getCaptureSessionsList) return;
    storage.getCaptureSessionsList(labId).then(setSessionsList);
  };

  useEffect(() => {
    loadSessionsList();
  }, [labId, storage]);

  useEffect(() => {
    if (!storage?.getCaptureState || restoringRef.current) return;
    storage.getCaptureState(labId).then((state) => {
      if (!state || !state.blob) return;
      try {
        const { packets: p, error: err } = parsePcap(state.blob);
        if (err) return;
        setPackets(p);
        setFileName(state.fileName || '');
        setFilter(state.filter || '');
        const idx = state.selectedIndex != null ? state.selectedIndex : 0;
        setSelected(p[idx] || p[0] || null);
        setRawBlob(state.blob);
        setError(null);
      } catch (_) {}
    });
  }, [labId, storage]);

  const handleFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setError(null);
    setSelected(null);
    setRestoreStatus('');
    setSaveStatus('');
    const r = new FileReader();
    r.onload = () => {
      try {
        const buf = r.result;
        const { packets: p, error: err } = parsePcap(buf);
        if (err) setError(err);
        else {
          setPackets(p);
          setFileName(file.name || '');
          setRawBlob(buf);
          setSelected(p[0] || null);
        }
      } catch (err) {
        setError(err.message || 'Erreur lecture pcap');
        setPackets([]);
        setRawBlob(null);
      }
    };
    r.readAsArrayBuffer(file);
  };

  const saveToLab = () => {
    if (!storage?.setCaptureState || !labId) return;
    setSaveStatus('');
    if (!rawBlob && packets.length === 0) {
      setSaveStatus('Aucune capture à enregistrer.');
      return;
    }
    storage.setCaptureState(labId, {
      fileName,
      selectedIndex: selected?.index ?? 0,
      filter,
      blob: rawBlob || null,
    });
    setSaveStatus('Enregistré dans le lab.');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const saveAsSession = () => {
    if (!storage?.setCaptureSession || !labId) return;
    if (!rawBlob && packets.length === 0) {
      setSaveStatus('Aucune capture à enregistrer.');
      return;
    }
    const name = prompt('Nom de la session de capture ?', fileName || 'Capture ' + new Date().toLocaleString('fr-FR'));
    if (name == null || !name.trim()) return;
    const sessionId = 'cap' + Date.now();
    storage.setCaptureSession(labId, sessionId, {
      name: name.trim(),
      fileName,
      selectedIndex: selected?.index ?? 0,
      filter,
      blob: rawBlob || null,
    });
    setSaveStatus('Session « ' + name.trim() + ' » enregistrée.');
    setTimeout(() => { loadSessionsList(); setSaveStatus(''); }, 1500);
  };

  const loadSession = (sessionId) => {
    if (!storage?.getCaptureSession || !labId) return;
    setRestoreStatus('Chargement…');
    storage.getCaptureSession(labId, sessionId).then((state) => {
      if (!state || !state.blob) {
        setRestoreStatus('Session vide ou introuvable.');
        setTimeout(() => setRestoreStatus(''), 3000);
        return;
      }
      try {
        const { packets: p, error: err } = parsePcap(state.blob);
        if (err) {
          setRestoreStatus('Erreur: ' + err);
          return;
        }
        setPackets(p);
        setFileName(state.fileName || '');
        setFilter(state.filter || '');
        const idx = state.selectedIndex != null ? state.selectedIndex : 0;
        setSelected(p[idx] || p[0] || null);
        setRawBlob(state.blob);
        setError(null);
        setRestoreStatus('Session chargée.');
        setTimeout(() => setRestoreStatus(''), 2000);
      } catch (e) {
        setRestoreStatus('Erreur chargement.');
      }
    });
  };

  const deleteSession = (sessionId) => {
    if (!storage?.deleteCaptureSession || !labId || !confirm('Supprimer cette session de capture ?')) return;
    storage.deleteCaptureSession(labId, sessionId);
    loadSessionsList();
  };

  const restoreFromLab = () => {
    if (!storage?.getCaptureState || !labId) return;
    setRestoreStatus('Chargement…');
    restoringRef.current = true;
    storage.getCaptureState(labId).then((state) => {
      restoringRef.current = false;
      if (!state || !state.blob) {
        setRestoreStatus('Aucune session enregistrée pour ce lab.');
        setTimeout(() => setRestoreStatus(''), 3000);
        return;
      }
      try {
        const { packets: p, error: err } = parsePcap(state.blob);
        if (err) {
          setRestoreStatus('Erreur: ' + err);
          return;
        }
        setPackets(p);
        setFileName(state.fileName || '');
        setFilter(state.filter || '');
        const idx = state.selectedIndex != null ? state.selectedIndex : 0;
        setSelected(p[idx] || p[0] || null);
        setRawBlob(state.blob);
        setError(null);
        setRestoreStatus('Session restaurée.');
        setTimeout(() => setRestoreStatus(''), 2000);
      } catch (e) {
        setRestoreStatus('Erreur restauration.');
      }
    });
  };

  const filteredPackets = (() => {
    if (!filter.trim()) return packets;
    const f = filter.trim().toLowerCase();
    return packets.filter(
      (p) =>
        String(p.index).includes(f) ||
        String(p.length).includes(f) ||
        (p.ts && p.ts.toLowerCase().includes(f)) ||
        (p.src && p.src.toLowerCase().includes(f)) ||
        (p.dst && p.dst.toLowerCase().includes(f)) ||
        (p.protocol && p.protocol.toLowerCase().includes(f))
    );
  })();

  const content = (
    <>
      <section class="room-section capture-upload">
        <p class="capture-client-notice text-muted">
          Pour analyser le trafic de <strong>votre machine</strong> (celle où tourne le navigateur : cartes réseau, WiFi, etc.), capturez sur votre PC avec Wireshark, tcpdump ou npcap, puis chargez le fichier .pcap ci-dessous. Le navigateur ne peut pas capturer en direct sur vos interfaces (sécurité).
        </p>
        <label class="btn btn-primary">
          Choisir un fichier .pcap
          <input type="file" accept=".pcap,.cap" onChange={handleFile} style="display:none" />
        </label>
        {labId && storage && (
          <span style="margin-left:0.5rem; display:inline-flex; align-items:center; gap:0.35rem; flex-wrap:wrap">
            <button type="button" class="btn btn-secondary" onClick={saveToLab} title="Écraser la session courante du lab">
              Enregistrer (session courante)
            </button>
            <button type="button" class="btn btn-secondary" onClick={saveAsSession} title="Créer une nouvelle session nommée (plusieurs par lab)">
              Sauvegarder sous…
            </button>
            <button type="button" class="btn btn-secondary" onClick={restoreFromLab} title="Restaurer la dernière session courante du lab">
              Restaurer session courante
            </button>
            {saveStatus && <span class="text-muted" style="margin-left:0.5rem">{saveStatus}</span>}
            {restoreStatus && <span class="text-muted" style="margin-left:0.5rem">{restoreStatus}</span>}
          </span>
        )}
        {labId && storage && sessionsList.length > 0 && (
          <div class="capture-sessions-list" style={{ marginTop: '0.75rem' }}>
            <h4 style="margin:0 0 0.35rem; font-size:0.95rem">Sessions enregistrées (ce lab)</h4>
            <ul class="capture-sessions-ul">
              {sessionsList.map((s) => (
                <li key={s.id} class="capture-sessions-li">
                  <span class="capture-sessions-name">{escapeHtml(s.name || s.id)}</span>
                  <span class="capture-sessions-date">{s.updatedAt ? new Date(s.updatedAt).toLocaleString('fr-FR') : ''}</span>
                  <button type="button" class="btn btn-secondary" onClick={() => loadSession(s.id)}>Charger</button>
                  <button type="button" class="topbar-btn danger" onClick={() => deleteSession(s.id)}>Supprimer</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!packets.length && !error && (
          <p class="section-desc text-muted" style="margin-top:0.75rem">
            Aucun fichier chargé. Charge un .pcap (ex. <code>tcpdump -w cap.pcap</code>) ou restaure la session du lab.
          </p>
        )}
      </section>

      {error && <p class="proxy-tools-error">{escapeHtml(error)}</p>}

      {packets.length > 0 && (
        <section class="room-section">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem">
            <h3 style="margin:0">Paquets ({filteredPackets.length}{filter ? ` / ${packets.length}` : ''})</h3>
            <input
              type="text"
              class="search-input"
              placeholder="Filtre (n°, heure, IP, proto)"
              value={filter}
              onInput={(e) => setFilter(e.target.value)}
              style="max-width:200px"
            />
          </div>
          <div class="capture-layout">
            <table class="capture-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Length</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackets.map((p) => (
                  <tr
                    key={p.index}
                    class={selected?.index === p.index ? 'selected' : ''}
                    onClick={() => setSelected(p)}
                  >
                    <td>{p.index}</td>
                    <td class="capture-time">{p.tsShort || p.ts}</td>
                    <td class="capture-addr">{escapeHtml(p.src || '—')}</td>
                    <td class="capture-addr">{escapeHtml(p.dst || '—')}</td>
                    <td class="capture-proto">{escapeHtml(p.protocol || '—')}</td>
                    <td>{p.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div class="capture-detail">
              {selected ? (
                <>
                  <h4>Paquet #{selected.index}</h4>
                  <p><strong>Time</strong> {selected.ts} · <strong>Length</strong> {selected.length} octets</p>
                  {(selected.src || selected.dst) && (
                    <p><strong>Source</strong> {escapeHtml(selected.src || '—')} → <strong>Destination</strong> {escapeHtml(selected.dst || '—')} · <strong>Protocol</strong> {escapeHtml(selected.protocol || '—')}</p>
                  )}
                  <p>Hex (64 premiers octets):</p>
                  <pre class="capture-hex">{selected.hex}</pre>
                  <p>Données brutes (début):</p>
                  <pre class="capture-hex">{Array.from(selected.data).slice(0, 128).join(', ')}</pre>
                </>
              ) : (
                <p class="text-muted">Clique sur un paquet pour voir le détail.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );

  if (isPanel) {
    return <div class="view-capture-panel">{content}</div>;
  }

  return (
    <div id="view-capture" class="view">
      <header class="page-header">
        <h2>Capture (pcap)</h2>
        <p class="room-description">
          Visualiseur type Wireshark : liste des paquets, détail hex, filtre. S’exécute dans le contexte du lab actif : tu peux enregistrer et restaurer la session pour ce lab. Ouvre le panneau Capture (bouton 📡) en parallèle du terminal ou du bureau pour garder la même session.
        </p>
      </header>
      {content}
    </div>
  );
}
