/**
 * CompetencyCard — displays a single competency with its relevance score.
 * Props: competency (object: { name, description, relevanceScore })
 */
export default function CompetencyCard({ competency: c }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.description}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>relevance</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{Math.round(c.relevanceScore * 100)}%</div>
      </div>
    </div>
  );
}
