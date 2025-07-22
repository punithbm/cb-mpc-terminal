import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const HomePage: React.FC = () => {
  const [customIndex, setCustomIndex] = useState("");

  // Pre-defined terminal links (you can modify this list)
  const predefinedTerminals = [1, 2, 3, 4, 5];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIndex && /^\d+$/.test(customIndex)) {
      window.open(`/terminal/${customIndex}`, "_blank");
    }
  };

  return (
    <>
      <Head>
        <title>Threshold ECDSA Web - Log Terminals</title>
        <meta name="description" content="Access real-time logs for Threshold ECDSA Web services" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          padding: "2rem",
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <header style={{ marginBottom: "3rem", textAlign: "center" }}>
            <h1
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.5rem",
                color: "#23d18b",
              }}
            >
              Threshold ECDSA Web
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#cccccc",
                margin: 0,
              }}
            >
              Real-time Log Terminals
            </p>
          </header>

          {/* Quick Access Terminals */}
          <section style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "#3b8eea",
                borderBottom: "2px solid #3b8eea",
                paddingBottom: "0.5rem",
              }}
            >
              Quick Access
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {predefinedTerminals.map((index) => (
                <Link
                  key={index}
                  href={`/terminal/${index}`}
                  style={{
                    display: "block",
                    padding: "1rem",
                    backgroundColor: "#333333",
                    border: "2px solid #555555",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#ffffff",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#23d18b";
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#555555";
                    e.currentTarget.style.backgroundColor = "#333333";
                  }}
                >
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Terminal #{index}</div>
                  <div style={{ fontSize: "0.9rem", color: "#cccccc", marginTop: "0.5rem" }}>threshold-ecdsa-web@{index}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Custom Terminal Access */}
          <section style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "#3b8eea",
                borderBottom: "2px solid #3b8eea",
                paddingBottom: "0.5rem",
              }}
            >
              Custom Terminal
            </h2>
            <form
              onSubmit={handleCustomSubmit}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                maxWidth: "400px",
              }}
            >
              <input
                type="text"
                value={customIndex}
                onChange={(e) => setCustomIndex(e.target.value)}
                placeholder="Enter service index (e.g., 6)"
                pattern="\d+"
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#333333",
                  border: "2px solid #555555",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b8eea";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#555555";
                }}
              />
              <button
                type="submit"
                disabled={!customIndex || !/^\d+$/.test(customIndex)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: customIndex && /^\d+$/.test(customIndex) ? "#23d18b" : "#666666",
                  border: "none",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "1rem",
                  cursor: customIndex && /^\d+$/.test(customIndex) ? "pointer" : "not-allowed",
                  transition: "background-color 0.2s ease",
                }}
              >
                Open
              </button>
            </form>
          </section>

          {/* Instructions */}
          <section>
            <h2
              style={{
                fontSize: "1.5rem",
                marginBottom: "1rem",
                color: "#3b8eea",
                borderBottom: "2px solid #3b8eea",
                paddingBottom: "0.5rem",
              }}
            >
              Instructions
            </h2>
            <div
              style={{
                backgroundColor: "#333333",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #555555",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: "1.5rem", lineHeight: "1.6" }}>
                <li style={{ marginBottom: "0.5rem" }}>Click on any terminal link above to view real-time logs</li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Use <code style={{ backgroundColor: "#1e1e1e", padding: "0.2rem 0.4rem", borderRadius: "3px" }}>⌘+K</code> (Mac) or <code style={{ backgroundColor: "#1e1e1e", padding: "0.2rem 0.4rem", borderRadius: "3px" }}>Ctrl+K</code> (Windows/Linux) to clear terminal
                </li>
                <li style={{ marginBottom: "0.5rem" }}>Terminals will automatically reconnect if the connection is lost</li>
                <li>
                  Each terminal streams logs from <code style={{ backgroundColor: "#1e1e1e", padding: "0.2rem 0.4rem", borderRadius: "3px" }}>threshold-ecdsa-web@{"{index}"}</code> systemd service
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
