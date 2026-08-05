import Badge from "./Badge";

const THEME_COLORS = {
  "Enterprise & Strategy": { bg: "var(--color-background-info)",    text: "var(--color-text-info)" },
  "Future readiness":      { bg: "var(--color-background-success)", text: "var(--color-text-success)" },
  "Functional":            { bg: "var(--color-background-secondary)", text: "var(--color-text-secondary)" },
  "Executive presence":    { bg: "var(--color-background-warning)", text: "var(--color-text-warning)" },
  "Action learning":       { bg: "var(--color-background-danger)",  text: "var(--color-text-danger)" },
};

/**
 * ModuleCard — displays a single curriculum module.
 * Props: module (object)
 */
export default function ModuleCard({ module: m }) {
  const tc = THEME_COLORS[m.theme] || THEME_COLORS["Functional"];

  return (
    <div
      style={{
        padding: "10px 12px",
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
        <Badge label={m.theme} bg={tc.bg} color={tc.text} />
      </div>

      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
        {m.duration} · {m.pedagogicalRole}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{m.rationale}</div>

      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {m.competencies.map((c, j) => (
          <span
            key={j}
            style={{
              fontSize: 11,
              padding: "1px 6px",
              borderRadius: 20,
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              color: "var(--color-text-secondary)",
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
