import React from "react";
import { useNavigate } from "react-router-dom";

export default function FacultyDashboard() {

  const navigate = useNavigate();

  const reviews = [

    {
      programme: "AI Leadership Programme",
      company: "Acme IT Services",
      module: "Commercial Strategy in Disruption",
      issue: "Current case study outdated",
      suggestion: "Use Bayer AI Transformation Case",
      status: "Pending Review",
    },

    {
      programme: "Executive Growth Sprint",
      company: "Reliance Digital",
      module: "Innovation Leadership",
      issue: "Needs more action learning",
      suggestion: "Add simulation workshop",
      status: "Architecture Review",
    },

  ];

  return (

    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f1f5f9",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "260px",
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
          Faculty Portal
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >

          <button
            className="activeBtn"
            onClick={() =>
              navigate("/faculty-dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              alert("Opening Review Queue")
            }
          >
            Review Queue
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              alert("Opening Assigned Modules")
            }
          >
            Assigned Modules
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              navigate("/architecture")
            }
          >
            Architecture Reviews
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              alert("Opening Faculty Comments")
            }
          >
            Faculty Comments
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              alert("Opening Materials")
            }
          >
            Materials
          </button>

          <button
            className="sideBtn"
            onClick={() =>
              alert("Opening Analytics")
            }
          >
            Analytics
          </button>

          <button
            className="logoutBtn"
            onClick={() => navigate("/")}
          >
            Logout
          </button>

        </div>

      </div>

      {/* MAIN */}

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
            padding: "28px",
            borderRadius: "24px",
            marginBottom: "24px",
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
              Welcome Back 👋
            </p>

            <h1
              style={{
                fontSize: "48px",
                margin: 0,
                color: "#0f172a",
              }}
            >
              Professor Review Dashboard
            </h1>

          </div>

          <button
            className="aiBtn"
            onClick={() => {
              alert(
                "AI Assistant Opened Successfully"
              );
            }}
          >
            Open AI Assistant
          </button>

        </div>

        {/* STATS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "20px",
            marginBottom: "24px",
          }}
        >

          <div className="statCard">
            <h3>Pending Reviews</h3>
            <h1>2</h1>
          </div>

          <div className="statCard">
            <h3>Modules Assigned</h3>
            <h1>8</h1>
          </div>

          <div className="statCard">
            <h3>Proposal Wins</h3>
            <h1>14</h1>
          </div>

          <div className="statCard">
            <h3>Faculty Rating</h3>
            <h1>4.9</h1>
          </div>

        </div>

        {/* BODY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            gap: "24px",
          }}
        >

          {/* LEFT */}

          <div>

            <div className="sectionCard">

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >

                <h2>
                  Review Queue
                </h2>

                <button
                  className="smallBtn"
                  onClick={() =>
                    alert("Viewing All Reviews")
                  }
                >
                  View All
                </button>

              </div>

              <div
                style={{
                  display: "grid",
                  gap: "20px",
                }}
              >

                {reviews.map(
                  (review, index) => (

                    <div
                      key={index}
                      className="reviewCard"
                    >

                      <div>

                        <h2>
                          {review.programme}
                        </h2>

                        <p>
                          🏢 {review.company}
                        </p>

                        <p>
                          📘 {review.module}
                        </p>

                        <p>
                          ⚠ {review.issue}
                        </p>

                        <div className="suggestionBox">
                          💡 {review.suggestion}
                        </div>

                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          alignItems: "flex-end",
                        }}
                      >

                        <span
                          className="statusBadge"
                        >
                          {review.status}
                        </span>

                        <button
                          className="approveBtn"
                          onClick={() => {
                            alert("Proposal Approved");
                          }}
                        >
                          Approve
                        </button>

                        <button
                          className="commentBtn"
                          onClick={() => {
                            alert("Opening Comment Panel");
                          }}
                        >
                          Add Comment
                        </button>

                        <button
                          className="rejectBtn"
                          onClick={() => {
                            alert("Changes Request Sent");
                          }}
                        >
                          Request Changes
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* COMMENTS */}

            <div
              className="sectionCard"
              style={{
                marginTop: "24px",
              }}
            >

              <h2
                style={{
                  marginBottom: "20px",
                }}
              >
                Recent Faculty Comments
              </h2>

              <div className="commentBox">
                "Use Bayer AI Transformation
                Case instead of McKinsey example."
              </div>

              <div className="commentBox">
                "Programme should be stronger
                on action learning."
              </div>

              <div className="commentBox">
                "Move difficult case study to
                Day 4."
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >

            <div className="rightCard">

              <h2>
                Faculty Expertise
              </h2>

              <div className="tag">
                AI Strategy
              </div>

              <div className="tag">
                Leadership
              </div>

              <div className="tag">
                Innovation
              </div>

              <div className="tag">
                Scenario Planning
              </div>

            </div>

            <div className="rightCard">

              <h2>
                Proposal Contribution
              </h2>

              <p>
                Total Proposals: 28
              </p>

              <p>
                Proposal Wins: 14
              </p>

              <p>
                Win Rate: 54%
              </p>

            </div>

            <div className="rightCard">

              <h2>
                AI Suggestions
              </h2>

              <p>
                Add more peer learning activities.
              </p>

              <p>
                Reflection module missing on Day 3.
              </p>

              <p>
                Cognitive load high on Day 2.
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
          font-weight:700;
          cursor:pointer;
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
        }

        .logoutBtn{
          background:#ef4444;
          color:white;
          border:none;
          padding:15px;
          border-radius:14px;
          font-weight:700;
          cursor:pointer;
          margin-top:20px;
        }

        .aiBtn{
          background:linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );
          color:white;
          border:none;
          padding:14px 24px;
          border-radius:14px;
          font-weight:700;
          cursor:pointer;
        }

        .statCard{
          background:white;
          padding:24px;
          border-radius:20px;
        }

        .statCard h3{
          color:#64748b;
        }

        .statCard h1{
          color:#2563eb;
          font-size:48px;
        }

        .sectionCard{
          background:white;
          padding:24px;
          border-radius:24px;
        }

        .smallBtn{
          background:#2563eb;
          color:white;
          border:none;
          padding:10px 16px;
          border-radius:10px;
          cursor:pointer;
        }

        .reviewCard{
          background:#f8fafc;
          border:1px solid #dbeafe;
          padding:22px;
          border-radius:20px;
          display:flex;
          justify-content:space-between;
        }

        .reviewCard p{
          color:#64748b;
          margin-top:8px;
        }

        .suggestionBox{
          background:#dbeafe;
          padding:14px;
          border-radius:12px;
          margin-top:14px;
          color:#2563eb;
          font-weight:600;
        }

        .statusBadge{
          background:#dbeafe;
          color:#2563eb;
          padding:8px 16px;
          border-radius:999px;
          font-weight:700;
        }

        .approveBtn{
          background:#10b981;
          color:white;
          border:none;
          padding:10px 16px;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }

        .commentBtn{
          background:#2563eb;
          color:white;
          border:none;
          padding:10px 16px;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }

        .rejectBtn{
          background:#ef4444;
          color:white;
          border:none;
          padding:10px 16px;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }

        .commentBox{
          background:#f8fafc;
          border:1px solid #dbeafe;
          padding:18px;
          border-radius:14px;
          margin-bottom:14px;
          line-height:1.7;
        }

        .rightCard{
          background:white;
          padding:24px;
          border-radius:24px;
        }

        .rightCard h2{
          margin-bottom:20px;
        }

        .rightCard p{
          color:#64748b;
          margin-bottom:12px;
        }

        .tag{
          background:#dbeafe;
          color:#2563eb;
          padding:10px 14px;
          border-radius:999px;
          display:inline-block;
          margin-right:10px;
          margin-bottom:10px;
          font-weight:700;
        }

      `}</style>

    </div>

  );
}