import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buildArchitecture, getOpportunity } from "../services/api";

// ── Colour tokens ────────────────────────────────
const C = {
  ink:      "#0f172a",
  ink2:     "#334155",
  ink3:     "#64748b",
  ink4:     "#94a3b8",
  surface:  "#f8fafc",
  white:    "#ffffff",
  border:   "#e2e8f0",
  blue:     "#2563eb",
  blueSoft: "#eff6ff",
  purple:   "#7c3aed",
  purpleSoft:"#f5f3ff",
  green:    "#16a34a",
  greenSoft:"#f0fdf4",
  amber:    "#d97706",
  amberSoft:"#fffbeb",
  red:      "#dc2626",
  redSoft:  "#fef2f2",
  grad:     "linear-gradient(135deg,#2563eb,#7c3aed)",
};

// ── Phase colour map ─────────────────────────────
const PHASE_COLORS = {
  "Pre-Work":  { bg: "#f0fdf4", border: "#86efac", badge: "#16a34a" },
  "Day 1":     { bg: "#eff6ff", border: "#93c5fd", badge: "#2563eb" },
  "Day 2":     { bg: "#f5f3ff", border: "#c4b5fd", badge: "#7c3aed" },
  "Day 3":     { bg: "#fff7ed", border: "#fdba74", badge: "#ea580c" },
  "Day 4":     { bg: "#fdf4ff", border: "#e879f9", badge: "#a21caf" },
  "Day 5":     { bg: "#f0fdfa", border: "#5eead4", badge: "#0d9488" },
  "Post-Work": { bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626" },
};
const phaseColor = (title) =>
  PHASE_COLORS[title] || { bg: "#f8fafc", border: "#cbd5e1", badge: "#64748b" };

// ── Default slider state ─────────────────────────
const DEFAULT_PARAMS = {
  duration:      3,
  modality:      60,   // % residential
  cohortSize:    30,
  reinforcement: 50,
  measurement:   50,
};

// ── COMPONENT ────────────────────────────────────
export default function ArchitectureStage() {
  const navigate   = useNavigate();
  const opportunityId = localStorage.getItem("pis_opportunity_id");

  const [architecture, setArchitecture] = useState(null);
  const [opportunity,  setOpportunity]  = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [generating,   setGenerating]   = useState(false);
  const [genStep,      setGenStep]      = useState(0);

  const [params,       setParams]       = useState(DEFAULT_PARAMS);
  const [selected,     setSelected]     = useState(null);   // selected module
  const [compareMode,  setCompareMode]  = useState(false);
  const [savedOptions, setSavedOptions] = useState([]);     // compare snapshots

  const canvasRef = useRef(null);

  // ── Generation steps (for progress bar) ──────────
  const GEN_STEPS = [
    "Reading competency map…",
    "Analysing confirmed modules…",
    "Applying 70-20-10 framework…",
    "Sequencing learning arc…",
    "Checking faculty availability…",
    "Mapping Bloom's taxonomy levels…",
    "Calculating cognitive load…",
    "Validating programme integrity…",
    "Finalising architecture…",
  ];

  // ── Load on mount ─────────────────────────────────
  useEffect(() => {
    if (!opportunityId) { navigate("/new"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Try cached architecture first
      const cached = localStorage.getItem(`pis_architecture_${opportunityId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setArchitecture(parsed.architecture);
        setOpportunity(parsed.opportunity);
        setLoading(false);
        return;
      }
      // Otherwise build fresh
      await generateArchitecture(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load architecture");
    }
    setLoading(false);
  };

  const generateArchitecture = async (force = false) => {
    setGenerating(true);
    setGenStep(0);
    setError("");

    // Animate generation steps
    const stepTimer = setInterval(() => {
      setGenStep(s => {
        if (s >= GEN_STEPS.length - 1) { clearInterval(stepTimer); return s; }
        return s + 1;
      });
    }, 1400);

    try {
      const [archRes, oppRes] = await Promise.all([
        buildArchitecture(opportunityId, force),
        getOpportunity(opportunityId),
      ]);
      clearInterval(stepTimer);
      setGenStep(GEN_STEPS.length - 1);

      const arch = archRes.architecture;
      const opp  = oppRes.data;
      setArchitecture(arch);
      setOpportunity(opp);

      // Cache locally
      localStorage.setItem(`pis_architecture_${opportunityId}`, JSON.stringify({
        architecture: arch,
        opportunity:  opp,
      }));
    } catch (err) {
      clearInterval(stepTimer);
      setError(err?.response?.data?.error || "Generation failed");
    }
    setGenerating(false);
  };

  // ── Derived stats ─────────────────────────────────
  const phases  = architecture?.phases || [];
  const allMods = phases.flatMap(p => p.blocks || p.modules || []);
  const totalDays    = architecture?.total_days    || phases.filter(p => p.type === "residential" || p.title?.startsWith("Day")).length;
  const totalModules = allMods.length;
  const faculties    = [...new Set(allMods.map(m => m.faculty).filter(Boolean))];
  const aiConf       = architecture?.validation?.confidence || 92;

  // ── Validation warnings ───────────────────────────
  const warnings = architecture?.validation?.warnings || [];
  const autoWarnings = [];
  if (totalDays > 5) autoWarnings.push({ type: "warn", msg: "Programme exceeds 5 days — check client availability." });
  if (totalModules < 6) autoWarnings.push({ type: "warn", msg: "Fewer than 6 modules — capstone may be thin." });
  if (faculties.length < 2) autoWarnings.push({ type: "warn", msg: "Only 1 faculty member — single point of failure." });
  const allWarnings = [...autoWarnings, ...warnings.map(w => ({ type: "warn", msg: w }))];

  // ── Save as compare option ────────────────────────
  const saveOption = () => {
    if (!architecture) return;
    setSavedOptions(prev => [
      ...prev.slice(-1),
      { label: `Option ${savedOptions.length + 1}`, arch: architecture, params: { ...params } },
    ]);
    alert(`Saved as Option ${savedOptions.length + 1}`);
  };

  // ── Template apply ────────────────────────────────
  const applyTemplate = (tpl) => {
    const presets = {
      "1-Day Briefing":      { duration: 1, modality: 80, reinforcement: 30 },
      "3-Day Intensive":     { duration: 3, modality: 70, reinforcement: 50 },
      "5-Day Residential":   { duration: 5, modality: 90, reinforcement: 70 },
      "5-Day Leadership":    { duration: 5, modality: 85, reinforcement: 80 },
      "Hybrid Sprint":       { duration: 3, modality: 50, reinforcement: 60 },
      "Virtual Series":      { duration: 4, modality: 20, reinforcement: 50 },
      "Exec Masterclass":    { duration: 2, modality: 100, reinforcement: 40 },
    };
    if (presets[tpl]) {
      setParams(p => ({ ...p, ...presets[tpl] }));
    }
  };

  // ── Render ────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 220, background: C.white, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "28px 16px", gap: 6, flexShrink: 0 }}>
        <h2 style={{ color: C.blue, fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.5px" }}>Proposal<br />AI</h2>
        {[
          ["Dashboard",           "/dashboard"],
          ["New Opportunity",     "/new"],
          ["Decision Questions",  "/questions"],
          ["Competency Mapping",  "/mapping"],
          ["Programme Architecture", null],
          ["Approach Note",       "/approach"],
          ["Proposal Score",      "/score"],
        ].map(([label, path]) => (
          <button key={label} onClick={() => path && navigate(path)} style={{
            background: !path ? C.grad : "transparent",
            color: !path ? C.white : C.ink2,
            border: "none", borderRadius: 12, padding: "12px 14px",
            textAlign: "left", fontWeight: !path ? 700 : 500,
            fontSize: 14, cursor: path ? "pointer" : "default",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => { if (path) e.currentTarget.style.background = C.blueSoft; }}
            onMouseLeave={e => { if (path) e.currentTarget.style.background = "transparent"; }}
          >{label}</button>
        ))}
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, color: C.ink3, marginBottom: 2 }}>
              Opportunities › {opportunity?.client_name || "…"} › Architecture
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: 0 }}>Programme Architecture</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={saveOption} style={outlineBtn}>💾 Save Option</button>
            <button onClick={() => setCompareMode(!compareMode)} style={{ ...outlineBtn, background: compareMode ? C.blueSoft : C.white }}>
              ⚖️ Compare {compareMode ? "ON" : "OFF"}
            </button>
            <button onClick={() => generateArchitecture(true)} style={outlineBtn} disabled={generating}>
              🔄 Regenerate
            </button>
            <button onClick={() => alert("Exporting PDF…")} style={outlineBtn}>📄 Export PDF</button>
            <button onClick={() => navigate("/approach")} style={{ background: C.grad, color: C.white, border: "none", padding: "10px 22px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Save & Continue →
            </button>
          </div>
        </div>

        {/* ── BODY: left rail + canvas + right rail ── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 280px", overflow: "hidden" }}>

          {/* ── LEFT RAIL ── */}
          <div style={{ background: C.white, borderRight: `1px solid ${C.border}`, padding: "20px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Days",    totalDays],
                ["Modules", totalModules],
                ["Faculty", faculties.length],
                ["AI Conf", `${aiConf}%`],
              ].map(([label, val]) => (
                <div key={label} style={{ background: C.surface, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.ink3, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Phase navigator */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Phases</p>
              {phases.map((phase, i) => {
                const col = phaseColor(phase.phase || phase.title);
                return (
                  <div key={i} onClick={() => { canvasRef.current?.children[i]?.scrollIntoView({ behavior: "smooth" }); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, marginBottom: 4, cursor: "pointer", background: C.surface }}
                    onMouseEnter={e => e.currentTarget.style.background = C.blueSoft}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: col.badge, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.ink2 }}>{phase.phase || phase.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.ink4 }}>{(phase.blocks || phase.modules || []).length}m</span>
                  </div>
                );
              })}
            </div>

            {/* Warnings */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Warnings</p>
              {allWarnings.length === 0
                ? <p style={{ fontSize: 12, color: C.green }}>✓ No issues detected</p>
                : allWarnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, padding: "8px 10px", background: C.amberSoft, borderRadius: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13 }}>⚠️</span>
                      <span style={{ fontSize: 12, color: C.amber }}>{w.msg}</span>
                    </div>
                  ))
              }
              <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: C.greenSoft, borderRadius: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 12, color: C.green }}>Capstone included</span>
              </div>
            </div>

            {/* Competency coverage */}
            {architecture?.validation?.competencies_covered?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Competencies Covered</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {architecture.validation.competencies_covered.map((c, i) => (
                    <span key={i} style={{ padding: "3px 10px", background: C.purpleSoft, color: C.purple, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── CANVAS ── */}
          <div style={{ overflowY: "auto", padding: "24px 20px", background: C.surface }}>

            {/* Generating overlay */}
            {generating && (
              <div style={{ background: C.white, borderRadius: 20, padding: "48px 32px", textAlign: "center", marginBottom: 24, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🏗️</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Building Architecture…</h2>
                <p style={{ color: C.ink3, marginBottom: 24, fontSize: 14 }}>{GEN_STEPS[genStep]}</p>
                <div style={{ background: C.border, borderRadius: 999, height: 8, overflow: "hidden", maxWidth: 400, margin: "0 auto" }}>
                  <div style={{ height: "100%", background: C.grad, borderRadius: 999, width: `${((genStep + 1) / GEN_STEPS.length) * 100}%`, transition: "width 1.2s ease" }} />
                </div>
                <p style={{ color: C.ink4, fontSize: 12, marginTop: 12 }}>Step {genStep + 1} of {GEN_STEPS.length}</p>
              </div>
            )}

            {/* Error */}
            {error && !generating && (
              <div style={{ background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, color: C.red }}>
                ⚠️ {error}
                <button onClick={() => generateArchitecture(true)} style={{ marginLeft: 12, background: C.red, color: C.white, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Retry</button>
              </div>
            )}

            {/* Empty state */}
            {!generating && !error && phases.length === 0 && (
              <div style={{ background: C.white, borderRadius: 20, padding: "60px 32px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 8 }}>No Architecture Yet</h2>
                <p style={{ color: C.ink3, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>Complete Competency Mapping first, then generate the programme architecture.</p>
                <button onClick={() => generateArchitecture(true)} style={{ background: C.grad, color: C.white, border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Generate Architecture ✨
                </button>
              </div>
            )}

            {/* Compare mode banner */}
            {compareMode && savedOptions.length > 0 && (
              <div style={{ background: C.purpleSoft, border: `1px solid ${C.purple}`, borderRadius: 14, padding: "12px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.purple, fontWeight: 600 }}>⚖️ Compare Mode</span>
                {savedOptions.map((opt, i) => (
                  <button key={i} onClick={() => setArchitecture(opt.arch)} style={{ padding: "6px 14px", borderRadius: 10, border: `1px solid ${C.purple}`, background: C.white, color: C.purple, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                ))}
                <button onClick={() => setCompareMode(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.ink3, cursor: "pointer" }}>✕</button>
              </div>
            )}

            {/* Phases canvas */}
            <div ref={canvasRef}>
              {phases.map((phase, pi) => {
                const col   = phaseColor(phase.phase || phase.title);
                const mods  = phase.blocks || phase.modules || [];
                const dur   = phase.duration || (mods.reduce((s, m) => s + (m.duration_hrs || 0), 0) + " hrs");
                return (
                  <div key={pi} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 20, padding: "22px 24px", marginBottom: 20 }}>
                    {/* Phase header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: col.badge }} />
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>{phase.phase || phase.title}</h2>
                      </div>
                      <span style={{ padding: "5px 14px", background: col.badge, color: C.white, borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{dur}</span>
                    </div>

                    {/* Module cards */}
                    <div style={{ display: "grid", gap: 12 }}>
                      {mods.map((mod, mi) => {
                        const isSelected = selected?.pi === pi && selected?.mi === mi;
                        return (
                          <div key={mi}
                            onClick={() => setSelected(isSelected ? null : { pi, mi, mod, phase })}
                            style={{
                              background: C.white, border: `1.5px solid ${isSelected ? col.badge : C.border}`,
                              borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center",
                              justifyContent: "space-between", cursor: "pointer",
                              boxShadow: isSelected ? `0 0 0 3px ${col.border}` : "none",
                              transition: "box-shadow 0.2s, border-color 0.2s",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{mod.title || mod.name}</span>
                                {mod.format && <span style={{ padding: "2px 8px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.ink3 }}>{mod.format}</span>}
                              </div>
                              <div style={{ display: "flex", gap: 16 }}>
                                {mod.faculty && <span style={{ fontSize: 12, color: C.ink3 }}>👤 {mod.faculty}</span>}
                                {mod.time_slot && <span style={{ fontSize: 12, color: C.ink3 }}>🕐 {mod.time_slot}</span>}
                                {mod.duration_hrs && <span style={{ fontSize: 12, color: C.ink3 }}>⏱ {mod.duration_hrs}h</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={e => { e.stopPropagation(); alert(`Why is "${mod.title || mod.name}" here?\n\nThis module addresses the competency gaps identified during the discovery call and builds directly on prior session content using the 70-20-10 framework.`); }}
                                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 11, color: C.ink3, cursor: "pointer", fontWeight: 600 }}>
                                Why?
                              </button>
                              <button onClick={e => { e.stopPropagation(); alert(`Editing: ${mod.title || mod.name}`); }}
                                style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: col.badge, color: C.white, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                                Edit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* ── RIGHT RAIL ── */}
          <div style={{ background: C.white, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Inspector — shows when a module is selected */}
            {selected ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Inspector</p>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.ink3, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>{selected.mod.title || selected.mod.name}</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    ["Phase",    selected.phase.phase || selected.phase.title],
                    ["Faculty",  selected.mod.faculty  || "—"],
                    ["Format",   selected.mod.format   || "—"],
                    ["Time",     selected.mod.time_slot || "—"],
                    ["Duration", selected.mod.duration_hrs ? `${selected.mod.duration_hrs} hours` : "—"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, color: C.ink3 }}>{k}</span>
                      <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: C.blueSoft, borderRadius: 12, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 6 }}>Why is this here?</p>
                  <p style={{ fontSize: 12, color: C.ink2, lineHeight: 1.6 }}>
                    This module directly addresses competency gaps identified during discovery, sequenced here to build on prior content and allow consolidation before the next phase.
                  </p>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => alert("Replace module…")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Replace</button>
                  <button onClick={() => alert("Remove module…")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${C.red}`, background: C.redSoft, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ) : (
              <>
                {/* Design Parameters */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Design Parameters</p>
                  <p style={{ fontSize: 11, color: C.ink4, marginBottom: 16 }}>Adjust sliders to reshape the architecture. Changes reflect in validation warnings instantly.</p>

                  {[
                    { key: "duration",      label: "Duration (days)", min: 1, max: 7, unit: "days" },
                    { key: "modality",      label: "Residential %",   min: 0, max: 100, unit: "%" },
                    { key: "cohortSize",    label: "Cohort Size",      min: 10, max: 100, unit: "pax" },
                    { key: "reinforcement", label: "Reinforcement",    min: 0, max: 100, unit: "%" },
                    { key: "measurement",   label: "Measurement Depth",min: 0, max: 100, unit: "%" },
                  ].map(({ key, label, min, max, unit }) => (
                    <div key={key} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: C.ink2, fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>{params[key]}{unit}</span>
                      </div>
                      <input type="range" min={min} max={max} value={params[key]}
                        onChange={e => setParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: C.blue }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: C.ink4 }}>{min}{unit}</span>
                        <span style={{ fontSize: 10, color: C.ink4 }}>{max}{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Templates */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Templates</p>
                  {[
                    "1-Day Briefing",
                    "3-Day Intensive",
                    "5-Day Residential",
                    "5-Day Leadership",
                    "Hybrid Sprint",
                    "Virtual Series",
                    "Exec Masterclass",
                  ].map(tpl => (
                    <div key={tpl} onClick={() => applyTemplate(tpl)}
                      style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.ink2, background: C.surface, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.blueSoft}
                      onMouseLeave={e => e.currentTarget.style.background = C.surface}
                    >{tpl}</div>
                  ))}
                </div>

                {/* AI Suggestions */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>AI Suggestions</p>
                  {[
                    "Add peer coaching on Day 2 to reinforce reflection.",
                    "Increase innovation simulation coverage.",
                    "Consider a pre-work diagnostic to calibrate entry level.",
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: C.purpleSoft, border: `1px solid ${C.purple}20`, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: C.ink2 }}>💡 {s}</span>
                    </div>
                  ))}
                </div>

              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared button style ──────────────────────────
const outlineBtn = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "9px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  color: "#334155",
  transition: "background 0.15s",
};