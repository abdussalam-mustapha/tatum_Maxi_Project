# Tatum Maxi - Project Instructions

## Project Overview
Full-stack crypto portfolio tracker with real-time AI chat functionality using Tatum MCP integration.

## Architecture
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Blockchain Integration**: Tatum MCP for real-time data
- **AI Features**: Real-time portfolio analysis chat

## Key Components

### Frontend (`/client`)
- `AIChat.jsx` - Real-time AI chat with MCP integration
- `WalletInput.jsx` - Multi-chain wallet address input
- `PortfolioCard.jsx` - Portfolio visualization
- `LoadingSpinner.jsx` - Loading states

### Backend (`/server`)
- `tatumService.js` - Tatum API and MCP integration with WSL detection
- `mcpClient.js` - MCP client with stdio transport
- `index.js` - Express server with AI analysis endpoints

## Platform Compatibility
- **Windows**: Use WSL for optimal MCP functionality
- **Linux/macOS**: Native MCP support
- **WSL Detection**: Automatic platform detection for MCP client selection

## Environment Setup
- Tatum API key required
- MCP package: `@tatumio/blockchain-mcp`
- WSL recommended for Windows users

## Key Features Implemented
- [x] Multi-chain portfolio tracking
- [x] Real-time AI chat interface
- [x] Tatum MCP integration
- [x] WSL compatibility layer
- [x] Platform-specific optimizations

## Development Notes
- MCP functionality is prioritized over direct API calls
- WSL provides best compatibility for Tatum MCP on Windows
- AI chat supports real-time blockchain querying via MCP tools
