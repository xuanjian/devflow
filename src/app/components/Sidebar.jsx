const VIEWS = ["Overview", "Projects", "Scenes", "Skills", "Rules", "Persona", "Checks"];

export default function Sidebar({ activeView, filters, onViewChange, onFiltersChange }) {
  return (
    <aside className="sidebar">
      <h1>Context Studio</h1>
      <nav aria-label="Primary">
        {VIEWS.map((view) => (
          <button
            className={activeView === view.toLowerCase() ? "active" : ""}
            key={view}
            onClick={() => onViewChange(view.toLowerCase())}
            type="button"
          >
            {view}
          </button>
        ))}
      </nav>
      <div className="filters">
        <label>
          Search
          <input
            placeholder="Search nodes"
            value={filters.query}
            onChange={(event) => onFiltersChange({ query: event.target.value })}
          />
        </label>
        <label>
          Type
          <select value={filters.typeFilter} onChange={(event) => onFiltersChange({ typeFilter: event.target.value })}>
            {["all", "project", "scene", "skill", "rule", "profile", "task"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={filters.statusFilter} onChange={(event) => onFiltersChange({ statusFilter: event.target.value })}>
            {["all", "ok", "warning", "missing", "unknown"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            checked={filters.showWarningsOnly}
            type="checkbox"
            onChange={(event) => onFiltersChange({ showWarningsOnly: event.target.checked })}
          />
          Only warnings
        </label>
      </div>
    </aside>
  );
}
