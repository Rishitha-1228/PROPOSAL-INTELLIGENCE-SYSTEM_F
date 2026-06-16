import { useNavigate } from "react-router-dom";

export default function RoleSelection() {

  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f5f9",
      }}
    >

      <div
        style={{
          display: "flex",
          gap: "40px",
        }}
      >

        {/* BD MANAGER */}

        <div
          onClick={() => navigate("/login/bd")}
          style={{
            width: "340px",
            background: "white",
            padding: "40px",
            borderRadius: "24px",
            cursor: "pointer",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >

          <h1>💼</h1>

          <h2>BD Manager</h2>

          <p>
            Opportunity creation,
            AI analysis,
            proposal workflow
          </p>

        </div>

        {/* FACULTY */}

        <div
          onClick={() => navigate("/login/faculty")}
          style={{
            width: "340px",
            background: "white",
            padding: "40px",
            borderRadius: "24px",
            cursor: "pointer",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >

          <h1>🎓</h1>

          <h2>Faculty</h2>

          <p>
            Programme delivery,
            sessions,
            faculty dashboard
          </p>

        </div>

      </div>

    </div>
  );
}