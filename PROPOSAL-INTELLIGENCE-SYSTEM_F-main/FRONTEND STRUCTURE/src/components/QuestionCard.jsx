import Badge from "./Badge";

const CATEGORY_BG = {
  Budget:             "var(--color-background-warning)",
  Stakeholders:       "var(--color-background-info)",
  "Programme design": "var(--color-background-success)",
  Outcomes:           "var(--color-background-secondary)",
  Logistics:          "var(--color-background-secondary)",
};

const CATEGORY_TEXT = {
  Budget:             "var(--color-text-warning)",
  Stakeholders:       "var(--color-text-info)",
  "Programme design": "var(--color-text-success)",
  Outcomes:           "var(--color-text-secondary)",
  Logistics:          "var(--color-text-secondary)",
};

/**
 * QuestionCard — renders a single discovery question with an editable answer.
 * Props: question (object), answer (string), onChange (fn)
 */
export default function QuestionCard({ question: q, answer, onChange }) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{q.question}</div>
        <Badge
          label={q.category}
          bg={CATEGORY_BG[q.category] || "var(--color-background-secondary)"}
          color={CATEGORY_TEXT[q.category] || "var(--color-text-secondary)"}
        />
      </div>

      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 10 }}>
        <i className="ti ti-info-circle" style={{ marginRight: 4 }} />
        {q.why}
      </div>

      <label
        style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}
      >
        Learning Architect answer
      </label>
      <textarea
        value={answer || ""}
        onChange={(e) => onChange(q.id, e.target.value)}
        rows={2}
        style={{
          width: "100%",
          resize: "vertical",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          padding: "8px 10px",
          borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)",
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
