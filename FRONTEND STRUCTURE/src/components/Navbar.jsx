/**
 * Navbar — top navigation bar.
 * Props: view ("dashboard"|"proposal"), onDashboard (fn), onNew (fn)
 */
export default function Navbar({ view, onDashboard, onNew }) {
  return (
    <div
      style={{
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
        padding: "0 1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1100,
          margin: "0 auto",
          height: 52,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-brain" style={{ fontSize: 20, color: "var(--color-text-info)" }} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>Proposal Intelligence</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onDashboard}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--border-radius-md)",
              border: "none",
              background: view === "dashboard" ? "var(--color-background-secondary)" : "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            <i className="ti ti-layout-dashboard" style={{ marginRight: 4 }} />
            Dashboard
          </button>

          {view === "proposal" && (
            <button
              onClick={onNew}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-secondary)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "var(--color-text-secondary)",
              }}
            >
              <i className="ti ti-plus" style={{ marginRight: 4 }} />
              New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
