import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: "📊",
    },
    {
      name: "New Opportunity",
      path: "/new",
      icon: "📄",
    },
    {
      name: "Decision Questions",
      path: "/questions",
      icon: "❓",
    },
    {
      name: "Competency Mapping",
      path: "/mapping",
      icon: "🧠",
    },
    {
      name: "Architecture Builder",
      path: "/architecture",
      icon: "🏗️",
    },
  ];

  return (

    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "white",
        borderRight: "1px solid #dbe2ea",
        position: "fixed",
        left: 0,
        top: 0,
        padding: "30px 20px",
        boxSizing: "border-box",
      }}
    >

      {/* LOGO */}

      <div
        style={{
          marginBottom: "50px",
        }}
      >

        <h1
          style={{
            fontSize: "38px",
            lineHeight: "1.2",
            color: "#2563eb",
            fontWeight: "800",
            margin: 0,
          }}
        >
          🚀 Proposal
          <br />
          Intelligence
        </h1>

      </div>



      {/* MENU */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >

        {menuItems.map((item, index) => {

          const active =
            location.pathname === item.path;

          return (

            <button
              key={index}
              onClick={() => navigate(item.path)}
              style={{
                border: "none",
                padding: "18px",
                borderRadius: "16px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "17px",
                fontWeight: "700",
                background: active
                  ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                  : "white",
                color: active ? "white" : "#0f172a",
                boxShadow: active
                  ? "0 10px 25px rgba(37,99,235,0.25)"
                  : "none",
              }}
            >
              {item.icon} {item.name}
            </button>

          );

        })}

      </div>

    </div>

  );

}