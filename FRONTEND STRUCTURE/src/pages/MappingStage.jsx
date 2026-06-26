import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mapCompetencies } from "../services/api";


export default function MappingStage() {
  const navigate = useNavigate();
  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const opportunityId = localStorage.getItem("pis_opportunity_id");
  const [decision, setDecision] = useState(null);
  const [competencyDecisions, setCompetencyDecisions] = useState({});

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
  const handleFileUpload = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setSelectedFile(file);

  console.log("Uploaded file:", file);
};
const handleAccept = () => {
  setDecision("Accepted");
};

const handleReject = () => {
  setDecision("Rejected");
};
const handleDecision = (competencyId, decision) => {
  setCompetencyDecisions((prev) => ({
    ...prev,
    [competencyId]: decision,
  }));
};

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2ff", fontFamily: "Inter, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "white", borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "35px 25px" }}>
          <h1 style={{ color: "#2563eb", fontSize: "28px", fontWeight: "800" }}> Proposal<br />Intelligence</h1>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={menuStyle} onClick={() => navigate("/new")}>New Opportunity</div>
          <div style={menuStyle} onClick={() => navigate("/questions")}>Questions</div>
          <div style={menuActive}>Competency Mapping</div>
          <div style={menuStyle} onClick={() => navigate("/architecture")}>Architecture</div>
          <div style={menuStyle} onClick={() => navigate("/approach")}> Approach Note</div>
          <div style={menuStyle} onClick={() => navigate("/score")}> Proposal Score</div>
          <div style={{ ...menuStyle, marginTop: "40px", color: "#94a3b8" }} onClick={() => navigate("/dashboard")}>← Dashboard</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px" }}>
        <div style={{ background: "white", borderRadius: "28px", padding: "40px", border: "1px solid #dbe4ff" }}>

         <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  }}
>
  <h1
    style={{
      fontSize: "42px",
      color: "#0f172a",
      fontWeight: "800",
      margin: 0
    }}
  >
    Competency Mapping
  </h1>

  <label
    style={{
      background: "linear-gradient(135deg,#2563eb,#7c3aed)",
      color: "white",
      padding: "12px 18px",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "600"
    }}
  >
     Upload File
     {selectedFile && (
  <div
    style={{
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "12px",
      padding: "12px 16px",
      marginBottom: "20px",
      color: "#1e40af"
    }}
  >
     {selectedFile.name}
  </div>
)}

    <input
      type="file"
      accept=".pdf,.doc,.docx,.txt"
      hidden
      onChange={handleFileUpload}
    />
  </label>
</div>
        

          {loading && <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}> Mapping competencies </div>}
          {error && <div style={{ color: "red", padding: "20px", background: "#fef2f2", borderRadius: "12px", marginBottom: "20px" }}> {error}</div>}

          {competencies.map((c, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", background: "#dbeafe", padding: "4px 10px", borderRadius: "20px", marginRight: "10px" }}>
                    {c.competency_id}
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{c.competency_name}</span>
                </div>
                <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
  }}
>
  <div
    style={{
      fontSize: "24px",
      fontWeight: "800",
      color: c.fit_score >= 80 ? "#16a34a" : "#d97706",
    }}
  >
    {c.fit_score}%
  </div>

  <div
    style={{
      fontSize: "12px",
      color: "#94a3b8",
    }}
  >
    fit score
  </div>

  <div
    style={{
      display: "flex",
      gap: "6px",
      marginTop: "4px",
    }}
  >
    <button
      disabled={!!competencyDecisions[c.competency_id]}
      onClick={() =>
        handleDecision(c.competency_id, "accepted")
      }
      style={{
        padding: "6px 12px",
        border: "none",
        borderRadius: "8px",
        cursor: competencyDecisions[c.competency_id]
          ? "not-allowed"
          : "pointer",
        background:
          competencyDecisions[c.competency_id] === "accepted"
            ? "#15803d"
            : "#22c55e",
        color: "white",
        fontWeight: "600",
        fontSize: "12px",
      }}
    >
      {competencyDecisions[c.competency_id] === "accepted"
        ? "Accepted"
        : "Accept"}
    </button>

    <button
      disabled={!!competencyDecisions[c.competency_id]}
      onClick={() =>
        handleDecision(c.competency_id, "rejected")
      }
      style={{
        padding: "6px 12px",
        border: "none",
        borderRadius: "8px",
        cursor: competencyDecisions[c.competency_id]
          ? "not-allowed"
          : "pointer",
        background:
          competencyDecisions[c.competency_id] === "rejected"
            ? "#991b1b"
            : "#ef4444",
        color: "white",
        fontWeight: "600",
        fontSize: "12px",
      }}
    >
      {competencyDecisions[c.competency_id] === "rejected"
        ? " Rejected"
        : "Reject"}
    </button>
  </div>
</div>

              </div>
              <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${c.fit_score}%`, background: c.fit_score >= 80 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: "10px" }} />
              </div>
              <p style={{ color: "#64748b", fontSize: "14px" }}> {c.rationale}</p>
              {c.cluster && <span style={{ fontSize: "12px", color: "#7c3aed", background: "#ede9fe", padding: "3px 8px", borderRadius: "10px", marginTop: "8px", display: "inline-block" }}>{c.cluster}</span>}
            </div>
          ))}
          <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "30px",
  }}
>
  <button
    onClick={() => navigate("/architecture")}
    style={{
      padding: "12px 24px",
      background: "linear-gradient(135deg,#2563eb,#7c3aed)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    Next →
  </button>
</div>
  
          
        </div>
      </div>
    </div>
  );
}

const menuStyle = { padding: "14px 16px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", fontWeight: "600", color: "#475569", fontSize: "15px" };
const menuActive = { padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "10px", fontWeight: "700", fontSize: "15px" };
