import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface LogTerminalProps {
  index: string;
}

const LogTerminal: React.FC<LogTerminalProps> = ({ index }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const eventSource = useRef<EventSource | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("connecting");
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const initAttempted = useRef(false);

  // Check if container is ready using useLayoutEffect
  useLayoutEffect(() => {
    if (terminalRef.current) {
      const checkContainer = () => {
        const element = terminalRef.current;
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // Check if element has dimensions and is visible
        if (rect.width > 0 && rect.height > 0 && computedStyle.display !== "none") {
          setIsContainerReady(true);
          return true;
        }
        return false;
      };

      if (!checkContainer()) {
        // If not ready, check again after a short delay
        const timer = setTimeout(checkContainer, 50);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || !isContainerReady || initAttempted.current) return false;

    try {
      initAttempted.current = true;

      const element = terminalRef.current;

      // Create terminal instance with explicit dimensions
      const term = new Terminal({
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
          cursor: "#ffffff",
          cursorAccent: "#000000",
          black: "#1e1e1e",
          red: "#f14c4c",
          green: "#23d18b",
          yellow: "#f5f543",
          blue: "#3b8eea",
          magenta: "#d670d6",
          cyan: "#29b8db",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#ffffff",
        },
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 10000,
        tabStopWidth: 4,
        allowTransparency: true,
        cols: 80,
        rows: 24,
      });

      // Create and load fit addon
      const fit = new FitAddon();
      term.loadAddon(fit);

      // Open terminal
      term.open(element);

      // Fit terminal to container
      fit.fit();

      // Store references
      terminal.current = term;
      fitAddon.current = fit;
      setIsTerminalReady(true);

      // Handle keyboard shortcuts
      term.onKey(({ key, domEvent }) => {
        if ((domEvent.metaKey || domEvent.ctrlKey) && domEvent.key === "k") {
          domEvent.preventDefault();
          term.clear();
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize terminal:", error);
      initAttempted.current = false;
      return false;
    }
  }, [isContainerReady]);

  // Initialize terminal when container is ready
  useEffect(() => {
    if (isContainerReady && !isTerminalReady) {
      // Try to initialize immediately
      if (!initializeTerminal()) {
        // If not successful, try again with a small delay
        const timer = setTimeout(() => {
          initializeTerminal();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isContainerReady, isTerminalReady, initializeTerminal]);

  useEffect(() => {
    if (!isTerminalReady) return;

    // Set up SSE connection
    const connectToSSE = () => {
      setConnectionStatus("connecting");
      eventSource.current = new EventSource(`/api/stream/${index}`);

      eventSource.current.onopen = () => {
        setConnectionStatus("connected");
      };

      eventSource.current.onmessage = (event) => {
        const message = event.data + "\r\n";
        if (terminal.current) {
          terminal.current.write(message);
        }
      };

      eventSource.current.onerror = (error) => {
        console.error("SSE Error:", error);
        setConnectionStatus("error");
        if (terminal.current) {
          terminal.current.write("\r\n[CONNECTION ERROR] Failed to connect to log stream\r\n");
        }

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (eventSource.current?.readyState !== EventSource.OPEN) {
            connectToSSE();
          }
        }, 3000);
      };
    };

    connectToSSE();

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current && terminal.current) {
        try {
          fitAddon.current.fit();
        } catch (error) {
          console.warn("Resize fit error:", error);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (eventSource.current) {
        eventSource.current.close();
      }
    };
  }, [index, isTerminalReady]);

  // Cleanup terminal on unmount
  useEffect(() => {
    return () => {
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, []);

  // Connection status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#23d18b";
      case "connecting":
        return "#f5f543";
      case "error":
        return "#f14c4c";
      case "disconnected":
        return "#666666";
      default:
        return "#666666";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header Bar */}
      <div
        style={{
          height: "40px",
          backgroundColor: "#333333",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          fontSize: "14px",
          fontWeight: "500",
          borderBottom: "1px solid #555555",
        }}
      >
        <span>Threshold ECDSA Web #{index} Logs</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(),
            }}
          />
          <span style={{ fontSize: "12px" }}>{getStatusText()}</span>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          minHeight: "400px",
          height: "calc(100vh - 64px)",
          width: "100%",
          backgroundColor: "#1e1e1e",
          overflow: "hidden",
          position: "relative",
          display: "block",
        }}
      >
        {!isTerminalReady && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#ffffff",
              fontSize: "14px",
              zIndex: 1,
            }}
          >
            {!isContainerReady ? "Initializing terminal..." : "Loading terminal..."}
          </div>
        )}
      </div>

      {/* Help text */}
      <div
        style={{
          height: "24px",
          backgroundColor: "#2d2d2d",
          color: "#888888",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontSize: "11px",
          borderTop: "1px solid #555555",
        }}
      >
        Press ⌘+K (Mac) or Ctrl+K (Windows/Linux) to clear terminal
      </div>
    </div>
  );
};

export default LogTerminal;
