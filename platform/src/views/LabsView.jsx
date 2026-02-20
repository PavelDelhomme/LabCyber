import { useState, useEffect } from 'preact/hooks';
import { escapeHtml, getTerminalUrl, getDesktopUrl } from '../lib/store';

const DEFAULT_LAB = { id: 'default', name: 'Lab par défaut', description: 'Terminal Kali, bureau noVNC, cibles du lab (vuln-network, vuln-api, DVWA, etc.).' };

export default function LabsView({ storage, onNavigate, onLabChange }) {
  const [labs, setLabs] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVncPassword, setNewVncPassword] = useState('');
  const [newPackIds, setNewPackIds] = useState([]);
  const [toolPacks, setToolPacks] = useState(null);

  useEffect(() => {
    if (storage) {
      setLabs(storage.getLabs());
      setCurrentId(storage.getCurrentLabId());
    }
  }, [storage]);

  useEffect(() => {
    fetch('/data/toolPacks.json').then(r => r.ok ? r.json() : null).catch(() => null).then(setToolPacks);
  }, []);

  const allLabs = [DEFAULT_LAB, ...labs];
  const currentLab = currentId === 'default' ? DEFAULT_LAB : labs.find(l => l.id === currentId) || DEFAULT_LAB;

  const toggleNewPack = (packId) => {
    setNewPackIds(prev => prev.includes(packId) ? prev.filter(id => id !== packId) : [...prev, packId]);
  };

  const createLab = (e) => {
    e.preventDefault();
    const name = (newName || '').trim() || 'Nouveau lab';
    const id = 'lab-' + Date.now();
    const lab = { id, name, description: (newDesc || '').trim(), vncPassword: (newVncPassword || '').trim() || undefined, createdAt: new Date().toISOString() };
    if (newPackIds.length > 0) lab.packIds = [...newPackIds];
    const next = [...labs, lab];
    storage?.setLabs(next);
    setLabs(next);
    setNewName('');
    setNewDesc('');
    setNewVncPassword('');
    setNewPackIds([]);
    storage?.setCurrentLabId(id);
    setCurrentId(id);
    onLabChange?.(id);
  };

  const selectLab = (id) => {
    storage?.setCurrentLabId(id);
    setCurrentId(id);
    onLabChange?.(id);
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
      onLabChange?.('default');
    }
  };

  const [editingLabId, setEditingLabId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVncPassword, setEditVncPassword] = useState('');
  const [editPackIds, setEditPackIds] = useState([]);
  const startEdit = (lab, e) => {
    e.stopPropagation();
    if (lab.id === 'default') return;
    setEditingLabId(lab.id);
    setEditName(lab.name || '');
    setEditDesc(lab.description || '');
    setEditVncPassword(lab.vncPassword || '');
    setEditPackIds(Array.isArray(lab.packIds) ? [...lab.packIds] : []);
  };
  const toggleEditPack = (packId) => {
    setEditPackIds(prev => prev.includes(packId) ? prev.filter(id => id !== packId) : [...prev, packId]);
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingLabId || editingLabId === 'default') return;
    const next = labs.map(l => {
      if (l.id !== editingLabId) return l;
      const updated = { ...l, name: (editName || '').trim() || l.name, description: (editDesc || '').trim(), vncPassword: (editVncPassword || '').trim() || undefined };
      if (editPackIds.length > 0) updated.packIds = [...editPackIds]; else delete updated.packIds;
      return updated;
    });
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
                  <input type="text" value={editVncPassword} onInput={e => setEditVncPassword(e.target.value)} placeholder="Mot de passe VNC (rappel, optionnel)" style="width:100%; font-size:0.9rem; margin-bottom:0.5rem" />
                  {toolPacks?.packs?.length > 0 && (
                    <div class="lab-packs-edit" style="margin-bottom:0.5rem">
                      <span style="font-size:0.85rem; font-weight:600">Packs d'outils (optionnel)</span>
                      <div style="display:flex; flex-wrap:wrap; gap:0.25rem 0.75rem; margin-top:0.25rem">
                        {toolPacks.packs.map(p => (
                          <label key={p.id} style="display:flex; align-items:center; gap:0.35rem; font-size:0.85rem; cursor:pointer">
                            <input type="checkbox" checked={editPackIds.includes(p.id)} onChange={() => toggleEditPack(p.id)} />
                            {escapeHtml(p.name)}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style="display:flex; gap:0.35rem;">
                    <button type="submit" class="btn btn-primary">Enregistrer</button>
                    <button type="button" class="topbar-btn" onClick={() => setEditingLabId(null)}>Annuler</button>
                  </div>
                </form>
              ) : (
                <>
                  <h4 class="card-title">{escapeHtml(lab.name)}</h4>
                  <p class="card-category">{escapeHtml((lab.description || '').slice(0, 80))}{(lab.description || '').length > 80 ? '…' : ''}</p>
                  {lab.packIds?.length > 0 && toolPacks?.packs && (
                    <p class="card-category" style="font-size:0.8rem">Packs : {lab.packIds.map(pid => toolPacks.packs.find(p => p.id === pid)?.name || pid).join(', ')}</p>
                  )}
                  {lab.vncPassword && <p class="card-category" style="font-size:0.8rem">VNC : ••••••••</p>}
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
        <p class="section-desc">Optionnel : associer des packs d'outils au lab (Phase 3). Le conteneur attaquant inclut déjà tous les outils ; les packs servent à marquer les préférences du lab.</p>
        <form class="engagement-form" onSubmit={createLab} style="max-width: 520px;">
          <input type="text" value={newName} onInput={e => setNewName(e.target.value)} placeholder="Nom du lab" />
          <input type="text" value={newDesc} onInput={e => setNewDesc(e.target.value)} placeholder="Description (optionnel)" />
          <input type="text" value={newVncPassword} onInput={e => setNewVncPassword(e.target.value)} placeholder="Mot de passe VNC (rappel, optionnel)" />
          {toolPacks?.packs?.length > 0 && (
            <div class="lab-packs-create" style="margin-top:0.5rem">
              <span style="font-size:0.9rem; font-weight:600">Packs d'outils (optionnel)</span>
              <div style="display:flex; flex-wrap:wrap; gap:0.35rem 0.75rem; margin-top:0.35rem">
                {toolPacks.packs.map(p => (
                  <label key={p.id} style="display:flex; align-items:center; gap:0.35rem; font-size:0.9rem; cursor:pointer">
                    <input type="checkbox" checked={newPackIds.includes(p.id)} onChange={() => toggleNewPack(p.id)} />
                    {escapeHtml(p.name)}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="submit" class="btn btn-primary">Créer le lab</button>
        </form>
      </section>

      <section class="room-section">
        <h3>Outils du lab actif</h3>
        <p class="section-desc">Pour le lab actif (badge en haut). Terminal Kali, bureau noVNC, simulateur réseau (plusieurs cartes, config IP, type Packet Tracer), config proxy, client API type Postman, Capture pcap. Tout est enregistré par lab.</p>
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
            <h4 class="card-title">🔌 Simulateur réseau (Packet Tracer)</h4>
            <p class="card-category">Plusieurs cartes par lab, config IP (PC, routeur, switch, serveur), types de service (Web, DNS…), L2/L3. Sauvegardé par lab.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir le simulateur</span>
          </article>
          <article class="card" onClick={() => onNavigate?.('proxy-config')} style="cursor:pointer">
            <h4 class="card-title">🔧 Proxy (config)</h4>
            <p class="card-category">Configure un ou plusieurs proxies (HTTP/HTTPS/SOCKS) ou VPN pour ce lab. Export pour le terminal.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Configurer les proxies</span>
          </article>
          <article class="card" onClick={() => onNavigate?.('api-client')} style="cursor:pointer">
            <h4 class="card-title">📤 Requêtes API (Postman)</h4>
            <p class="card-category">Envoi de requêtes HTTP, collections, historique. Lié au lab actif.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir le client API</span>
          </article>
          <article class="card" onClick={() => onNavigate?.('capture')} style="cursor:pointer">
            <h4 class="card-title">📡 Capture pcap (Wireshark)</h4>
            <p class="card-category">Visualiseur .pcap : paquets, détail hex, filtres. Session enregistrée par lab.</p>
            <span class="btn btn-primary" style="margin-top:0.5rem; display:inline-block">Ouvrir le visualiseur</span>
          </article>
        </div>
      </section>
    </div>
  );
}
