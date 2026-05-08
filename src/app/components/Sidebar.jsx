import {
  STATUS_LABELS,
  TYPE_LABELS,
  VIEW_LABELS
} from "../labels.js";
import {
  BadgeCheck,
  CircleUserRound,
  FolderKanban,
  LayoutDashboard,
  Route,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const VIEW_ICONS = {
  overview: LayoutDashboard,
  projects: FolderKanban,
  scenes: Route,
  skills: Sparkles,
  rules: ShieldCheck,
  persona: CircleUserRound,
  checks: BadgeCheck
};

export default function Sidebar({ activeView, filters, onViewChange, onFiltersChange }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <span className="brand-mark">CS</span>
        <div>
          <h1>上下文工作台</h1>
          <p>ai-context 关系图谱</p>
        </div>
      </div>
      <nav aria-label="主导航">
        {VIEW_LABELS.map((view) => {
          const Icon = VIEW_ICONS[view.key];
          return (
          <button
            className={activeView === view.key ? "active" : ""}
            key={view.key}
            onClick={() => onViewChange(view.key)}
            type="button"
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
            {view.label}
          </button>
          );
        })}
      </nav>
      <div className="filters">
        <label>
          搜索
          <span className="search-field">
            <Search aria-hidden="true" size={15} />
            <input
              placeholder="搜索节点、文件或说明"
              value={filters.query}
              onChange={(event) => onFiltersChange({ query: event.target.value })}
            />
          </span>
        </label>
        <label>
          类型
          <select value={filters.typeFilter} onChange={(event) => onFiltersChange({ typeFilter: event.target.value })}>
            {["all", "project", "scene", "skill", "rule", "profile", "task"].map((type) => (
              <option key={type} value={type}>{TYPE_LABELS[type] || type}</option>
            ))}
          </select>
        </label>
        <label>
          状态
          <select value={filters.statusFilter} onChange={(event) => onFiltersChange({ statusFilter: event.target.value })}>
            {["all", "ok", "warning", "missing", "unknown"].map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            checked={filters.showWarningsOnly}
            type="checkbox"
            onChange={(event) => onFiltersChange({ showWarningsOnly: event.target.checked })}
          />
          只看预警
        </label>
      </div>
    </aside>
  );
}
