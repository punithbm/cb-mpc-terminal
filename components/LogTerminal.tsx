import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface LogTerminalProps {
  index: string;
  onRegister?: (terminalRef: { clear: () => void }) => void;
}

const LogTerminal: React.FC<LogTerminalProps> = ({ index, onRegister }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("connecting");
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const initAttempted = useRef(false);

  // Register this terminal instance with the parent when terminal is ready
  useEffect(() => {
    if (isTerminalReady && terminal.current && onRegister) {
      onRegister({
        clear: () => {
          if (terminal.current) {
            terminal.current.clear();
          }
        },
      });
    }
  }, [isTerminalReady, onRegister]);

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
        fontSize: 12, // Smaller font for grid layout
        fontWeight: "400",
        fontWeightBold: "600",
        lineHeight: 1.3, // Slightly tighter line height
        letterSpacing: 0.3, // Reduced letter spacing
        cursorBlink: true,
        cursorStyle: "block",
        cursorWidth: 1, // Thinner cursor for smaller terminals
        scrollback: 5000, // Reduced scrollback for performance
        tabStopWidth: 4,
        allowTransparency: false,
        // Remove fixed cols/rows to let it auto-size
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
        console.log("Key pressed:", {
          key: domEvent.key,
          code: domEvent.code,
          metaKey: domEvent.metaKey,
          ctrlKey: domEvent.ctrlKey,
          altKey: domEvent.altKey,
          shiftKey: domEvent.shiftKey,
        });

        // Handle Cmd+K (Mac) or Ctrl+K (Windows/Linux)
        // Check for both 'k' and 'K' and use both meta and ctrl for compatibility
        if ((domEvent.metaKey || domEvent.ctrlKey) && (domEvent.key.toLowerCase() === "k" || domEvent.code === "KeyK")) {
          domEvent.preventDefault();
          domEvent.stopPropagation();
          console.log("Clearing terminal via onKey...");
          term.clear();
          return false;
        }
      });

      // Make terminal focusable and add click handler to focus
      element.setAttribute("tabindex", "0");
      element.addEventListener("click", () => {
        element.focus();
        term.focus();
      });

      // Also add global keyboard listener for when terminal is focused
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        // Only handle if the terminal container is focused or active
        if (document.activeElement === element || element.contains(document.activeElement)) {
          if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "k" || event.code === "KeyK")) {
            event.preventDefault();
            event.stopPropagation();
            console.log("Clearing terminal via global listener...");
            term.clear();
          }
        }
      };

      // Add global event listener
      document.addEventListener("keydown", handleGlobalKeyDown);

      // Store the cleanup function
      const cleanup = () => {
        document.removeEventListener("keydown", handleGlobalKeyDown);
      };

      // Store cleanup in a way we can access it later
      (term as any)._customCleanup = cleanup;

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
        // Call custom cleanup if it exists
        if ((terminal.current as any)._customCleanup) {
          (terminal.current as any)._customCleanup();
        }
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
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0, // Important for grid layout
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          height: "32px", // Reduced height for grid layout
          backgroundColor: "#21262d",
          color: "#f0f6fc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px", // Reduced padding
          fontSize: "14px", // Smaller font for grid
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
          fontWeight: "500",
          letterSpacing: "0.3px",
          borderBottom: "1px solid #30363d",
          boxShadow: "0 1px 0 rgba(255, 255, 255, 0.03)",
        }}
      >
        <span
          style={{
            fontWeight: "600",
            color: "#58a6ff",
          }}
        >
          Party #{index}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px", // Reduced gap
            fontSize: "12px", // Smaller status text
            fontWeight: "400",
          }}
        >
          <div
            style={{
              width: "6px", // Smaller indicator
              height: "6px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 3px ${getStatusColor()}33`,
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "#8b949e",
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
        className="terminal-container"
        style={{
          flex: 1,
          minHeight: 0, // Important for grid layout
          width: "100%",
          backgroundColor: "#0d1117",
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
              color: "#e6edf3",
              fontSize: "14px", // Smaller loading text
              fontFamily: '"JetBrains Mono", monospace',
              zIndex: 1,
            }}
          >
            {!isContainerReady ? "Initializing..." : "Loading..."}
          </div>
        )}
      </div>

      {/* Help text - make it smaller for grid layout */}
      <div
        style={{
          height: "20px", // Reduced height
          backgroundColor: "#161b22",
          color: "#7d8590",
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Center the text
          padding: "0 8px",
          fontSize: "12px", // Smaller font
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          letterSpacing: "0.1px",
          borderTop: "1px solid #21262d",
        }}
      >
        <span style={{ color: "#58a6ff", fontWeight: "500" }}>⌘+K</span>
        <span style={{ margin: "0 4px" }}>or</span>
        <span style={{ color: "#58a6ff", fontWeight: "500" }}>Ctrl+K</span>
        <span style={{ marginLeft: "4px" }}>to clear</span>
      </div>
    </div>
  );
}; // This closes the component function

export default LogTerminal; // Only one export statement
