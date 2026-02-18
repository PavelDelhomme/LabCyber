import { useState, useEffect } from 'preact/hooks';
import { escapeHtml, getTerminalUrl, getDesktopUrl } from '../lib/store';

const DEFAULT_LAB = { id: 'default', name: 'Lab par défaut', description: 'Terminal Kali, bureau noVNC, cibles du lab (vuln-network, vuln-api, DVWA, etc.).' };

export default function LabsView({ storage, onNavigate }) {
  const [labs, setLabs] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (storage) {
      setLabs(storage.getLabs());
      setCurrentId(storage.getCurrentLabId());
    }
  }, [storage]);

  const allLabs = [DEFAULT_LAB, ...labs];
  const currentLab = currentId === 'default' ? DEFAULT_LAB : labs.find(l => l.id === currentId) || DEFAULT_LAB;

  const createLab = (e) => {
    e.preventDefault();
    const name = (newName || '').trim() || 'Nouveau lab';
    const id = 'lab-' + Date.now();
    const next = [...labs, { id, name, description: (newDesc || '').trim(), createdAt: new Date().toISOString() }];
    storage?.setLabs(next);
    setLabs(next);
    setNewName('');
    setNewDesc('');
    storage?.setCurrentLabId(id);
    setCurrentId(id);
  };

  const selectLab = (id) => {
    storage?.setCurrentLabId(id);
    setCurrentId(id);
  };

  const deleteLab = (id, e) => {
    e.stopPropagation();
    if (id === 'default') return;
    const next = labs.filter(l => l.id !== id);
    storage?.setLabs(next);
    setLabs(next);
    if (currentId === id) {
      storage?.setCurrentLabId('default');
      setCurrentId('default');
    }
  };

  const [editingLabId, setEditingLabId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const startEdit = (lab, e) => {
    e.stopPropagation();
    if (lab.id === 'default') return;
    setEditingLabId(lab.id);
    setEditName(lab.name || '');
    setEditDesc(lab.description || '');
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingLabId || editingLabId === 'default') return;
    const next = labs.map(l => l.id === editingLabId ? { ...l, name: (editName || '').trim() || l.name, description: (editDesc || '').trim() } : l);
    storage?.setLabs(next);
    setLabs(next);
    setEditingLabId(null);
  };

  return (
    <div id="view-labs" class="view">
      <header class="page-header">
        <h2>Labs</h2>
        <p class="room-description">Gère plusieurs labs (un par projet ou type d'attaque). Choisis le lab actif, crée-en de nouveaux, configure nom et description. Terminal, bureau, simulateur réseau, Proxy/Requêtes et Capture pcap (type Wireshark) sont disponibles ci-dessous.</p>
      </header>

      <section class="room-section">
        <h3>Lab actif</h3>
        <p class="section-desc">Choisis le lab avec lequel tu travailles. Les topologies du simulateur réseau sont enregistrées par lab. Tu peux éditer le nom et la description des labs personnalisés.</p>
        <div class="labs-grid">
          {allLabs.map(lab => (
            <article
              key={lab.id}
              class={`card lab-card ${currentId === lab.id ? 'active' : ''}`}
              onClick={() => editingLabId !== lab.id && selectLab(lab.id)}
              style="cursor:pointer"
            >
              {editingLabId === lab.id ? (
                <form onSubmit={saveEdit} onClick={e => e.stopPropagation()}>
                  <input type="text" value={editName} onInput={e => setEditName(e.target.value)} placeholder="Nom du lab" class="card-title" style="margin-bottom:0.5rem" />
                  <textarea value={editDesc} onInput={e => setEditDesc(e.target.value)} placeholder="Description (optionnel)" rows={2} style="width:100%; font-size:0.9rem; margin-bottom:0.5rem" />
                  <div style="display:flex; gap:0.35rem;">
                    <button type="submit" class="btn btn-primary">Enregistrer</button>
                    <button type="button" class="topbar-btn" onClick={() => setEditingLabId(null)}>Annuler</button>
                  </div>
                </form>
              ) : (
                <>
                  <h4 class="card-title">{escapeHtml(lab.name)}</h4>
                  <p class="card-category">{escapeHtml((lab.description || '').slice(0, 80))}{(lab.description || '').length > 80 ? '…' : ''}</p>
                  {lab.id !== 'default' && (
                    <div style="margin-top:0.5rem; display:flex; gap:0.35rem;">
                      <button type="button" class="topbar-btn" onClick={e => startEdit(lab, e)}>Éditer</button>
                      <button type="button" class="topbar-btn danger" onClick={e => deleteLab(lab.id, e)}>Supprimer</button>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section class="room-section">
        <h3>Créer un lab</h3>
        <form class="engagement-form" onSubmit={createLab} style="max-width: 480px;">
          <input type="text" value={newName} onInput={e => setNewName(e.target.value)} placeholder="Nom du lab" />
          <input type="text" value={newDesc} onInput={e => setNewDesc(e.target.value)} placeholder="Description (optionnel)" />
          <button type="submit" class="btn btn-primary">Créer le lab</button>
        </form>
      </section>

      <section class="room-section">
        <h3>Outils du lab (réseau, web, analyse)</h3>
        <p class="section-desc">Tous les outils pour tes tests : terminal Kali, bureau noVNC, simulateur réseau (Packet Tracer), Proxy/Requêtes (Burp/Postman), Capture pcap (Wireshark).</p>
        <div class="dashboard-grid" style="margin-top:1rem">
          <article class="card">
            <h4 class="card-title">⌨ Terminal web (Kali)</h4>
            <p class="card-category">Machine attaquant : nmap, hydra, tcpdump, scapy, sqlmap, etc.</p>
            <a href={getTerminalUrl()} target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:0.5rem">Ouvrir le terminal</a>
          </article>
          <article class="card">
            <h4 class="card-title">🖥 Bureau noVNC (XFCE)</h4>
            <p class="card-category">Bureau graphique dans le navigateur (outils GUI).</p>
            <a href={getDesktopUrl()} target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:0.5rem">Ouvrir le bureau</a>
          </article>
          <article class="card" onClick={() => onNavigate?.('network-sim')} style="cursor:pointer">
            <h4 class="card-title">🔌 Simulateur réseau</h4>
            <p class="card-category">Topologie type Packet Tracer : PC, routeurs, switches, câblage. Sauvegardé par lab.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir le simulateur</span>
          </article>
          <article class="card" onClick={() => onNavigate?.('proxy-tools')} style="cursor:pointer">
            <h4 class="card-title">📤 Proxy / Requêtes HTTP</h4>
            <p class="card-category">Envoi de requêtes (méthode, URL, en-têtes, corps), type Burp Repeater / Postman.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir l'outil</span>
          </article>
          <article class="card" onClick={() => onNavigate?.('capture')} style="cursor:pointer">
            <h4 class="card-title">📡 Capture pcap (Wireshark)</h4>
            <p class="card-category">Visualiseur de fichiers .pcap : liste de paquets, détail hex, filtres. Type Wireshark.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir le visualiseur</span>
          </article>
        </div>
      </section>
    </div>
  );
}
