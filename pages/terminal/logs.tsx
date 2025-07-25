import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";

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
            justifyContent: "center",
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
            <LogTerminal index="0" />
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
            <LogTerminal index="1" />
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
            <LogTerminal index="2" />
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
            <LogTerminal index="3" />
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsDashboard;
