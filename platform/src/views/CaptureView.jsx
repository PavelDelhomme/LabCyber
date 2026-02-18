import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

function readU32LE(arr, off) {
  return arr[off] | (arr[off + 1] << 8) | (arr[off + 2] << 16) | (arr[off + 3] << 24);
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
    packets.push({
      index: idx++,
      ts: date.toISOString(),
      length: inclLen,
      origLen,
      data,
      hex: Array.from(data).slice(0, 64).map(b => ('0' + b.toString(16)).slice(-2)).join(' '),
    });
    offset += inclLen;
  }
  return { packets, error: null };
}

export default function CaptureView() {
  const [packets, setPackets] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setError(null);
    setSelected(null);
    const r = new FileReader();
    r.onload = () => {
      try {
        const { packets: p, error: err } = parsePcap(r.result);
        if (err) setError(err);
        else setPackets(p);
      } catch (err) {
        setError(err.message || 'Erreur lecture pcap');
        setPackets([]);
      }
    };
    r.readAsArrayBuffer(file);
  };

  return (
    <div id="view-capture" class="view">
      <header class="page-header">
        <h2>Capture (pcap)</h2>
        <p class="room-description">Visualiseur de fichiers .pcap : liste des paquets et détail (hex). Génère un .pcap depuis le terminal avec <code>tcpdump -i any -w cap.pcap</code>, télécharge-le puis charge-le ici.</p>
      </header>

      <section class="room-section">
        <label class="btn btn-primary">
          Choisir un fichier .pcap
          <input type="file" accept=".pcap,.cap" onChange={handleFile} style="display:none" />
        </label>
      </section>

      {error && <p class="proxy-tools-error">{escapeHtml(error)}</p>}

      {packets.length > 0 && (
        <section class="room-section">
          <h3>Paquets ({packets.length})</h3>
          <div class="capture-layout">
            <table class="capture-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Heure</th>
                  <th>Longueur</th>
                </tr>
              </thead>
              <tbody>
                {packets.map(p => (
                  <tr
                    key={p.index}
                    class={selected?.index === p.index ? 'selected' : ''}
                    onClick={() => setSelected(p)}
                  >
                    <td>{p.index}</td>
                    <td>{p.ts}</td>
                    <td>{p.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div class="capture-detail">
              {selected ? (
                <>
                  <h4>Paquet #{selected.index}</h4>
                  <p>Longueur: {selected.length} octets</p>
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
    </div>
  );
}
