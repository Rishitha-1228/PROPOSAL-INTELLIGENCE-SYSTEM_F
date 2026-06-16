import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mapCompetencies } from "../services/api";

export default function MappingStage() {
  const navigate = useNavigate();
  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const opportunityId = localStorage.getItem("pis_opportunity_id");

  useEffect(() => {
    if (!opportunityId) { navigate("/new"); return; }
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    setLoading(true);
    try {
      const data = await mapCompetencies(opportunityId);
      setCompetencies(data.competencies || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to map competencies");
    }
    setLoading(false);
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
          <div style={menuStyle} onClick={() => navigate("/questions")}>❓ Questions</div>
          <div style={menuActive}>🧠 Competency Mapping</div>
          <div style={menuStyle} onClick={() => navigate("/architecture")}>🏗️ Architecture</div>
          <div style={menuStyle} onClick={() => navigate("/approach")}>📝 Approach Note</div>
          <div style={menuStyle} onClick={() => navigate("/score")}>📈 Proposal Score</div>
          <div style={{ ...menuStyle, marginTop: "40px", color: "#94a3b8" }} onClick={() => navigate("/dashboard")}>← Dashboard</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px" }}>
        <div style={{ background: "white", borderRadius: "28px", padding: "40px", border: "1px solid #dbe4ff" }}>

          <h1 style={{ fontSize: "42px", color: "#0f172a", fontWeight: "800", marginBottom: "10px" }}>Competency Mapping</h1>
          <p style={{ color: "#64748b", marginBottom: "30px" }}>AI maps the brief to your competency framework</p>

          {loading && <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>🤖 Mapping competencies with Claude...</div>}
          {error && <div style={{ color: "red", padding: "20px", background: "#fef2f2", borderRadius: "12px", marginBottom: "20px" }}>⚠️ {error}</div>}

          {competencies.map((c, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", background: "#dbeafe", padding: "4px 10px", borderRadius: "20px", marginRight: "10px" }}>
                    {c.competency_id}
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{c.competency_name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: c.fit_score >= 80 ? "#16a34a" : "#d97706" }}>{c.fit_score}%</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>fit score</div>
                </div>
              </div>
              <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${c.fit_score}%`, background: c.fit_score >= 80 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: "10px" }} />
              </div>
              <p style={{ color: "#64748b", fontSize: "14px" }}>💡 {c.rationale}</p>
              {c.cluster && <span style={{ fontSize: "12px", color: "#7c3aed", background: "#ede9fe", padding: "3px 8px", borderRadius: "10px", marginTop: "8px", display: "inline-block" }}>{c.cluster}</span>}
            </div>
          ))}

          {competencies.length > 0 && (
            <button onClick={() => navigate("/architecture")} style={{ width: "100%", marginTop: "20px", padding: "16px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>
              Next → Programme Architecture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const menuStyle = { padding: "14px 16px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", fontWeight: "600", color: "#475569", fontSize: "15px" };
const menuActive = { padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "10px", fontWeight: "700", fontSize: "15px" };