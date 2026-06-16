export default function Loading() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--color-text-tertiary)",
            animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}
