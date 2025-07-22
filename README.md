# CB MPC Terminal

A Next.js web application that provides real-time streaming of systemd journal logs through web terminals.

## Features

- **Real-time Log Streaming**: Uses Server-Sent Events (SSE) to stream `journalctl` output
- **Terminal Interface**: Full-featured terminal using xterm.js with dark theme
- **Dynamic Routes**: Access any service index via `/terminal/{index}`
- **Keyboard Shortcuts**: Clear terminal with ⌘+K or Ctrl+K
- **Auto-reconnection**: Automatically reconnects if SSE connection is lost
- **Responsive Design**: Terminals fit to container size

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Navigate to `http://localhost:3000`
   - Click on any terminal link to view logs
   - Or go directly to `/terminal/{index}` (e.g., `/terminal/1`)

## Project Structure

```
├── components/
│   └── LogTerminal.tsx      
```
