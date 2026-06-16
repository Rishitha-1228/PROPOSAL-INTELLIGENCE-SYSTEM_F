/**
 * Badge — small coloured pill label.
 * Props: label (string), bg (CSS color), color (CSS color)
 */
export default function Badge({ label, bg, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 20,
        background: bg || "var(--color-background-secondary)",
        color: color || "var(--color-text-secondary)",
      }}
    >
      {label}
    </span>
  );
}
