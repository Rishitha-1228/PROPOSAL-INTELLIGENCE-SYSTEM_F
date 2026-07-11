import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProcessingState from "../components/ProcessingState";
import { getOpportunity, buildArchitecture } from "../services/api";

export default function ArchitectureStage() {
  const navigate = useNavigate();
   // ── Template presets — each one is just a shortcut that sets several
  // design parameters together and regenerates, same path as changing
  // one field manually (Step 4's buildArchitecture merge logic handles it).
  const TEMPLATES = [
    { label: "1-Day Briefing",    params: { total_duration_days: 1, format: "residential", reinforcement: "light" } },
    { label: "3-Day Intensive",   params: { total_duration_days: 3, format: "residential", reinforcement: "medium" } },
    { label: "5-Day Residential", params: { total_duration_days: 5, format: "residential", reinforcement: "heavy" } },
    { label: "Hybrid Sprint",     params: { total_duration_days: 3, format: "hybrid", reinforcement: "medium" } },
    { label: "Virtual Series",    params: { total_duration_days: 4, format: "virtual", reinforcement: "medium" } },
  ];

  const [opportunityId, setOpportunityId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [architecture, setArchitecture] = useState(null);
  const [designParameters, setDesignParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorRedirect, setErrorRedirect] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("pis_opportunity_id");
    if (!id) {
      navigate("/new");
      return;
    }
    setOpportunityId(id);
    loadArchitecture(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadArchitecture = async (id, force = false, overrideParams = null) => {
    setLoading(true);
    setError(null);
    setErrorRedirect(null);
    try {
      const oppRes = await getOpportunity(id);
      const opp = oppRes.data || oppRes; // backend wraps this route as { success, data }
      setClientName(opp.client_name);

      // If we already have a saved architecture and this isn't a forced
      // regenerate/parameter change, just show what's stored.
      if (opp.architecture?.phases?.length > 0 && !force && !overrideParams) {
        setArchitecture(opp.architecture);
        setDesignParameters(opp.architecture.design_parameters || null);
        setLoading(false);
        return;
      }

      // Otherwise (first visit, explicit regenerate, or a parameter change)
      // call the backend to build/rebuild it.
      const result = await buildArchitecture(id, force || !!overrideParams, overrideParams);
      setArchitecture(result.architecture);
      setDesignParameters(result.architecture.design_parameters || null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load architecture");
      setErrorRedirect(err.response?.data?.redirect_to || null);
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (key, value) => {
    const updated = { ...designParameters, [key]: value };
    setDesignParameters(updated);
    loadArchitecture(opportunityId, true, { [key]: value });
  };
  // ── Apply a template: same regenerate path, just multiple fields at once ──
  const applyTemplate = (templateParams) => {
    setDesignParameters({ ...designParameters, ...templateParams });
    loadArchitecture(opportunityId, true, templateParams);
  };

  if (loading) {
    return (
      <ProcessingState
        steps={[
          "Loading brief, competencies, and modules",
          "Applying design parameters",
          "Sequencing phases and blocks",
          "Checking coverage and load warnings"
        ]}
        estimate="Usually takes 10-15 seconds"
      />
    );
  }

  const totalModules = (architecture?.phases || [])
    .flatMap((p) => p.blocks || [])
    .flatMap((b) => b.modules || []).length;

  const facultyCount = architecture?.derived_metrics?.faculty_utilisation?.length || 0;

  const coverage = architecture?.derived_metrics?.competency_coverage;
  const coveragePct = coverage?.total
    ? Math.round((coverage.covered / coverage.total) * 100)
    : 100;

  const warnings = architecture?.derived_metrics?.warnings || [];

  return (
    <div style={{ display: "flex", background: "#f1f5f9", minHeight: "100vh" }}>

      {/* SIDEBAR */}
      <div style={{ width: "250px", background: "white", padding: "30px 20px", borderRight: "1px solid #dbeafe" }}>
        <h2 style={{ color: "#2563eb", fontSize: "34px", fontWeight: "800", marginBottom: "40px" }}>
          Proposal AI
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <button className="sideBtn" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="sideBtn" onClick={() => navigate("/new")}>New Opportunity</button>
          <button className="sideBtn" onClick={() => navigate("/questions")}>Decision Questions</button>
          <button className="sideBtn" onClick={() => navigate("/mapping")}>Competency Mapping</button>
          <button className="activeBtn">Programme Architecture</button>
          <button className="sideBtn" onClick={() => navigate("/approach")}>Approach Note</button>
          <button className="sideBtn" onClick={() => navigate("/score")}>Proposal Score</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "30px" }}>

        {/* HEADER */}
        <div style={{ background: "white", padding: "25px", borderRadius: "24px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "#64748b", marginBottom: "10px" }}>
              Opportunities {" > "} {clientName || "..."} {" > "} Architecture
            </p>
            <h1 style={{ fontSize: "52px", color: "#0f172a", margin: 0 }}>
              Programme Architecture
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="topBtn" onClick={() => loadArchitecture(opportunityId)}>
              Refresh Validation
            </button>
            <button className="topBtn" onClick={() => alert("Export not built yet")}>
              Export PDF
            </button>
            <button className="saveBtn" onClick={() => navigate("/approach")}>
              Save & Continue
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px", borderRadius: "14px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>{error}</span>
            {errorRedirect && (
              <button className="topBtn" onClick={() => navigate(errorRedirect)}>
                Go Back
              </button>
            )}
          </div>
        )}

        {architecture && (
          <>
            {/* STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginBottom: "24px" }}>
              <div className="statCard"><h3>Total Days</h3><h1>{architecture.total_days ?? "-"}</h1></div>
              <div className="statCard"><h3>Total Modules</h3><h1>{totalModules}</h1></div>
              <div className="statCard"><h3>Faculty</h3><h1>{facultyCount}</h1></div>
              <div className="statCard"><h3>Competency Coverage</h3><h1>{coveragePct}%</h1></div>
            </div>

            {/* BODY */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px" }}>

              {/* LEFT: PHASES */}
              <div>
                {(architecture.phases || []).map((phase, index) => (
                  <div key={index} className="phaseCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h2>{phase.phase}</h2>
                      <span className="phaseBadge">{phase.duration}</span>
                    </div>
                    <div style={{ display: "grid", gap: "14px" }}>
                      {(phase.blocks || []).map((block, idx) => (
                        <div key={idx} className="moduleCard">
                          <div>
                            <h3>{block.title}</h3>
                            <p>
                              {block.time_slot}
                              {block.modules?.length ? ` • ${block.modules.join(", ")}` : ""}
                            </p>
                          </div>
                          <span className="phaseBadge">{block.duration_hrs}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT PANEL */}
              <div style={{ display: "grid", gap: "20px" }}>
                

                {/* DESIGN PARAMETERS */}
                <div className="rightCard">
                  <h2>Design Parameters</h2>
                  <label className="paramLabel">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    className="paramInput"
                    value={designParameters?.total_duration_days ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDesignParameters({
                        ...designParameters,
                        total_duration_days: raw === "" ? "" : Number(raw)
                      });
                    }}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) {
                        handleParameterChange("total_duration_days", val);
                      }
                    }}
                  />
                  <label className="paramLabel">Format</label>
                  <select
                    className="paramInput"
                    value={designParameters?.format || "residential"}
                    onChange={(e) => handleParameterChange("format", e.target.value)}
                  >
                    <option value="residential">Residential</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="virtual">Virtual</option>
                    <option value="modular">Modular</option>
                  </select>
                  <label className="paramLabel">Reinforcement</label>
                  <select
                    className="paramInput"
                    value={designParameters?.reinforcement || "medium"}
                    onChange={(e) => handleParameterChange("reinforcement", e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                

                {/* VALIDATION */}
                <div className="rightCard">
                  <h2>Validation</h2>
                  {warnings.length === 0 && <p className="success">✓ No issues detected</p>}
                  {warnings.map((w, i) => (
                    <p key={i} className="warning">⚠ {w}</p>
                  ))}
                </div>

                {/* RATIONALE */}
                {architecture.rationale && (architecture.rationale.shape_reason || architecture.rationale.sequencing_reason) && (
                  <div className="rightCard">
                    <h2>Why This Design</h2>
                    {architecture.rationale.shape_reason && <p>{architecture.rationale.shape_reason}</p>}
                    {architecture.rationale.sequencing_reason && <p style={{ marginTop: "10px" }}>{architecture.rationale.sequencing_reason}</p>}
                  </div>
                )}

              </div>

            </div>
          </>
        )}

      </div>

      {/* CSS */}
      <style>{`
        .sideBtn{background:white;border:none;padding:15px;border-radius:14px;text-align:left;cursor:pointer;font-weight:700;transition:0.3s;}
        .sideBtn:hover{background:#eff6ff;}
        .activeBtn{background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;border:none;padding:15px;border-radius:14px;text-align:left;font-weight:700;cursor:pointer;box-shadow:0 10px 20px rgba(37,99,235,0.25);}
        .topBtn{background:white;border:1px solid #dbeafe;padding:12px 18px;border-radius:12px;cursor:pointer;font-weight:700;}
        .saveBtn{background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;border:none;padding:12px 22px;border-radius:12px;cursor:pointer;font-weight:700;}
        .statCard{background:white;padding:24px;border-radius:20px;}
        .statCard h3{color:#64748b;margin-bottom:10px;}
        .statCard h1{color:#2563eb;font-size:52px;}
        .phaseCard{background:white;padding:24px;border-radius:24px;margin-bottom:24px;}
        .phaseBadge{background:#dbeafe;color:#2563eb;padding:8px 16px;border-radius:999px;font-weight:700;}
        .moduleCard{background:#f8fafc;border:1px solid #dbeafe;padding:18px;border-radius:18px;display:flex;justify-content:space-between;align-items:center;}
        .moduleCard p{color:#64748b;margin-top:6px;}
        .rightCard{background:white;padding:24px;border-radius:24px;}
        .rightCard h2{margin-bottom:20px;}
        .paramLabel{display:block;font-size:13px;font-weight:700;color:#64748b;margin-bottom:6px;margin-top:14px;}
        .paramInput{width:100%;padding:10px;border-radius:10px;border:1px solid #dbeafe;font-weight:600;}
        .warning{color:#f59e0b;margin-bottom:10px;}
        .success{color:#10b981;}
      `}</style>

    </div>
  );
}
