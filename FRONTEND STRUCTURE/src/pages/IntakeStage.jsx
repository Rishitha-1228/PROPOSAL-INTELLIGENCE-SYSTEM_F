import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyseBrief } from "../services/api";

// Everything the user has typed/seen on this page is saved under this key,
// so navigating away (e.g. to Questions) and coming back restores it exactly.
const INTAKE_STORAGE_KEY = "pis_intake_state";

const DEFAULT_FORM = {
  title: "",
  client: "",
  organisation: "",
  industry: "",
  geography: "",
  owner: "",
  source: "",
  email: "",
  brief: "",
  meetingNotes: "",
  seniority: "",
  capability: "",
  duration: "",
  delivery: "",
  faculty: "",
  budget: "",
  urgency: "",
};

export default function IntakeStage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Restore everything from localStorage on mount ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INTAKE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData({ ...DEFAULT_FORM, ...parsed.formData });
        if (parsed.analysis) setAnalysis(parsed.analysis);
      }
    } catch {
      // ignore malformed storage, just start fresh
    }
  }, []);

  // ── Persist form data on every change, so it survives navigation ──
  const persist = (nextFormData, nextAnalysis) => {
    try {
      localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify({
        formData: nextFormData,
        analysis: nextAnalysis,
      }));
    } catch {
      // storage full or unavailable — form still works for this session
    }
  };

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    persist(updated, analysis);
  };

  const handleAnalyse = async () => {
    if (!formData.client) {
      setError("Please enter Client Name");
      return;
    }
    if (!formData.brief && !formData.meetingNotes) {
      setError("Please paste client email or meeting notes.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await analyseBrief({
        client_name: formData.client,
        brief_text: formData.brief || formData.meetingNotes,
        due_date: null,
      });

      console.log("Analysis Result:", result);

      // ── Save opportunity_id for all next pages ──
      localStorage.setItem("pis_opportunity_id", result.opportunity_id);

      setAnalysis(result);
      persist(formData, result);

    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error || "Could not analyse opportunity."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Navigate to next stage ──────────────────────
  const handleNext = () => {
    if (!analysis) {
      setError("Please analyse the brief first before continuing.");
      return;
    }
    navigate("/questions");
  };

  // ── Start a genuinely new opportunity (explicit user action only) ──
  const handleStartNew = () => {
    setFormData(DEFAULT_FORM);
    setAnalysis(null);
    setError("");
    localStorage.removeItem(INTAKE_STORAGE_KEY);
    localStorage.removeItem("pis_opportunity_id");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2ff", fontFamily: "Inter, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "white", borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "35px 25px" }}>
          <h1 style={{ color: "#2563eb", fontSize: "32px", lineHeight: "44px", fontWeight: "800" }}>
             Proposal<br />Intelligence
          </h1>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={menuActive}> New Opportunity</div>
          <div style={menuStyle} onClick={() => navigate("/questions")}> Questions</div>
          <div style={menuStyle} onClick={() => navigate("/mapping")}> Competency Mapping</div>
          <div style={menuStyle} onClick={() => navigate("/architecture")}> Architecture</div>
          <div style={menuStyle} onClick={() => navigate("/approach")}> Approach Note</div>
          <div style={menuStyle} onClick={() => navigate("/score")}> Proposal Score</div>
          <div style={{ ...menuStyle, marginTop: "40px", color: "#94a3b8" }} onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px" }}>
        <div style={{ background: "white", borderRadius: "28px", padding: "40px", border: "1px solid #dbe4ff" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "48px", marginBottom: "10px", color: "#0f172a" }}>
                New Opportunity
              </h1>
              <p style={{ color: "#64748b", marginBottom: "40px", fontSize: "16px" }}>
                Fill in the details and paste the client brief.
              </p>
            </div>

            {/* Only shown once something has actually been analysed, so the
                user can deliberately start a different opportunity without
                losing the current one by accident. */}
            {analysis && (
              <button
                onClick={handleStartNew}
                style={{ padding: "10px 18px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", fontSize: "13.5px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Start a different opportunity
              </button>
            )}
          </div>

          {/* BASICS */}
          <h2 style={sectionTitle}>Opportunity Basics</h2>
          <div style={gridStyle}>
            <input name="title" value={formData.title} placeholder="Opportunity title" style={inputStyle} onChange={handleChange} />
            <input name="client" value={formData.client} placeholder="Client name *" style={inputStyle} onChange={handleChange} />
            <input name="organisation" value={formData.organisation} placeholder="Organisation" style={inputStyle} onChange={handleChange} />
            <input name="industry" value={formData.industry} placeholder="Industry" style={inputStyle} onChange={handleChange} />
          </div>

          {/* CLIENT EMAIL */}
          <div style={cardStyle}>
            <h3 style={cardTitle}> Client Email / RFP</h3>
            <textarea
              name="brief"
              value={formData.brief}
              onChange={handleChange}
              placeholder="Paste client email or RFP here..."
              rows={8}
              style={textareaStyle}
            />
          </div>

          {/* NOTES */}
          <div style={cardStyle}>
            <h3 style={cardTitle}> Meeting Notes</h3>
            <textarea
              name="meetingNotes"
              value={formData.meetingNotes}
              onChange={handleChange}
              placeholder="Paste meeting notes here..."
              rows={8}
              style={textareaStyle}
            />
          </div>

          {/* TAGS */}
          <h2 style={sectionTitle}>Tags</h2>
          <div style={gridStyle}>
            <input name="seniority" value={formData.seniority} placeholder="Seniority (e.g. Senior Manager)" style={inputStyle} onChange={handleChange} />
            <input name="capability" value={formData.capability} placeholder="Capability focus" style={inputStyle} onChange={handleChange} />
            <input name="duration" value={formData.duration} placeholder="Duration (e.g. 3 days)" style={inputStyle} onChange={handleChange} />
            <input name="delivery" value={formData.delivery} placeholder="Delivery (e.g. Residential)" style={inputStyle} onChange={handleChange} />
          </div>

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
            <button onClick={handleAnalyse} style={analyseButton} disabled={loading}>
              {loading ? "⏳ Analysing brief..." : "✨ Analyse Brief"}
            </button>
            <button onClick={handleNext} style={nextButton}>
              Next → Questions
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p style={{ color: "red", marginTop: "20px", padding: "12px", background: "#fef2f2", borderRadius: "10px" }}>
              ⚠️ {error}
            </p>
          )}

          {/* AI RESULT */}
          {analysis && (
            <div style={{ marginTop: "40px", padding: "30px", background: "#f8fbff", borderRadius: "24px", border: "2px solid #dbe4ff" }}>

              <h2 style={{ marginBottom: "10px", color: "#0f172a" }}>
                 Brief Interpreted Successfully
              </h2>
              <p style={{ color: "#64748b", marginBottom: "30px" }}>
                Opportunity ID: <strong>{analysis.opportunity_id}</strong> · Saved to database ✅
                {analysis.reused && (
                  <span style={{ marginLeft: "10px", color: "#7c3aed", fontWeight: "600" }}>
                    (same brief as before — reused existing opportunity, no new AI cost)
                  </span>
                )}
              </p>

              {/* GOALS */}
              <div style={aiCard}>
                <h3 style={{ marginBottom: "16px", color: "#2563eb" }}>🎯 Goals Detected</h3>
                <ul style={{ paddingLeft: "20px" }}>
                  {analysis.interpreted?.goals?.map((goal, i) => (
                    <li key={i} style={{ marginBottom: "8px", color: "#334155" }}>{goal}</li>
                  ))}
                </ul>
              </div>

              {/* AUDIENCE */}
              <div style={{ ...aiCard, marginTop: "20px" }}>
                <h3 style={{ marginBottom: "16px", color: "#7c3aed" }}>👥 Audience</h3>
                <p style={{ color: "#334155" }}>{analysis.interpreted?.audience}</p>
              </div>

              {/* THEMES */}
              <div style={{ ...aiCard, marginTop: "20px" }}>
                <h3 style={{ marginBottom: "16px", color: "#059669" }}>🏷️ Themes</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {analysis.interpreted?.themes?.map((theme, i) => (
                    <span key={i} style={{ padding: "6px 14px", background: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "14px", fontWeight: "600" }}>
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* CONSTRAINTS */}
              <div style={{ ...aiCard, marginTop: "20px" }}>
                <h3 style={{ marginBottom: "16px", color: "#dc2626" }}>⚠️ Constraints</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {analysis.interpreted?.constraints?.map((c, i) => (
                    <span key={i} style={{ padding: "6px 14px", background: "#fef2f2", color: "#dc2626", borderRadius: "20px", fontSize: "14px", fontWeight: "600" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* PEDAGOGICAL POSTURE */}
              <div style={{ ...aiCard, marginTop: "20px" }}>
                <h3 style={{ marginBottom: "16px", color: "#d97706" }}>📚 Suggested Approach</h3>
                <p style={{ color: "#334155" }}>{analysis.interpreted?.pedagogical_posture}</p>
              </div>

              {/* CONFIDENCE SCORE */}
              <div style={{ ...aiCard, marginTop: "20px", background: analysis.interpreted?.confidence_score >= 70 ? "#f0fdf4" : "#fef3c7" }}>
                <h3 style={{ marginBottom: "10px", color: "#0f172a" }}>
                  📊 Brief Confidence Score: {analysis.interpreted?.confidence_score}/100
                </h3>
                <div style={{ background: "#e2e8f0", borderRadius: "10px", height: "12px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${analysis.interpreted?.confidence_score}%`,
                    background: analysis.interpreted?.confidence_score >= 70 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f59e0b,#d97706)",
                    borderRadius: "10px",
                    transition: "width 1s ease"
                  }} />
                </div>
                {analysis.interpreted?.ambiguities?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "6px" }}>
                      Ambiguities to resolve in discovery call:
                    </p>
                    <ul style={{ paddingLeft: "20px" }}>
                      {analysis.interpreted.ambiguities.map((a, i) => (
                        <li key={i} style={{ color: "#64748b", fontSize: "14px", marginBottom: "4px" }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* NEXT STEP */}
              <div style={{ marginTop: "30px", padding: "20px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>Brief interpreted! Ready for next step.</p>
                </div>
                <button onClick={handleNext} style={{ background: "white", color: "#2563eb", border: "none", padding: "14px 28px", borderRadius: "12px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
                  Generate Questions →
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* STYLES */
const sectionTitle = { fontSize: "24px", marginBottom: "20px", marginTop: "30px", color: "#0f172a", fontWeight: "700" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" };
const cardStyle = { background: "#f8fafc", borderRadius: "24px", padding: "28px", border: "1px solid #dbe4ff", marginTop: "25px" };
const cardTitle = { fontSize: "20px", marginBottom: "18px", fontWeight: "700" };
const menuStyle = { padding: "14px 16px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", fontWeight: "600", color: "#475569", fontSize: "15px" };
const menuActive = { padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "10px", fontWeight: "700", fontSize: "15px" };
const inputStyle = { padding: "16px 18px", borderRadius: "14px", border: "1px solid #cbd5e1", fontSize: "15px", width: "100%", outline: "none" };
const textareaStyle = { width: "100%", padding: "20px", borderRadius: "18px", border: "1px solid #cbd5e1", fontSize: "15px", resize: "vertical", boxSizing: "border-box", outline: "none" };
const analyseButton = { background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", padding: "16px 28px", borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer" };
const nextButton = { background: "#0f172a", color: "white", border: "none", padding: "16px 28px", borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer" };
const aiCard = { background: "white", padding: "22px", borderRadius: "18px", border: "1px solid #dbe4ff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };