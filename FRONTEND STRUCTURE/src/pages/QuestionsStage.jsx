import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestions } from "../services/api";

export default function QuestionsStage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false);
  const opportunityId = localStorage.getItem("pis_opportunity_id");

  useEffect(() => {
    if (!opportunityId) { navigate("/new"); return; }
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await generateQuestions(opportunityId);
      setQuestions(data.questions_by_theme
        ? Object.values(data.questions_by_theme).flat()
        : data.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load questions");
    }
    setLoading(false);
  };

  // Group by theme
  const grouped = questions.reduce((acc, q) => {
    const theme = q.theme_code || "OTHER";
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(q);
    return acc;
  }, {});

  const THEME_NAMES = {
    BCS: "Business Context & Strategy",
    AUD: "Audience & Cohort Design",
    BAS: "Capability Baseline",
    BEH: "Target Behaviours",
    PED: "Pedagogical Preferences",
    CON: "Constraints",
    DEC: "Decision Dynamics",
    FOL: "Post-programme Follow-up"
  };

  const THEME_COLORS = {
    BCS: "#dbeafe", AUD: "#ede9fe", BAS: "#dcfce7",
    BEH: "#fef3c7", PED: "#fce7f3", CON: "#fee2e2",
    DEC: "#e0f2fe", FOL: "#f0fdf4"
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2ff", fontFamily: "Inter, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "white", borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "35px 25px" }}>
          <h1 style={{ color: "#2563eb", fontSize: "28px", fontWeight: "800" }}>🚀 Proposal<br />Intelligence</h1>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={menuStyle} onClick={() => navigate("/new")}>📄 New Opportunity</div>
          <div style={menuActive}>❓ Questions</div>
          <div style={menuStyle} onClick={() => navigate("/mapping")}>🧠 Competency Mapping</div>
          <div style={menuStyle} onClick={() => navigate("/architecture")}>🏗️ Architecture</div>
          <div style={menuStyle} onClick={() => navigate("/approach")}>📝 Approach Note</div>
          <div style={menuStyle} onClick={() => navigate("/score")}>📈 Proposal Score</div>
          <div style={{ ...menuStyle, marginTop: "40px", color: "#94a3b8" }} onClick={() => navigate("/dashboard")}>← Dashboard</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px" }}>
        <div style={{ background: "white", borderRadius: "28px", padding: "40px", border: "1px solid #dbe4ff" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1 style={{ fontSize: "42px", color: "#0f172a", fontWeight: "800" }}>Discovery Questions</h1>
            <button
              onClick={() => setLiveMode(!liveMode)}
              style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid #dbe4ff", background: liveMode ? "#2563eb" : "white", color: liveMode ? "white" : "#2563eb", fontWeight: "700", cursor: "pointer" }}
            >
              {liveMode ? "📞 Live Mode ON" : "📞 Live Mode OFF"}
            </button>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontSize: "18px" }}>🤖 Generating questions with Claude...</div>}
          {error && <div style={{ color: "red", padding: "20px", background: "#fef2f2", borderRadius: "12px", marginBottom: "20px" }}>⚠️ {error}</div>}

          {!loading && questions.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>No questions yet</p>
              <button onClick={loadQuestions} style={{ padding: "14px 28px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
                Generate Questions ✨
              </button>
            </div>
          )}

          {Object.entries(grouped).map(([theme, qs]) => (
            <div key={theme} style={{ marginBottom: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ padding: "6px 14px", background: THEME_COLORS[theme] || "#f1f5f9", borderRadius: "20px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>{theme}</span>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{THEME_NAMES[theme] || theme}</span>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{qs.length} questions</span>
              </div>

              {qs.map((q, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: "16px", padding: "20px", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontWeight: "600", color: "#0f172a", marginBottom: "8px", fontSize: "15px" }}>{q.question_text}</p>
                  <p style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic", marginBottom: liveMode ? "12px" : "0" }}>💡 {q.rationale}</p>
                  {liveMode && (
                    <textarea
                      placeholder="Type client answer here..."
                      rows={2}
                      style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", marginTop: "8px", resize: "vertical" }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          {questions.length > 0 && (
            <div style={{ display: "flex", gap: "16px", marginTop: "30px" }}>
              <button onClick={() => navigate("/mapping")} style={{ flex: 1, padding: "16px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
                Next → Competency Mapping
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const menuStyle = { padding: "14px 16px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", fontWeight: "600", color: "#475569", fontSize: "15px" };
const menuActive = { padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "10px", fontWeight: "700", fontSize: "15px" };