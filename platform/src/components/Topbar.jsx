export default function Topbar({
  view,
  categories = [],
  searchQuery,
  filterCategory,
  showPipButton,
  onSearchChange,
  onFilterChange,
  onSidebarToggle,
  onLogToggle,
  onPipToggle,
  onStats,
  onOptions,
  onTerminal,
}) {
  return (
    <header class="topbar">
      <div class="topbar-head">
        <button type="button" class="topbar-btn sidebar-toggle" onClick={onSidebarToggle} aria-label="Menu" title="Menu">☰</button>
        <h1 class="topbar-title">Lab Cyber</h1>
      </div>
      <div class="topbar-toolbar">
        <input
          type="search"
          class="search-input"
          placeholder="Rechercher scénarios, rooms, docs…"
          aria-label="Recherche"
          value={searchQuery}
          onInput={e => onSearchChange(e.target.value)}
        />
        <select
          class="filter-category"
          aria-label="Catégorie"
          value={filterCategory}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name || c.id}</option>
          ))}
        </select>
        <div class="topbar-actions">
          <button type="button" class="topbar-btn" onClick={onTerminal} title="Terminal">⌨</button>
          <button type="button" class="topbar-btn" onClick={onStats} title="Statistiques">📊</button>
          <button type="button" class="topbar-btn" onClick={onOptions} title="Options">⚙️</button>
          {showPipButton && (
            <button type="button" class="topbar-btn" onClick={onPipToggle} title="PiP scénario">📌</button>
          )}
          <button type="button" class="topbar-btn topbar-btn-log" onClick={onLogToggle} title="Journal d'activité">📋</button>
        </div>
      </div>
    </header>
  );
}
