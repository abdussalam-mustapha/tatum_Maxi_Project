# MCP (Model Context Protocol) Integration Guide

This guide explains how to set up the Tatum Blockchain MCP integration for Tatum Maxi.

## What is MCP?

Model Context Protocol (MCP) allows AI assistants to securely connect to external data sources and tools. In this case, we're connecting to Tatum's blockchain data services.

## Setup Instructions

### 1. MCP Server Configuration

The `mcp-config.json` file contains the configuration for connecting to the Tatum MCP server:

```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": [
        "@tatumio/blockchain-mcp"
      ],
      "env": {
        "TATUM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### 2. Environment Setup

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
```

Add your Tatum API key to the `.env` file:
```
TATUM_API_KEY=your_actual_tatum_api_key_here
```

### 3. Available MCP Tools

The Tatum MCP server provides these tools:

- `get_balance` - Get native token balance for an address
- `get_token_balances` - Get ERC-20/SPL token balances
- `get_transactions` - Get transaction history
- `get_nfts` - Get NFT holdings

### 4. How It Works

1. **MCP Client Connection**: The server establishes a connection to the Tatum MCP server using the MCP SDK
2. **Tool Calls**: When portfolio data is requested, the server calls appropriate MCP tools
3. **Fallback System**: If MCP connection fails, the system falls back to mock data for demos
4. **Multi-Chain Support**: Automatically handles Ethereum, Polygon, and Solana networks

### 5. Testing MCP Integration

1. **With API Key**: Real blockchain data will be fetched from Tatum
2. **Without API Key**: Mock data will be used for demonstration

### 6. Troubleshooting

**Connection Issues:**
- Verify TATUM_API_KEY is set correctly
- Check that @tatumio/blockchain-mcp package is installed
- Ensure network connectivity

**Data Issues:**
- Check console logs for MCP call errors
- Verify wallet address format is correct
- Confirm the address has activity on the requested networks

### 7. MCP Client Integration

If you're using an MCP-compatible client (like Claude Desktop), add this to your client configuration:

```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": ["@tatumio/blockchain-mcp"],
      "env": {
        "TATUM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Architecture

```
Frontend (React) -> Backend API -> MCP Client -> Tatum MCP Server -> Tatum API -> Blockchain Networks
```

This architecture allows for:
- **Secure API access** through MCP protocol
- **Multiple blockchain networks** through a single interface
- **Fallback mechanisms** for demo purposes
- **Real-time data** when properly configured
