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
  const websocket = useRef<WebSocket | null>(null);
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
          background: "#0d1117", // Darker, more professional background
          foreground: "#e6edf3", // Softer white for better readability
          cursor: "#58a6ff", // Blue cursor for better visibility
          cursorAccent: "#0d1117",
          black: "#484f58",
          red: "#ff7b72",
          green: "#7ee787",
          yellow: "#f2cc60",
          blue: "#79c0ff",
          magenta: "#d2a8ff",
          cyan: "#39c5cf",
          white: "#e6edf3",
          brightBlack: "#6e7681",
          brightRed: "#ffa198",
          brightGreen: "#56d364",
          brightYellow: "#e3b341",
          brightBlue: "#58a6ff",
          brightMagenta: "#bc8cff",
          brightCyan: "#39c5cf",
          brightWhite: "#f0f6fc",
        },
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, "Ubuntu Mono", monospace',
        fontSize: 14, // Increased from 13
        fontWeight: "400", // Normal weight
        fontWeightBold: "600", // Semi-bold for bold text
        lineHeight: 1.4, // Increased line height for better readability
        letterSpacing: 0.5, // Slight letter spacing
        cursorBlink: true,
        cursorStyle: "block",
        cursorWidth: 2, // Thicker cursor
        scrollback: 10000,
        tabStopWidth: 4,
        allowTransparency: false, // Disable transparency for better contrast
        cols: 80,
        rows: 24,
        // Additional readability options
        smoothScrollDuration: 0,
        fastScrollModifier: "alt",
        fastScrollSensitivity: 5,
        scrollSensitivity: 3,
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

    console.log(`Terminal ready, connecting to WebSocket for index: ${index}`);

    // Set up WebSocket connection
    const connectToWebSocket = () => {
      // Use your server's WebSocket URL - adjust this to match your setup
      const wsUrl = `wss://ws.logs.cb-mpc.surge.dev`; // Replace with your actual server IP
      console.log(`Attempting to connect to ${wsUrl}`);
      setConnectionStatus("connecting");

      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log("WebSocket connection opened successfully");
        setConnectionStatus("connected");

        // Subscribe to logs for this index
        websocket.current?.send(
          JSON.stringify({
            type: "subscribe",
            index: index,
          })
        );
      };

      websocket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          if (terminal.current) {
            switch (data.type) {
              case "history":
                terminal.current.write(`\r\n[INFO] Loading recent log history...\r\n`);
                data.lines.forEach((line: string) => {
                  const formattedLine = formatLogLine(line);
                  terminal.current?.write(`${formattedLine}\r\n`);
                });
                break;
              case "log":
                const formattedLine = formatLogLine(data.line);
                terminal.current.write(`${formattedLine}\r\n`);
                break;
              case "info":
                terminal.current.write(`\r\n[INFO] ${data.message}\r\n`);
                break;
              case "error":
                terminal.current.write(`\r\n[ERROR] ${data.message}\r\n`);
                break;
              case "subscribed":
                terminal.current.write(`\r\n[INFO] Subscribed to logs for index ${data.index}\r\n`);
                break;
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setConnectionStatus("error");
        if (terminal.current) {
          terminal.current.write("\r\n[CONNECTION ERROR] Failed to connect to log stream\r\n");
        }
      };

      websocket.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        setConnectionStatus("disconnected");

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (websocket.current?.readyState !== WebSocket.OPEN) {
            console.log("Attempting to reconnect...");
            connectToWebSocket();
          }
        }, 3000);
      };
    };

    connectToWebSocket();

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
      if (websocket.current) {
        websocket.current.close();
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

  // Add this function to calculate responsive font size
  const getResponsiveFontSize = () => {
    const width = window.innerWidth;
    if (width < 768) return 12; // Mobile
    if (width < 1024) return 13; // Tablet
    return 14; // Desktop
  };

  // Enhanced helper function to format log lines with colors
  const formatLogLine = (line: string) => {
    // Match timestamp pattern: 2025/07/25 09:56:58
    const timestampRegex = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(.*)$/;
    const match = line.match(timestampRegex);

    if (match) {
      const timestamp = match[1];
      const content = match[2];

      // Color codes for different elements
      let formattedContent = content;

      // Color different log levels
      if (content.includes("❌") || content.includes("ERROR") || content.includes("failed")) {
        formattedContent = `\x1b[91m${content}\x1b[0m`; // Bright red
      } else if (content.includes("⚠️") || content.includes("WARN")) {
        formattedContent = `\x1b[93m${content}\x1b[0m`; // Bright yellow
      } else if (content.includes("✅") || content.includes("SUCCESS") || content.includes("completed")) {
        formattedContent = `\x1b[92m${content}\x1b[0m`; // Bright green
      } else if (content.includes("🔄") || content.includes("INFO") || content.includes("Auto-executing")) {
        formattedContent = `\x1b[94m${content}\x1b[0m`; // Bright blue
      } else if (content.includes("🔏") || content.includes("detected")) {
        formattedContent = `\x1b[95m${content}\x1b[0m`; // Bright magenta
      }

      // Return formatted line with dim timestamp and colored content
      return `\x1b[90m${timestamp}\x1b[0m ${formattedContent}`;
    }

    // If no timestamp found, return original line
    return line;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header Bar */}
      <div
        style={{
          height: "40px",
          backgroundColor: "#21262d", // Darker, more modern background
          color: "#f0f6fc", // Brighter white for better contrast
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          fontSize: "14px",
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace', // Same font as terminal
          fontWeight: "500",
          letterSpacing: "0.3px", // Slight letter spacing for readability
          borderBottom: "1px solid #30363d", // Softer border color
          boxShadow: "0 1px 0 rgba(255, 255, 255, 0.03)", // Subtle highlight
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: "600", // Semi-bold for the title
            color: "#58a6ff", // Blue accent color for the title
          }}
        >
          Cb MPC Party #{index} Logs
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: "400", // Normal weight for status
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 4px ${getStatusColor()}33`, // Subtle glow effect
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "#8b949e", // Muted color for status text
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="terminal-container" // Make sure this class is here
        style={{
          flex: 1,
          minHeight: "400px",
          height: "calc(100vh - 64px)",
          width: "100%",
          backgroundColor: "#0d1117", // Match the terminal background
          overflow: "hidden",
          position: "relative",
          display: "block",
          fontFeatureSettings: '"liga" 1, "calt" 1',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeSpeed",
        }}
      >
        {!isTerminalReady && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#e6edf3", // Updated color
              fontSize: "14px",
              fontFamily: '"JetBrains Mono", monospace',
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
          backgroundColor: "#161b22", // Darker background
          color: "#7d8590", // Muted text color
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontSize: "11px",
          fontFamily: '"JetBrains Mono", "Fira Code", monospace', // Consistent font
          letterSpacing: "0.2px",
          borderTop: "1px solid #21262d", // Softer border
        }}
      >
        Press{" "}
        <span
          style={{
            color: "#58a6ff",
            fontWeight: "500",
            padding: "0 2px",
          }}
        >
          ⌘+K
        </span>{" "}
        (Mac) or{" "}
        <span
          style={{
            color: "#58a6ff",
            fontWeight: "500",
            padding: "0 2px",
          }}
        >
          Ctrl+K
        </span>{" "}
        (Windows/Linux) to clear terminal
      </div>
    </div>
  );
};

export default LogTerminal;
