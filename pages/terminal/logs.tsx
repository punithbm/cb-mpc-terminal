import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useState, useRef } from "react";

// Import the type separately
import type { LogTerminalRef } from "../../components/LogTerminal";

// Dynamic import to avoid SSR issues with xterm
const LogTerminal = dynamic(() => import("../../components/LogTerminal"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0d1117",
        color: "#e6edf3",
        fontSize: "14px",
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      Loading terminal...
    </div>
  ),
});

const LogsDashboard: React.FC = () => {
  // Change approach: store refs in an object that each terminal can register with
  const terminalInstances = useRef<{ [key: string]: { clear: () => void } }>({});
  const [isClearing, setIsClearing] = useState(false);

  const registerTerminal = (index: string, terminalRef: { clear: () => void }) => {
    terminalInstances.current[index] = terminalRef;
  };

  const handleClearAllLogs = () => {
    setIsClearing(true);

    // Clear all terminals
    Object.values(terminalInstances.current).forEach((terminal) => {
      if (terminal && typeof terminal.clear === "function") {
        terminal.clear();
      }
    });

    // Reset clearing state after a short delay
    setTimeout(() => setIsClearing(false), 300);
  };

  return (
    <>
      <Head>
        <title>CB MPC Logs Dashboard - All Parties</title>
        <meta name="description" content="Real-time logs dashboard for all CB MPC parties" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          height: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
          backgroundColor: "#0d1117",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "60px",
            backgroundColor: "#161b22",
            borderBottom: "1px solid #30363d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#f0f6fc",
              fontSize: "20px",
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            🔐 CB MPC Logs Dashboard
          </h1>

          {/* Clear Logs Button */}
          <button
            onClick={handleClearAllLogs}
            disabled={isClearing}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #30363d",
              borderRadius: "6px",
              color: "#8b949e",
              padding: "8px 12px",
              fontSize: "12px",
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: "500",
              cursor: isClearing ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: isClearing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isClearing) {
                e.currentTarget.style.backgroundColor = "#21262d";
                e.currentTarget.style.borderColor = "#58a6ff";
                e.currentTarget.style.color = "#58a6ff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isClearing) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#30363d";
                e.currentTarget.style.color = "#8b949e";
              }
            }}
          >
            <span style={{ fontSize: "14px" }}>🗑️</span>
            {isClearing ? "Clearing..." : "Clear Logs"}
          </button>
        </div>

        {/* Grid Container */}
        <div
          style={{
            height: "calc(100vh - 60px)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "2px",
            backgroundColor: "#21262d",
            padding: "2px",
          }}
        >
          {/* Terminal 0 */}
          <div
            style={{
              backgroundColor: "#0d1117",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #30363d",
            }}
          >
            <LogTerminal index="0" onRegister={(terminalRef) => registerTerminal("0", terminalRef)} />
          </div>

          {/* Terminal 1 */}
          <div
            style={{
              backgroundColor: "#0d1117",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #30363d",
            }}
          >
            <LogTerminal index="1" onRegister={(terminalRef) => registerTerminal("1", terminalRef)} />
          </div>

          {/* Terminal 2 */}
          <div
            style={{
              backgroundColor: "#0d1117",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #30363d",
            }}
          >
            <LogTerminal index="2" onRegister={(terminalRef) => registerTerminal("2", terminalRef)} />
          </div>

          {/* Terminal 3 */}
          <div
            style={{
              backgroundColor: "#0d1117",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #30363d",
            }}
          >
            <LogTerminal index="3" onRegister={(terminalRef) => registerTerminal("3", terminalRef)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsDashboard;
