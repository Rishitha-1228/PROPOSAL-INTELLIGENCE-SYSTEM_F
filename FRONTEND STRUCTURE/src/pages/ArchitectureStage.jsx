import React from "react";
import { useNavigate } from "react-router-dom";

export default function ArchitectureStage() {

  const navigate = useNavigate();

  const phases = [
    {
      title: "Pre-Work",
      duration: "4 Hours",

      modules: [
        {
          name: "Discovery Survey",
          faculty: "Prof. Rao",
        },

        {
          name: "Stakeholder Interviews",
          faculty: "Dr. Mehta",
        },

        {
          name: "Pre-reading Material",
          faculty: "Prof. Sharma",
        },
      ],
    },

    {
      title: "Day 1",
      duration: "8 Hours",

      modules: [
        {
          name: "Leadership Foundations",
          faculty: "Prof. Rao",
        },

        {
          name: "Strategic Thinking",
          faculty: "Dr. Kapoor",
        },

        {
          name: "Innovation Workshop",
          faculty: "Dr. Khan",
        },
      ],
    },

    {
      title: "Day 2",
      duration: "8 Hours",

      modules: [
        {
          name: "Decision Making",
          faculty: "Prof. Sharma",
        },

        {
          name: "Collaboration Lab",
          faculty: "Dr. Patel",
        },

        {
          name: "Executive Coaching",
          faculty: "Prof. Iyer",
        },
      ],
    },

    {
      title: "Day 3",
      duration: "6 Hours",

      modules: [
        {
          name: "Capstone Simulation",
          faculty: "Dr. Kapoor",
        },

        {
          name: "Action Planning",
          faculty: "Prof. Rao",
        },
      ],
    },
  ];

  return (

    <div
      style={{
        display: "flex",
        background: "#f1f5f9",
        minHeight: "100vh",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "250px",
          background: "white",
          padding: "30px 20px",
          borderRight: "1px solid #dbeafe",
        }}
      >

        <h2
          style={{
            color: "#2563eb",
            fontSize: "34px",
            fontWeight: "800",
            marginBottom: "40px",
          }}
        >
          Proposal AI
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >

          <button
            className="sideBtn"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            className="sideBtn"
            onClick={() => navigate("/new")}
          >
            New Opportunity
          </button>

          <button
            className="sideBtn"
            onClick={() => navigate("/questions")}
          >
            Decision Questions
          </button>

          <button
            className="sideBtn"
            onClick={() => navigate("/mapping")}
          >
            Competency Mapping
          </button>

          <button
            className="activeBtn"
          >
            Programme Architecture
          </button>

          <button
            className="sideBtn"
            onClick={() => navigate("/approach")}
          >
            Approach Note
          </button>

          <button
            className="sideBtn"
            onClick={() => navigate("/score")}
          >
            Proposal Score
          </button>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div
        style={{
          flex: 1,
          padding: "30px",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "24px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >

          <div>

            <p
              style={{
                color: "#64748b",
                marginBottom: "10px",
              }}
            >
              Opportunities {" > "}
              Leadership Programme {" > "}
              Architecture
            </p>

            <h1
              style={{
                fontSize: "52px",
                color: "#0f172a",
                margin: 0,
              }}
            >
              Programme Architecture
            </h1>

          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >

            <button
              className="topBtn"
              onClick={() =>
                alert(
                  "Architecture Validated Successfully!"
                )
              }
            >
              Validate
            </button>

            <button
              className="topBtn"
              onClick={() =>
                alert("Exporting PDF...")
              }
            >
              Export PDF
            </button>

            <button
              className="saveBtn"
              onClick={() =>
                navigate("/approach")
              }
            >
              Save & Continue
            </button>

          </div>

        </div>

        {/* STATS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "20px",
            marginBottom: "24px",
          }}
        >

          <div className="statCard">
            <h3>Total Days</h3>
            <h1>5</h1>
          </div>

          <div className="statCard">
            <h3>Total Modules</h3>
            <h1>14</h1>
          </div>

          <div className="statCard">
            <h3>Faculty</h3>
            <h1>6</h1>
          </div>

          <div className="statCard">
            <h3>AI Confidence</h3>
            <h1>92%</h1>
          </div>

        </div>

        {/* BODY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "3fr 1fr",
            gap: "24px",
          }}
        >

          {/* LEFT */}

          <div>

            {phases.map((phase, index) => (

              <div
                key={index}
                className="phaseCard"
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >

                  <h2>{phase.title}</h2>

                  <span className="phaseBadge">
                    {phase.duration}
                  </span>

                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >

                  {phase.modules.map(
                    (module, idx) => (

                      <div
                        key={idx}
                        className="moduleCard"
                      >

                        <div>

                          <h3>
                            {module.name}
                          </h3>

                          <p>
                            Faculty:
                            {" "}
                            {module.faculty}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            alert(
                              `Editing ${module.name}`
                            )
                          }
                        >
                          Edit
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

            ))}

          </div>

          {/* RIGHT PANEL */}

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >

            {/* TEMPLATE */}

            <div className="rightCard">

              <h2>Templates</h2>

              <div
                className="templateBtn"
                onClick={() =>
                  alert(
                    "3-Day Intensive Applied"
                  )
                }
              >
                3-Day Intensive
              </div>

              <div
                className="templateBtn"
                onClick={() =>
                  alert(
                    "5-Day Leadership Applied"
                  )
                }
              >
                5-Day Leadership
              </div>

              <div
                className="templateBtn"
                onClick={() =>
                  alert(
                    "Hybrid Sprint Applied"
                  )
                }
              >
                Hybrid Sprint
              </div>

            </div>

            {/* VALIDATION */}

            <div className="rightCard">

              <h2>Validation</h2>

              <p className="warning">
                ⚠ Reflection time needed
              </p>

              <p className="warning">
                ⚠ Faculty overlap detected
              </p>

              <p className="success">
                ✓ Capstone added
              </p>

            </div>

            {/* AI SUGGESTIONS */}

            <div className="rightCard">

              <h2>AI Suggestions</h2>

              <p>
                Add peer coaching on
                Day 2.
              </p>

              <p>
                Increase innovation
                simulation coverage.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* CSS */}

      <style>{`

        .sideBtn{
          background:white;
          border:none;
          padding:15px;
          border-radius:14px;
          text-align:left;
          cursor:pointer;
          font-weight:700;
          transition:0.3s;
        }

        .sideBtn:hover{
          background:#eff6ff;
        }

        .activeBtn{
          background:linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );
          color:white;
          border:none;
          padding:15px;
          border-radius:14px;
          text-align:left;
          font-weight:700;
          cursor:pointer;
          box-shadow:
            0 10px 20px
            rgba(37,99,235,0.25);
        }

        .topBtn{
          background:white;
          border:1px solid #dbeafe;
          padding:12px 18px;
          border-radius:12px;
          cursor:pointer;
          font-weight:700;
        }

        .saveBtn{
          background:linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );
          color:white;
          border:none;
          padding:12px 22px;
          border-radius:12px;
          cursor:pointer;
          font-weight:700;
        }

        .statCard{
          background:white;
          padding:24px;
          border-radius:20px;
        }

        .statCard h3{
          color:#64748b;
          margin-bottom:10px;
        }

        .statCard h1{
          color:#2563eb;
          font-size:52px;
        }

        .phaseCard{
          background:white;
          padding:24px;
          border-radius:24px;
          margin-bottom:24px;
        }

        .phaseBadge{
          background:#dbeafe;
          color:#2563eb;
          padding:8px 16px;
          border-radius:999px;
          font-weight:700;
        }

        .moduleCard{
          background:#f8fafc;
          border:1px solid #dbeafe;
          padding:18px;
          border-radius:18px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .moduleCard p{
          color:#64748b;
          margin-top:6px;
        }

        .moduleCard button{
          background:#2563eb;
          color:white;
          border:none;
          padding:10px 18px;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }

        .rightCard{
          background:white;
          padding:24px;
          border-radius:24px;
        }

        .rightCard h2{
          margin-bottom:20px;
        }

        .templateBtn{
          background:#f8fafc;
          border:1px solid #dbeafe;
          padding:14px;
          border-radius:14px;
          margin-bottom:12px;
          cursor:pointer;
          font-weight:700;
        }

        .templateBtn:hover{
          background:#eff6ff;
        }

        .warning{
          color:#f59e0b;
          margin-bottom:10px;
        }

        .success{
          color:#10b981;
        }

      `}</style>

    </div>

  );
}