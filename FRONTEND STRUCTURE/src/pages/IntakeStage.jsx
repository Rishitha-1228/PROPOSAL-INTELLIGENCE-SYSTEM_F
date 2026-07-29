import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analyseBrief } from "../services/api";

const INTAKE_STORAGE_KEY = "pis_intake_state";

const DEFAULT_FORM = {
  title: "",
  client: "",
  organisation: "",
  industry: "",
  programmeType: "new",
  brief: "",
  meetingNotes: "",
  websiteLink: "",
  seniority: "",
  capability: "",
  format: "",
  location: "",
  durationKnown: "yes",
  totalDays: "",
  durationCustom: false,
  hoursPerDay: "6",
  budget: "",
  budgetFlag: "",
  phases: [{ month: "Month 1", sessions: [{ day: "Day 1", mode: "" }] }],
};

const PROG_TYPES = [
  { value: "new",                          label: "New Programme",              desc: "First time this is being run" },
  { value: "repeat",                       label: "Repeat Programme",           desc: "Delivered before — skip to Architecture" },
  { value: "new_with_repeat_participants", label: "New Programme, Same Cohort", desc: "New content, familiar audience" },
];

const DURATION_DAY_OPTIONS = ["1", "2", "3", "4", "5", "7", "10", "15", "20", "custom"];
const HOURS_PER_DAY_OPTIONS = ["4", "5", "6", "7", "8"];

export default function IntakeStage() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const audioRef  = useRef(null);
  const imageRef  = useRef(null);

  const [formData,     setFormData]     = useState(DEFAULT_FORM);
  const [analysis,     setAnalysis]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [attachments,  setAttachments]  = useState([]);
  const [isRecording,  setIsRecording]  = useState(false);
  const [transcript,   setTranscript]   = useState("");
  const [recError,     setRecError]     = useState("");
  const recognitionRef = useRef(null);

  const [editingField, setEditingField] = useState(null);
  const [editDraft,    setEditDraft]    = useState("");

useEffect(() => {
    try {
      const saved = localStorage.getItem(INTAKE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          let loadedForm = { ...DEFAULT_FORM, ...parsed.formData };
          // Migrate old phase shape { month, days, mode } to { month, sessions: [...] }
          const needsMigration = loadedForm.phases?.some(p => !Array.isArray(p.sessions));
          if (needsMigration) {
            loadedForm = {
              ...loadedForm,
              phases: loadedForm.phases.map((p, i) => ({
                month: p.month || `Month ${i + 1}`,
                sessions: Array.isArray(p.sessions) ? p.sessions : [{ day: "Day 1", mode: p.mode || "" }],
              })),
            };
          }
          setFormData(loadedForm);
        }
        if (parsed.analysis)    setAnalysis(parsed.analysis);
        if (parsed.attachments) setAttachments(parsed.attachments);
      }
    } catch { /* ignore */ }
  }, []);

  const persist = (nextForm, nextAnalysis, nextAttachments) => {
    try {
      localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify({
        formData:    nextForm,
        analysis:    nextAnalysis,
        attachments: nextAttachments ?? attachments,
      }));
    } catch { /* ignore */ }
  };

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    persist(updated, analysis);
  };

  const setField = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    persist(updated, analysis);
  };

  const handleDurationSelect = (e) => {
    const val = e.target.value;
    const updated = val === "custom"
      ? { ...formData, durationCustom: true, totalDays: "" }
      : { ...formData, durationCustom: false, totalDays: val };
    setFormData(updated);
    persist(updated, analysis);
  };

  // ── Month-level operations ─────────────────────
  const addMonth = () => {
    const updated = {
      ...formData,
      phases: [...formData.phases, {
        month: `Month ${formData.phases.length + 1}`,
        sessions: [{ day: "Day 1", mode: "" }]
      }]
    };
    setFormData(updated);
    persist(updated, analysis);
  };

  const removeMonth = (mi) => {
    const updated = { ...formData, phases: formData.phases.filter((_, idx) => idx !== mi) };
    setFormData(updated);
    persist(updated, analysis);
  };

  const updateMonthName = (mi, value) => {
    const phases = formData.phases.map((p, idx) => idx === mi ? { ...p, month: value } : p);
    const updated = { ...formData, phases };
    setFormData(updated);
    persist(updated, analysis);
  };

  // ── Day/session-level operations ───────────────
  const addSessionToMonth = (mi) => {
    const phases = formData.phases.map((p, idx) => {
      if (idx !== mi) return p;
      const dayNum = p.sessions.length + 1;
      return { ...p, sessions: [...p.sessions, { day: `Day ${dayNum}`, mode: "" }] };
    });
    const updated = { ...formData, phases };
    setFormData(updated);
    persist(updated, analysis);
  };

  const removeSession = (mi, si) => {
    const phases = formData.phases.map((p, idx) => {
      if (idx !== mi) return p;
      return { ...p, sessions: p.sessions.filter((_, sidx) => sidx !== si) };
    });
    const updated = { ...formData, phases };
    setFormData(updated);
    persist(updated, analysis);
  };

  const updateSession = (mi, si, field, value) => {
    const phases = formData.phases.map((p, idx) => {
      if (idx !== mi) return p;
      const sessions = p.sessions.map((s, sidx) => sidx === si ? { ...s, [field]: value } : s);
      return { ...p, sessions };
    });
    const updated = { ...formData, phases };
    setFormData(updated);
    persist(updated, analysis);
  };

  // ── Attachments ───────────────────────────────
  const handleFiles = (files, type = "file") => {
    const newAtts = Array.from(files).map(f => ({ name: f.name, type, size: (f.size / 1024).toFixed(1) + " KB" }));
    const next = [...attachments, ...newAtts];
    setAttachments(next);
    persist(formData, analysis, next);
  };

  const removeAttachment = (i) => {
    const next = attachments.filter((_, idx) => idx !== i);
    setAttachments(next);
    persist(formData, analysis, next);
  };

  const handleWebsiteAdd = () => {
    if (!formData.websiteLink.trim()) return;
    const next    = [...attachments, { name: formData.websiteLink, type: "link", size: "—" }];
    const updated = { ...formData, websiteLink: "" };
    setAttachments(next);
    setFormData(updated);
    persist(updated, analysis, next);
  };

  // ── Speech-to-text recording ──────────────────
  // NOTE: these must live at component top level (not inside handleAnalyse)
  // so the Record Call button can actually call them.
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecError("Your browser doesn't support speech recognition. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = "en-IN";

    recognition.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript + " ";
      }
      setTranscript(full.trim());
    };

    recognition.onerror = (e) => {
      setRecError("Recording error: " + e.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecError("");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (transcript) {
      const updated = {
        ...formData,
        meetingNotes: formData.meetingNotes
          ? formData.meetingNotes + "\n\n[Recording Transcript]\n" + transcript
          : "[Recording Transcript]\n" + transcript
      };
      setFormData(updated);
      persist(updated, analysis);
    }
  };

  // ── Source tag styling ─────────────────────────
  const SOURCE_STYLE = {
    client_stated: { label: "Client Stated", bg: "#dcfce7", color: "#166534" },
    inferred:      { label: "Inferred",      bg: "#fef3c7", color: "#92400e" },
    assumed:       { label: "Assumed",       bg: "#fee2e2", color: "#991b1b" },
  };

  const confidenceColor = (score) => score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";

  const startEdit = (fieldKey, currentValue) => {
    setEditingField(fieldKey);
    setEditDraft(Array.isArray(currentValue) ? currentValue.join("\n") : (currentValue || ""));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditDraft("");
  };

  const saveEdit = (fieldKey, isArray) => {
    const newValue = isArray
      ? editDraft.split("\n").map(s => s.trim()).filter(Boolean)
      : editDraft.trim();

    const updatedInterpreted = {
      ...analysis.interpreted,
      [fieldKey]: {
        ...analysis.interpreted[fieldKey],
        value: newValue,
        confidence: 100,
        source: "client_stated",
      },
    };
    const updatedAnalysis = { ...analysis, interpreted: updatedInterpreted };
    setAnalysis(updatedAnalysis);
    persist(formData, updatedAnalysis);
    setEditingField(null);
    setEditDraft("");
  };

  const renderSection = (fieldKey, title, color, isArray = false) => {
    const field = analysis.interpreted?.[fieldKey];
    if (!field) return null;
    const src = SOURCE_STYLE[field.source] || SOURCE_STYLE.assumed;
    const isEditing = editingField === fieldKey;

    return (
      <div key={fieldKey} style={S.aiCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ margin: 0, color, fontSize: "15px", fontWeight: "700" }}>{title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", background: src.bg, color: src.color }}>
              {src.label}
            </span>
            <span style={{ fontSize: "11px", fontWeight: "700", color: confidenceColor(field.confidence) }}>
              {field.confidence}%
            </span>
            {!isEditing && (
              <button onClick={() => startEdit(fieldKey, field.value)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              rows={isArray ? 4 : 3}
              placeholder={isArray ? "One item per line" : ""}
              style={S.textarea}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={() => saveEdit(fieldKey, isArray)}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                Save
              </button>
              <button onClick={cancelEdit}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : isArray ? (
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            {field.value?.map((item, i) => <li key={i} style={{ marginBottom: "6px", color: "#334155", fontSize: "14px" }}>{item}</li>)}
          </ul>
        ) : (
          <p style={{ color: "#334155", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{field.value}</p>
        )}
      </div>
    );
  };

  // ── Analyse ───────────────────────────────────
  const handleAnalyse = async () => {
    if (!formData.client) { setError("Please enter Client Name"); return; }
    if (!formData.brief && !formData.meetingNotes) { setError("Please paste the client brief or meeting notes."); return; }
    try {
      setLoading(true);
      setError("");
      const result = await analyseBrief({
        client_name: formData.client,
        brief_text:  formData.brief || formData.meetingNotes,
        due_date:    null,
      });
      localStorage.setItem("pis_opportunity_id", result.opportunity_id);

      const constraints = result.interpreted?.constraints?.value || [];
      const budgetHint  = constraints.find(c => /budget|lakh|crore|₹|cost|investment|commercial/i.test(c));
      const budgetValue = budgetHint ? budgetHint : formData.budget;
      const budgetFlag  = budgetHint ? "found" : "not_found";
      const updatedForm = { ...formData, budget: budgetValue, budgetFlag };
      setFormData(updatedForm);
      setAnalysis(result);
      persist(updatedForm, result);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not analyse opportunity.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!analysis) { setError("Please analyse the brief first before continuing."); return; }
    navigate(formData.programmeType === "repeat" ? "/architecture" : "/questions");
  };

  const handleStartNew = () => {
    setFormData(DEFAULT_FORM);
    setAnalysis(null);
    setError("");
    setAttachments([]);
    localStorage.removeItem(INTAKE_STORAGE_KEY);
    localStorage.removeItem("pis_opportunity_id");
  };

  // ── Shared styles ─────────────────────────────
  const S = {
    sectionTitle: { fontSize: "19px", fontWeight: "700", color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginTop: "36px", marginBottom: "18px" },
    grid2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    card:   { background: "#f8fafc", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0", marginTop: "16px" },
    input:  { padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
    label:  { fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" },
    textarea: { width: "100%", padding: "16px", borderRadius: "14px", border: "1px solid #cbd5e1", fontSize: "15px", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
    aiCard: { background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #dbe4ff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginTop: "16px" },
    nav:    { padding: "12px 14px", borderRadius: "12px", cursor: "pointer", marginBottom: "8px", fontWeight: "600", color: "#475569", fontSize: "14px" },
    navActive: { padding: "12px 14px", borderRadius: "12px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "8px", fontWeight: "700", fontSize: "14px" },
    toggleCard: (active) => ({
      flex: 1, minWidth: 150, padding: "14px 16px", borderRadius: "14px", cursor: "pointer",
      border: `2px solid ${active ? "#2563eb" : "#e2e8f0"}`,
      background: active ? "#eff6ff" : "#f8fafc",
      transition: "all 0.15s",
    }),
    outlineBtn: { padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#334155" },
  };

  return (
    <>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "220px", background: "white", borderRight: "1px solid #e2e8f0", padding: "24px 14px", flexShrink: 0 }}>
        <h1 style={{ color: "#2563eb", fontSize: "22px", fontWeight: "800", marginBottom: "28px", lineHeight: 1.3 }}>Proposal<br />Intelligence</h1>
        {[["New Opportunity", null], ["Questions", "/questions"], ["Competency Mapping", "/mapping"], ["Architecture", "/architecture"], ["Approach Note", "/approach"], ["Proposal Score", "/score"]].map(([label, path]) => (
          <div key={label} style={!path ? S.navActive : S.nav} onClick={() => path && navigate(path)}>{label}</div>
        ))}
        <div style={{ ...S.nav, marginTop: "32px", color: "#94a3b8" }} onClick={() => navigate("/dashboard")}>← Dashboard</div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "36px", overflowY: "auto" }}>
        <div style={{ background: "white", borderRadius: "24px", padding: "40px", border: "1px solid #e2e8f0", maxWidth: 900, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", margin: 0 }}>New Opportunity</h1>
              <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>Fill in the details, attach the brief, and analyse.</p>
            </div>
            {analysis && (
              <button onClick={handleStartNew} style={S.outlineBtn}>+ Start Different Opportunity</button>
            )}
          </div>

          {/* PROGRAMME TYPE */}
          <h2 style={S.sectionTitle}>Programme Type</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {PROG_TYPES.map(opt => (
              <div key={opt.value} style={S.toggleCard(formData.programmeType === opt.value)}
                onClick={() => setField("programmeType", opt.value)}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: formData.programmeType === opt.value ? "#2563eb" : "#334155", marginBottom: "4px" }}>{opt.label}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{opt.desc}</div>
              </div>
            ))}
          </div>
          {formData.programmeType === "repeat" && (
            <div style={{ marginTop: "12px", padding: "12px 16px", background: "#fef3c7", borderRadius: "12px", border: "1px solid #fbbf24", fontSize: "13px", color: "#92400e" }}>
              ⚡ Repeat programme — "Next" will skip Discovery Questions and go straight to Architecture.
            </div>
          )}

          {/* OPPORTUNITY BASICS */}
          <h2 style={S.sectionTitle}>Opportunity Basics</h2>
          <div style={S.grid2}>
            {[["title", "Opportunity Title", "e.g. AI Leadership Programme"], ["client", "Client Name *", "e.g. Tata Digital Services"], ["organisation", "Organisation", "Parent organisation"], ["industry", "Industry", "e.g. Financial Services"]].map(([name, label, ph]) => (
              <div key={name}>
                <label style={S.label}>{label}</label>
                <input name={name} value={formData[name]} onChange={handleChange} placeholder={ph} style={S.input} />
              </div>
            ))}
          </div>

          {/* CLIENT BRIEF & ATTACHMENTS */}
          <h2 style={S.sectionTitle}>Client Brief & Attachments</h2>

          <div style={S.card}>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>Client Email / RFP / Meeting Notes</div>
            <textarea name="brief" value={formData.brief} onChange={handleChange}
              placeholder="Paste client email, RFP, or any text brief here..." rows={7} style={S.textarea} />
          </div>

          <div style={{ ...S.card, marginTop: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>Attach Source Material</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "📎 Attach Files",      ref: fileRef,  accept: "*",        type: "file" },
                { label: "🎵 Audio / Recording", ref: audioRef, accept: "audio/*",  type: "audio" },
                { label: "🖼️ Images",            ref: imageRef, accept: "image/*",  type: "image" },
              ].map(btn => (
                <span key={btn.label}>
                  <input type="file" ref={btn.ref} multiple accept={btn.accept} style={{ display: "none" }} onChange={e => handleFiles(e.target.files, btn.type)} />
                  <button onClick={() => btn.ref.current?.click()} style={S.outlineBtn}>{btn.label}</button>
                </span>
              ))}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  ...S.outlineBtn,
                  background: isRecording ? "#fef2f2" : "white",
                  border: isRecording ? "1px solid #dc2626" : "1px solid #cbd5e1",
                  color: isRecording ? "#dc2626" : "#334155",
                  animation: isRecording ? "pulse 1.5s infinite" : "none",
                }}
              >
                {isRecording ? "⏹ Stop Recording" : "🎙️ Record Call"}
              </button>
              <button onClick={() => alert("Teams / Zoom / Meet integration — coming soon.")} style={S.outlineBtn}>📹 Import from Meeting App</button>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input name="websiteLink" value={formData.websiteLink} onChange={handleChange}
                placeholder="Paste a website / LinkedIn / job description URL..." style={{ ...S.input, flex: 1 }} />
              <button onClick={handleWebsiteAdd}
                style={{ padding: "14px 20px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #93c5fd", color: "#2563eb", fontWeight: "600", fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap" }}>
                + Add Link
              </button>
            </div>

            {attachments.length > 0 && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f1f5f9", borderRadius: "10px", fontSize: "13px" }}>
                    <span>
                      {att.type === "audio" ? "🎵" : att.type === "image" ? "🖼️" : att.type === "link" ? "🔗" : "📎"}{" "}
                      <strong>{att.name}</strong>
                      <span style={{ color: "#94a3b8", marginLeft: "8px" }}>{att.size}</span>
                    </span>
                    <button onClick={() => removeAttachment(i)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recording transcript area */}
          {(isRecording || transcript) && (
            <div style={{ marginTop: "16px", padding: "16px", background: isRecording ? "#fef2f2" : "#f0fdf4", borderRadius: "12px", border: `1px solid ${isRecording ? "#fca5a5" : "#86efac"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: isRecording ? "#dc2626" : "#16a34a" }}>
                  {isRecording ? "🔴 Recording in progress... speak now" : "✅ Transcript captured"}
                </span>
                {transcript && !isRecording && (
                  <button
                    onClick={() => setTranscript("")}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    Clear
                  </button>
                )}
              </div>
              {transcript && (
                <p style={{ fontSize: "14px", color: "#334155", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                  {transcript}
                </p>
              )}
              {isRecording && !transcript && (
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontStyle: "italic" }}>Listening...</p>
              )}
              {!isRecording && transcript && (
                <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "10px", marginBottom: 0 }}>
                  ✓ Transcript automatically added to Meeting Notes
                </p>
              )}
            </div>
          )}
          {recError && (
            <div style={{ marginTop: "10px", padding: "10px 14px", background: "#fef2f2", borderRadius: "10px", fontSize: "13px", color: "#dc2626" }}>
              ⚠️ {recError}
            </div>
          )}

          {/* Duration */}
          <div style={{ ...S.card, marginTop: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px" }}>Duration</div>
            <label style={S.label}>Does the brief specify a duration?</label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {[["yes", "Yes, brief specifies it"], ["no", "No, to be scoped"]].map(([val, lbl]) => (
                <div key={val} style={{ ...S.toggleCard(formData.durationKnown === val), flex: "none", padding: "10px 20px" }} onClick={() => setField("durationKnown", val)}>
                  <span style={{ fontWeight: "600", fontSize: "13px", color: formData.durationKnown === val ? "#2563eb" : "#334155" }}>{lbl}</span>
                </div>
              ))}
            </div>

            {formData.durationKnown === "yes" ? (
              <>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <div>
                    <label style={S.label}>Total Days</label>
                    <select
                      value={formData.durationCustom ? "custom" : formData.totalDays}
                      onChange={handleDurationSelect}
                      style={{ ...S.input, maxWidth: 200 }}
                    >
                      <option value="" disabled>Select days</option>
                      {DURATION_DAY_OPTIONS.map(d => (
                        <option key={d} value={d}>{d === "custom" ? "Custom..." : `${d} day${d === "1" ? "" : "s"}`}</option>
                      ))}
                    </select>

                    {formData.durationCustom && (
                      <input
                        name="totalDays"
                        value={formData.totalDays}
                        onChange={handleChange}
                        type="number"
                        min="1"
                        placeholder="Enter number of days"
                        style={{ ...S.input, maxWidth: 200, marginTop: "10px" }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={S.label}>Hours per Day</label>
                    <select
                      name="hoursPerDay"
                      value={formData.hoursPerDay}
                      onChange={handleChange}
                      style={{ ...S.input, maxWidth: 140 }}
                    >
                      {HOURS_PER_DAY_OPTIONS.map(h => (
                        <option key={h} value={h}>{h} hours</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.totalDays && (
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                    Total contact time: {(Number(formData.totalDays) || 0) * (Number(formData.hoursPerDay) || 0)} hours
                  </p>
                )}

                <div style={{ marginTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <label style={{ ...S.label, margin: 0 }}>Phase Breakdown — by calendar month</label>
                    <button onClick={addMonth}
                      style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                      + Add Month
                    </button>
                  </div>

                  {formData.phases.map((phase, mi) => (
                    <div key={mi} style={{ marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                      {/* Month header row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                        <input
                          value={phase.month}
                          onChange={e => updateMonthName(mi, e.target.value)}
                          style={{ ...S.input, padding: "8px 12px", fontSize: "14px", fontWeight: "700", maxWidth: 160, background: "white" }}
                        />
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{phase.sessions.length} session{phase.sessions.length !== 1 ? "s" : ""}</span>
                        <button
                          onClick={() => addSessionToMonth(mi)}
                          style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginLeft: "auto" }}>
                          + Add Day
                        </button>
                        {formData.phases.length > 1 && (
                          <button onClick={() => removeMonth(mi)}
                            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "16px", fontWeight: "700" }}>✕</button>
                        )}
                      </div>

                      {/* Sessions under this month */}
                      {phase.sessions.map((session, si) => (
                        <div key={si} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderBottom: si < phase.sessions.length - 1 ? "1px solid #f1f5f9" : "none", background: "white" }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", minWidth: 50 }}>{session.day}</span>
                          <input
                            value={session.day}
                            onChange={e => updateSession(mi, si, "day", e.target.value)}
                            placeholder="e.g. Day 1"
                            style={{ ...S.input, padding: "8px 12px", fontSize: "13px", maxWidth: 120 }}
                          />
                          <select
                            value={session.mode}
                            onChange={e => updateSession(mi, si, "mode", e.target.value)}
                            style={{ ...S.input, padding: "8px 12px", fontSize: "13px", flex: 1 }}>
                            <option value="">Select delivery mode</option>
                            <option value="On-campus">🏢 On-campus</option>
                            <option value="Live-Virtual">💻 Live-Virtual (Online)</option>
                            <option value="Async">📚 Async (Self-paced)</option>
                            
                          </select>
                          {phase.sessions.length > 1 && (
                            <button onClick={() => removeSession(mi, si)}
                              style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "15px", fontWeight: "700" }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "14px 18px", background: "#fef3c7", borderRadius: "12px", border: "1px solid #fbbf24", fontSize: "13px", color: "#92400e" }}>
                ⚠️ Duration not specified in brief — flagged for scoping. Revisit once budget is confirmed.
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
            <button onClick={handleAnalyse} style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", padding: "16px 28px", borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? "Analysing brief..." : "Analyse Brief"}
            </button>
            <button onClick={handleNext} style={{ background: "#0f172a", color: "white", border: "none", padding: "16px 28px", borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
              Next → {formData.programmeType === "repeat" ? "Architecture" : "Questions"}
            </button>
          </div>

          {error && (
            <p style={{ color: "#dc2626", marginTop: "20px", padding: "12px 16px", background: "#fef2f2", borderRadius: "10px", fontSize: "14px" }}>
              {error}
            </p>
          )}

          {/* BRIEF INTERPRETATION RESULT */}
          {analysis && (
            <div style={{ marginTop: "40px", padding: "32px", background: "#f8fbff", borderRadius: "24px", border: "2px solid #dbe4ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Brief Interpreted Successfully</h2>
                  {analysis.reused && <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "600", display: "block", marginTop: "6px" }}>♻️ Same brief — reused existing opportunity, no new AI cost</span>}
                </div>
                <div style={{ padding: "8px 16px", background: analysis.interpreted?.confidence_score >= 70 ? "#f0fdf4" : "#fef3c7", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>Brief Quality</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: analysis.interpreted?.confidence_score >= 70 ? "#16a34a" : "#d97706" }}>{analysis.interpreted?.confidence_score}/100</div>
                </div>
              </div>

              <div style={{ background: "#e2e8f0", borderRadius: "999px", height: "8px", overflow: "hidden", marginBottom: "24px" }}>
                <div style={{ height: "100%", width: `${analysis.interpreted?.confidence_score}%`, background: analysis.interpreted?.confidence_score >= 70 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: "999px", transition: "width 1s ease" }} />
              </div>

              {renderSection("problem_statement", "📝 Problem Statement / Rationale", "#0f172a")}
              {renderSection("goals", "🎯 Goals", "#2563eb", true)}
              {renderSection("audience", "👥 Audience", "#7c3aed")}
              {renderSection("why_needed", "🤔 Why Do They Need It", "#9333ea")}
              {renderSection("themes", "🏷️ Capability Themes", "#059669", true)}
              {renderSection("constraints", "⚠️ Constraints", "#dc2626", true)}
              {renderSection("pedagogical_posture", "📚 Suggested Approach", "#d97706")}
              {renderSection("suggested_format", "🎬 Suggested Format", "#0891b2")}
              {renderSection("suggested_duration", "📅 Suggested Duration", "#0891b2")}
              {renderSection("suggested_budget", "💰 Suggested Budget", "#0891b2")}

              {analysis.interpreted?.ambiguities?.length > 0 && (
                <div style={{ ...S.aiCard, background: "#fef3c7", border: "1px solid #fbbf24" }}>
                  <h3 style={{ marginBottom: "10px", color: "#92400e", fontSize: "15px", fontWeight: "700" }}>🔍 Ambiguities — Confirm in Discovery Call</h3>
                  <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {analysis.interpreted.ambiguities.map((a, i) => <li key={i} style={{ marginBottom: "6px", color: "#78350f", fontSize: "14px" }}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: "24px", padding: "20px 24px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "white", fontWeight: "700", fontSize: "16px", margin: 0 }}>
                  Brief interpreted! Ready to {formData.programmeType === "repeat" ? "build Architecture" : "generate Discovery Questions"}.
                </p>
                <button onClick={handleNext} style={{ background: "white", color: "#2563eb", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  {formData.programmeType === "repeat" ? "Go to Architecture →" : "Generate Questions →"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}