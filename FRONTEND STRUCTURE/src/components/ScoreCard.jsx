/**
 * ScoreCard — shows a score bar for a named metric.
 * Props: label (string), val (0–1 number)
 */
export default function ScoreCard({ label, val }) {
  const color =
    val >= 0.7
      ? "var(--color-text-success)"
      : val >= 0.5
      ? "var(--color-text-warning)"
      : "var(--color-text-danger)";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{Math.round(val * 100)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 3 }}>
        <div
          style={{
            height: 6,
            width: `${val * 100}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}
