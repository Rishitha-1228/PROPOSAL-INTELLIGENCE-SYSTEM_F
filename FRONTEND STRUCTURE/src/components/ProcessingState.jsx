import { useState, useEffect, useRef } from "react";

/**
 * Professional document-processing indicator.
 * Reads as "your document is being prepared", never as "AI is thinking".
 *
 * Props:
 *  - steps: array of step labels
 *  - estimate: string, e.g. "Usually takes 10-15 seconds"
 *  - done: boolean — optional, pass true once the real response has arrived
 */
export default function ProcessingState({ steps, estimate, done = false }) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(4);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      if (!mounted.current) return;
      setActiveStep((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
    }, 1500);

    const progressInterval = setInterval(() => {
      if (!mounted.current) return;
      setProgress((prev) => (prev < 90 ? prev + (90 - prev) * 0.07 : prev));
    }, 180);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  useEffect(() => {
    if (done) {
      setActiveStep(steps.length);
      setProgress(100);
    }
  }, [done, steps.length]);

  return (
    <div style={cardWrap}>
      <div style={cardInner}>

        <div style={iconWrap}>
          <div style={iconRing} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: "relative", zIndex: 1 }}>
            <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M14 3v4h4" stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 13h6M9 16.5h4" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>

        <p style={headline}>Preparing your document</p>

        <div style={barOuter}>
          <div style={{ ...barInner, width: `${progress}%` }} />
        </div>
        <p style={pctLabel}>{Math.round(progress)}%</p>

        <div style={stepList}>
          {steps.map((label, i) => {
            const stepDone = i < activeStep;
            const current = i === activeStep && !stepDone;
            return (
              <div key={i} style={{ ...stepRow, opacity: stepDone || current ? 1 : 0.4 }}>
                <div style={{
                  ...bullet,
                  background: stepDone ? "#16a34a" : current ? "#2563eb" : "#cbd5e1"
                }}>
                  {stepDone && (
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {current && <div style={innerPulse} />}
                </div>

                <span style={{
                  ...stepLabel,
                  fontWeight: current ? 600 : 500,
                  color: current ? "#0f172a" : stepDone ? "#475569" : "#94a3b8"
                }}>
                  {label}
                  {current && (
                    <span style={dotRow}>
                      <span style={{ ...dot, animationDelay: "0s" }} />
                      <span style={{ ...dot, animationDelay: "0.18s" }} />
                      <span style={{ ...dot, animationDelay: "0.36s" }} />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {estimate && <p style={estimateText}>{estimate}</p>}
      </div>

      <style>{`
        @keyframes psBreathe {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.18); opacity: 0.12; }
        }
        @keyframes psInnerPulse {
          0%, 100% { transform: scale(0.75); opacity: 0.7; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes psDotFade {
          0%, 100% { opacity: 0.15; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
}

const cardWrap = { display: "flex", justifyContent: "center", padding: "28px 0" };
const cardInner = {
  width: "100%", maxWidth: "420px", background: "#ffffff",
  border: "1px solid #e8edf5", borderRadius: "20px", padding: "36px 32px",
  boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)",
  textAlign: "center"
};
const iconWrap = { width: "52px", height: "52px", margin: "0 auto 18px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" };
const iconRing = { position: "absolute", inset: 0, borderRadius: "50%", background: "#dbeafe", animation: "psBreathe 2.2s ease-in-out infinite" };
const headline = { fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "18px" };
const barOuter = { height: "4px", background: "#eef1f6", borderRadius: "10px", overflow: "hidden", marginBottom: "6px" };
const barInner = { height: "100%", background: "linear-gradient(90deg,#2563eb,#4f46e5)", borderRadius: "10px", transition: "width 0.35s ease" };
const pctLabel = { fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "22px", textAlign: "right" };
const stepList = { textAlign: "left" };
const stepRow = { display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", transition: "opacity 0.4s ease" };
const bullet = { width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease", position: "relative" };
const innerPulse = { width: "6px", height: "6px", borderRadius: "50%", background: "white", animation: "psInnerPulse 1s ease-in-out infinite" };
const stepLabel = { fontSize: "13.5px", display: "inline-flex", alignItems: "baseline" };
const dotRow = { display: "inline-flex", marginLeft: "4px", gap: "2px" };
const dot = { width: "3px", height: "3px", borderRadius: "50%", background: "#2563eb", display: "inline-block", animation: "psDotFade 1.1s ease-in-out infinite" };
const estimateText = { fontSize: "11.5px", color: "#b0b8c4", marginTop: "20px" };