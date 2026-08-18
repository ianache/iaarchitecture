export function Sidebar({
  active,
  theme,
  knowledgeRevision,
  onNavAnalyses,
  onNavKcr,
  onToggleTheme
}: {
  active: "architecture" | "knowledge";
  theme: "light" | "dark";
  knowledgeRevision: string;
  onNavAnalyses: () => void;
  onNavKcr: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-brand-name">CoWork</div>
        <div className="sidebar-brand-sub">ARCHITECTURE AI</div>
      </div>
      <div className="sidebar-nav">
        <button type="button" className="sidebar-nav-item" data-active={active === "architecture"} onClick={onNavAnalyses}>
          Analyses
        </button>
        <button type="button" className="sidebar-nav-item" data-active={active === "knowledge"} onClick={onNavKcr}>
          Knowledge Authoring
        </button>
      </div>
      <button type="button" className="theme-toggle" onClick={onToggleTheme}>
        <span>{theme === "light" ? "Light mode" : "Dark mode"}</span>
        <span className="theme-toggle-hint">Toggle</span>
      </button>
      <div className="sidebar-footer">
        Knowledge base
        <br />
        <span className="sidebar-footer-rev">{knowledgeRevision}</span>
      </div>
    </div>
  );
}
