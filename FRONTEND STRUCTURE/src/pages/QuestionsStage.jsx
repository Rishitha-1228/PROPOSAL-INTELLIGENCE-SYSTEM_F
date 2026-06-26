import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateQuestions, resolveAnswer, updateQuestionAnswer } from "../services/api";

// One framework tag per THEME (e.g. all "Business Context & Strategy" questions
// share one framework). Labeling only — no AI involved.
const FRAMEWORK_OPTIONS = [
  "Porter's Five Forces",
  "SWOT Analysis",
  "Balanced Scorecard",
  "McKinsey 7S",
  "Kirkpatrick's 4 Levels",
  "ADDIE Model",
  "70:20:10 Learning Model",
  "Business Model Canvas",
  "GROW Coaching Model",
  "Other / Custom"
];

export default function QuestionsStage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  // Track per-question async state: { [index]: { resolving: mode|null, notice: string|null } }
  const [rowState, setRowState] = useState({});

  // ── Per-theme framework tags: { BCS: "SWOT Analysis", DEC: "McKinsey 7S", ... } ──
  const [themeFrameworks, setThemeFrameworks] = useState({});
  const [openThemeDropdown, setOpenThemeDropdown] = useState(null); // which theme's dropdown is open

  const opportunityId = localStorage.getItem("pis_opportunity_id");
  const frameworkStorageKey = `pis_theme_frameworks_${opportunityId}`;
  const questionsStorageKey = `pis_questions_${opportunityId}`;

  useEffect(() => {
    if (!opportunityId) { navigate("/new"); return; }

    // ── Show cached questions INSTANTLY if we have them, so the page never
    // flashes "No questions yet" while waiting on the network. ──
    let hadCache = false;
    try {
      const cached = localStorage.getItem(questionsStorageKey);
      if (cached) {
        const parsedQuestions = JSON.parse(cached);
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          hadCache = true;
        }
      }
    } catch {
      // ignore malformed cache, fall through to network load
    }

    // Always still confirm against the server in the background — this picks
    // up newer answers/resolves from other tabs/devices and self-heals if the
    // cache was ever stale, but it no longer causes a blank flash.
    loadQuestions(hadCache);

    // Restore any framework tags previously set for this opportunity
    try {
      const saved = localStorage.getItem(frameworkStorageKey);
      if (saved) setThemeFrameworks(JSON.parse(saved));
    } catch {
      // ignore malformed storage, just start fresh
    }
  }, []);

  const loadQuestions = async (hadCache = false) => {
    // Only show the big loading spinner if we have nothing on screen yet —
    // if cached questions are already showing, refresh quietly in the background.
    if (!hadCache) setLoading(true);
    setError("");
    try {
      const data = await generateQuestions(opportunityId);
      const flat = data.questions_by_theme
        ? Object.values(data.questions_by_theme).flat()
        : data.data || [];

      if (flat.length === 0) {
        if (!hadCache) {
          // The call succeeded but returned no questions, and we had no cache
          // to fall back on — this usually means brief interpretation hasn't
          // run yet for this opportunity, or the ID in storage is stale.
          setError("This opportunity has no questions yet and none could be generated. Try going back to New Opportunity and re-analysing the brief.");
        }
        // If we DID have cache, keep showing it rather than wiping the screen —
        // a transient/empty server response should never erase visible work.
      } else {
        setQuestions(flat);
        try {
          localStorage.setItem(questionsStorageKey, JSON.stringify(flat));
        } catch {
          // storage full or unavailable — page still works for this session
        }
      }
    } catch (err) {
      // If we had cached questions already on screen, a failed background
      // refresh shouldn't blank the page — just surface a quiet warning.
      if (!hadCache) {
        setError(err?.response?.data?.error || "Failed to load questions");
      } else {
        console.error("Background refresh failed, keeping cached questions:", err);
      }
    }
    setLoading(false);
  };

  const setRow = (index, patch) => {
    setRowState((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } }));
  };

  // Extracts the clearest possible message from any axios error
  const describeError = (err) => {
    if (err?.response?.data?.error) return err.response.data.error;
    if (err?.response?.status) return `Server returned ${err.response.status}`;
    if (err?.message === "Network Error") return "Could not reach the backend — check it's running and reachable.";
    return err?.message || "Something went wrong";
  };

  // ── Option 1 / 2 / 3 handler ───────────────────
  const handleResolve = async (question, index, mode) => {
    setRow(index, { resolving: mode, notice: null });
    try {
      const res = await resolveAnswer(opportunityId, index, mode);

      if (mode === "from_brief" && res.found === false) {
        setRow(index, { resolving: null, notice: res.message || "Brief does not clearly answer this question." });
        return;
      }

      setQuestions((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...res.question };
        try {
          localStorage.setItem(questionsStorageKey, JSON.stringify(next));
        } catch {
          // storage full or unavailable — in-memory state still updates fine
        }
        return next;
      });
      setRow(index, { resolving: null, notice: null });
    } catch (err) {
      console.error("Resolve failed:", err);
      setRow(index, { resolving: null, notice: describeError(err) });
    }
  };

  // Manual textarea edit
  const handleManualEdit = (index, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], answer_text: value };
      try {
        localStorage.setItem(questionsStorageKey, JSON.stringify(next));
      } catch {
        // storage full or unavailable — in-memory state still updates fine
      }
      return next;
    });
  };

  const handleManualEditBlur = async (index) => {
    try {
      await updateQuestionAnswer(opportunityId, index, questions[index].answer_text || "");
    } catch (err) {
      console.error("Failed to save answer:", describeError(err));
    }
  };

  // ── Per-theme Framework tag: applies to every question under that theme ──
  const handleThemeFrameworkSelect = (theme, framework) => {
    const updated = { ...themeFrameworks, [theme]: framework };
    if (framework === null) delete updated[theme];
    setThemeFrameworks(updated);
    setOpenThemeDropdown(null);
    try {
      localStorage.setItem(frameworkStorageKey, JSON.stringify(updated));
    } catch {
      // storage full or unavailable — tag still works for this session
    }
  };

  // Group by theme
  const grouped = questions.reduce((acc, q) => {
    const theme = q.theme_code || "OTHER";
    if (!acc[theme]) acc[theme] = [];
    acc[theme].push(q);
    return acc;
  }, {});

  const indexOf = (q) => questions.indexOf(q);

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

  const SOURCE_LABEL = {
    from_brief:        { text: " Found in brief",     color: "#16a34a", bg: "#f0fdf4" },
    flagged_to_client: { text: " Flagged to client",   color: "#b45309", bg: "#fffbeb" },
    draft_assumption:  { text: " Draft assumption",    color: "#7c3aed", bg: "#f5f3ff" }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2ff", fontFamily: "Inter, sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "white", borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "35px 25px" }}>
          <h1 style={{ color: "#2563eb", fontSize: "28px", fontWeight: "800" }}> Proposal<br />Intelligence</h1>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={menuStyle} onClick={() => navigate("/new")}> New Opportunity</div>
          <div style={menuActive}> Questions</div>
          <div style={menuStyle} onClick={() => navigate("/mapping")}> Competency Mapping</div>
          <div style={menuStyle} onClick={() => navigate("/architecture")}> Architecture</div>
          <div style={menuStyle} onClick={() => navigate("/approach")}> Approach Note</div>
          <div style={menuStyle} onClick={() => navigate("/score")}> Proposal Score</div>
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
              {liveMode ? " Live Mode ON" : " Live Mode OFF"}
            </button>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontSize: "18px" }}>Hold On... Generating questions </div>}
          {error && <div style={{ color: "red", padding: "20px", background: "#fef2f2", borderRadius: "12px", marginBottom: "20px" }}> {error}</div>}

          {!loading && questions.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>No questions yet</p>
              <button onClick={loadQuestions} style={{ padding: "14px 28px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
                Generate Questions 
              </button>
            </div>
          )}

          {Object.entries(grouped).map(([theme, qs]) => {
            const themeFramework = themeFrameworks[theme];
            const dropdownOpen = openThemeDropdown === theme;

            return (
              <div key={theme} style={{ marginBottom: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 14px", background: THEME_COLORS[theme] || "#f1f5f9", borderRadius: "8px", fontSize: "13px", fontWeight: "500", color: "#334155" }}>{theme}</span>
                  <span style={{ fontSize: "16px", fontWeight: "500", color: "#0f172a" }}>{THEME_NAMES[theme] || theme}</span>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>{qs.length} questions</span>

                  {/* ── Per-theme Framework badge (shown only once a framework is set) — large, clear, client-readable ── */}
                  {themeFramework && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "9px 18px", background: "#f5f3ff", color: "#5b21b6",
                      borderRadius: "10px", fontSize: "16px", fontWeight: "600",
                      border: "1.5px solid #ddd6fe"
                    }}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.611 1.611c-.47.47-1.087.706-1.704.706s-1.233-.235-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.611-1.611A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>
                      </svg>
                      <span style={{ fontWeight: "400", color: "#7c5cd9" }}>Framework:</span>
                      {themeFramework}
                    </span>
                  )}

                  <div style={{ position: "relative", marginLeft: "auto" }}>
                    <button
                      onClick={() => setOpenThemeDropdown(dropdownOpen ? null : theme)}
                      aria-label="Set framework for this theme"
                      title="Set framework"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "36px", height: "36px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: dropdownOpen ? "#f1f5f9" : "white",
                        color: "#64748b",
                        cursor: "pointer"
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.611 1.611c-.47.47-1.087.706-1.704.706s-1.233-.235-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.611-1.611A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 20,
                        background: "white", border: "1px solid #e2e8f0", borderRadius: "10px",
                        boxShadow: "0 10px 28px rgba(15,23,42,0.12)", width: "230px", padding: "6px",
                        maxHeight: "280px", overflowY: "auto"
                      }}>
                        <div style={{ padding: "6px 10px 8px", fontSize: "11px", fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Framework for {THEME_NAMES[theme] || theme}
                        </div>
                        {FRAMEWORK_OPTIONS.map((fw) => {
                          const selected = fw === themeFramework;
                          return (
                            <div
                              key={fw}
                              onClick={() => handleThemeFrameworkSelect(theme, fw)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "8px 10px", borderRadius: "6px", fontSize: "13.5px",
                                color: selected ? "#5b21b6" : "#334155",
                                background: selected ? "#f5f3ff" : "transparent",
                                fontWeight: selected ? "500" : "400",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#f8fafc"; }}
                              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                            >
                              {fw}
                              {selected && <span style={{ fontSize: "12px" }}>✓</span>}
                            </div>
                          );
                        })}
                        {themeFramework && (
                          <div
                            onClick={() => handleThemeFrameworkSelect(theme, null)}
                            style={{ padding: "8px 10px", borderRadius: "6px", fontSize: "13.5px", color: "#dc2626", cursor: "pointer", borderTop: "1px solid #f1f5f9", marginTop: "4px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            Remove framework
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {qs.map((q) => {
                  const index = indexOf(q);
                  const rs = rowState[index] || {};
                  const sourceTag = SOURCE_LABEL[q.answer_source];

                  return (
                    <div key={index} style={{ background: "#f8fafc", borderRadius: "16px", padding: "20px", marginBottom: "12px", border: "1px solid #e2e8f0" }}>

                      <p style={{ fontWeight: "600", color: "#0f172a", marginBottom: "14px", fontSize: "15px" }}>{q.question_text}</p>

                      {/* ── 3-option answer resolver ── */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <button
                          disabled={!!rs.resolving}
                          onClick={() => handleResolve(q, index, "from_brief")}
                          style={optionBtnStyle(q.answer_source === "from_brief")}
                        >
                          {rs.resolving === "from_brief" ? "Checking brief..." : " Found in client requirement"}
                        </button>
                        <button
                          disabled={!!rs.resolving}
                          onClick={() => handleResolve(q, index, "flagged_to_client")}
                          style={optionBtnStyle(q.answer_source === "flagged_to_client")}
                        >
                          Not found — flag to client
                        </button>
                        <button
                          disabled={!!rs.resolving}
                          onClick={() => handleResolve(q, index, "draft_assumption")}
                          style={optionBtnStyle(q.answer_source === "draft_assumption")}
                        >
                          {rs.resolving === "draft_assumption" ? "Drafting..." : " First-draft assumption"}
                        </button>
                      </div>

                      {rs.notice && (
                        <div style={{ fontSize: "12px", color: "#b45309", background: "#fffbeb", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px" }}>
                           {rs.notice}
                        </div>
                      )}

                      {sourceTag && (
                        <span style={{ display: "inline-block", fontSize: "11px", fontWeight: "700", color: sourceTag.color, background: sourceTag.bg, padding: "3px 10px", borderRadius: "20px", marginBottom: "8px" }}>
                          {sourceTag.text}
                        </span>
                      )}

                      <textarea
                        value={q.answer_text || ""}
                        onChange={(e) => handleManualEdit(index, e.target.value)}
                        onBlur={() => handleManualEditBlur(index)}
                        placeholder="Answer will appear here once resolved — or type it manually..."
                        rows={2}
                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", marginTop: "4px", resize: "vertical", fontFamily: "inherit" }}
                      />

                      {liveMode && (
                        <textarea
                          placeholder="Live call notes — type client answer here as they speak..."
                          rows={2}
                          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", marginTop: "8px", resize: "vertical", fontFamily: "inherit", background: "#fefce8" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

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

const optionBtnStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: "10px",
  border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
  background: active ? "#2563eb" : "white",
  color: active ? "white" : "#334155",
  fontWeight: "600",
  fontSize: "12.5px",
  cursor: "pointer",
  whiteSpace: "nowrap"
});

const menuStyle = { padding: "14px 16px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", fontWeight: "600", color: "#475569", fontSize: "15px" };
const menuActive = { padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", marginBottom: "10px", fontWeight: "700", fontSize: "15px" };
