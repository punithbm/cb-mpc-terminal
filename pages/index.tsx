import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const HomePage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const terminalCards = [
    { id: "0", title: "Party 0", description: "Individual terminal for Party 0" },
    { id: "1", title: "Party 1", description: "Individual terminal for Party 1" },
    { id: "2", title: "Party 2", description: "Individual terminal for Party 2" },
    { id: "3", title: "Party 3", description: "Individual terminal for Party 3" },
  ];

  const cardStyle = (cardId: string) => ({
    backgroundColor: hoveredCard === cardId ? "#21262d" : "#161b22",
    border: `1px solid ${hoveredCard === cardId ? "#58a6ff" : "#30363d"}`,
    borderRadius: "8px",
    padding: "16px", // Reduced padding for mobile
    textDecoration: "none",
    color: "#e6edf3",
    display: "block",
    transition: "all 0.2s ease",
    cursor: "pointer",
    transform: hoveredCard === cardId ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hoveredCard === cardId ? "0 8px 25px rgba(88, 166, 255, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.2)",
  });

  const dashboardCardStyle = {
    backgroundColor: hoveredCard === "dashboard" ? "#1a472a" : "#0d2818",
    border: `2px solid ${hoveredCard === "dashboard" ? "#7ee787" : "#238636"}`,
    borderRadius: "12px",
    padding: "24px", // Reduced padding for mobile
    textDecoration: "none",
    color: "#e6edf3",
    display: "block",
    transition: "all 0.2s ease",
    cursor: "pointer",
    transform: hoveredCard === "dashboard" ? "translateY(-4px)" : "translateY(0)",
    boxShadow: hoveredCard === "dashboard" ? "0 12px 35px rgba(126, 231, 135, 0.2)" : "0 4px 12px rgba(0, 0, 0, 0.3)",
    gridColumn: "1 / -1", // Span full width
  };

  return (
    <>
      <Head>
        <title>CB MPC Terminal Dashboard</title>
        <meta name="description" content="Real-time logs dashboard for CB MPC threshold ECDSA web services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#e6edf3",
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: "#161b22",
            borderBottom: "1px solid #30363d",
            padding: "16px 0", // Reduced padding for mobile
            flexShrink: 0,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 16px", // Reduced padding for mobile
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(20px, 5vw, 32px)", // Responsive font size
                fontWeight: "700",
                color: "#f0f6fc",
                marginBottom: "8px",
                letterSpacing: "0.5px",
                lineHeight: "1.2", // Better line height for mobile
              }}
            >
              🔐 CB MPC Terminal Dashboard
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "clamp(12px, 3vw, 16px)", // Responsive font size
                color: "#8b949e",
                fontWeight: "400",
                lineHeight: "1.4",
              }}
            >
              Real-time monitoring for Threshold ECDSA Web Services
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px 16px", // Reduced padding for mobile
            flex: 1,
            width: "100%",
          }}
        >
          {/* Dashboard Card */}
          <div style={{ marginBottom: "32px" }}>
            {" "}
            {/* Reduced margin for mobile */}
            <Link href="/terminal/logs" style={dashboardCardStyle} onMouseEnter={() => setHoveredCard("dashboard")} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "clamp(32px, 8vw, 48px)", // Responsive emoji size
                    marginBottom: "16px",
                  }}
                >
                  📊
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(18px, 4vw, 24px)", // Responsive font size
                    fontWeight: "600",
                    color: "#7ee787",
                    marginBottom: "8px",
                    lineHeight: "1.3",
                  }}
                >
                  Unified Logs Dashboard
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(12px, 3vw, 14px)", // Responsive font size
                    color: "#8b949e",
                    marginBottom: "16px",
                    lineHeight: "1.4",
                  }}
                >
                  View all 4 parties in a single grid layout
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "rgba(126, 231, 135, 0.1)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "clamp(10px, 2.5vw, 12px)", // Responsive font size
                    color: "#7ee787",
                    fontWeight: "500",
                  }}
                >
                  <span>🚀</span>
                  <span>Recommended View</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Individual Terminals Section */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(16px, 3.5vw, 18px)", // Responsive font size
                fontWeight: "600",
                color: "#f0f6fc",
                marginBottom: "16px",
                textAlign: "center",
                lineHeight: "1.3",
              }}
            >
              Individual Terminal Access
            </h3>
          </div>

          {/* Terminal Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", // Mobile-friendly grid
              gap: "16px", // Reduced gap for mobile
              marginBottom: "32px", // Reduced margin for mobile
            }}
          >
            {terminalCards.map((card) => (
              <Link key={card.id} href={`/terminal/${card.id}`} style={cardStyle(card.id)} onMouseEnter={() => setHoveredCard(card.id)} onMouseLeave={() => setHoveredCard(null)}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px", // Slightly smaller for mobile
                      height: "36px",
                      backgroundColor: "#58a6ff",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      fontSize: "16px", // Slightly smaller for mobile
                      fontWeight: "600",
                      color: "#ffffff",
                    }}
                  >
                    {card.id}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "clamp(14px, 3vw, 16px)", // Responsive font size
                        fontWeight: "600",
                        color: "#f0f6fc",
                        lineHeight: "1.3",
                      }}
                    >
                      {card.title}
                    </h4>
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(11px, 2.5vw, 12px)", // Responsive font size
                    color: "#8b949e",
                    lineHeight: "1.4",
                  }}
                >
                  {card.description}
                </p>
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "clamp(10px, 2.5vw, 11px)", // Responsive font size
                    color: "#58a6ff",
                    fontWeight: "500",
                  }}
                >
                  View Terminal →
                </div>
              </Link>
            ))}
          </div>

          {/* Features Section */}
          {/* <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "24px 16px", // Reduced padding for mobile
              textAlign: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(16px, 3.5vw, 18px)", // Responsive font size
                fontWeight: "600",
                color: "#f0f6fc",
                marginBottom: "20px",
                lineHeight: "1.3",
              }}
            >
              Features
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", // Mobile-friendly grid
                gap: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "clamp(20px, 5vw, 24px)", marginBottom: "8px" }}>⚡</div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "clamp(12px, 3vw, 14px)", // Responsive font size
                    fontWeight: "600",
                    color: "#f0f6fc",
                    marginBottom: "4px",
                    lineHeight: "1.3",
                  }}
                >
                  Real-time Streaming
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(10px, 2.5vw, 11px)", // Responsive font size
                    color: "#8b949e",
                    lineHeight: "1.4",
                  }}
                >
                  Live log streaming via WebSocket
                </p>
              </div>
              <div>
                <div style={{ fontSize: "clamp(20px, 5vw, 24px)", marginBottom: "8px" }}>🎨</div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "clamp(12px, 3vw, 14px)",
                    fontWeight: "600",
                    color: "#f0f6fc",
                    marginBottom: "4px",
                    lineHeight: "1.3",
                  }}
                >
                  Professional UI
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    color: "#8b949e",
                    lineHeight: "1.4",
                  }}
                >
                  GitHub-inspired dark theme
                </p>
              </div>
              <div>
                <div style={{ fontSize: "clamp(20px, 5vw, 24px)", marginBottom: "8px" }}>⌨️</div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "clamp(12px, 3vw, 14px)",
                    fontWeight: "600",
                    color: "#f0f6fc",
                    marginBottom: "4px",
                    lineHeight: "1.3",
                  }}
                >
                  Terminal Controls
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    color: "#8b949e",
                    lineHeight: "1.4",
                  }}
                >
                  Keyboard shortcuts & clear function
                </p>
              </div>
              <div>
                <div style={{ fontSize: "clamp(20px, 5vw, 24px)", marginBottom: "8px" }}>📱</div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "clamp(12px, 3vw, 14px)",
                    fontWeight: "600",
                    color: "#f0f6fc",
                    marginBottom: "4px",
                    lineHeight: "1.3",
                  }}
                >
                  Responsive Design
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    color: "#8b949e",
                    lineHeight: "1.4",
                  }}
                >
                  Works on desktop and mobile
                </p>
              </div>
            </div>
          </div> */}
        </main>

        {/* Footer */}
        <footer
          style={{
            backgroundColor: "#161b22",
            borderTop: "1px solid #30363d",
            padding: "16px 0", // Reduced padding for mobile
            textAlign: "center",
            flexShrink: 0,
            marginTop: "auto",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "clamp(9px, 2vw, 11px)", // Responsive font size
              color: "#6e7681",
              lineHeight: "1.4",
              padding: "0 16px", // Add padding to prevent text from touching edges
            }}
          >
            CB MPC Terminal Dashboard • Real-time log monitoring
          </p>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
