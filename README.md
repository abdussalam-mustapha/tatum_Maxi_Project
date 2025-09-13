# Tatum Maxi

A multi-chain crypto portfolio tracker that allows users to view their balances, token holdings, and NFTs across multiple blockchains in one unified dashboard.

![Tatum Maxi](https://via.placeholder.com/800x400/667eea/ffffff?text=Tatum+Maxi+Dashboard)

## Features

- **Multi-Chain Support**: Track balances across Ethereum, Polygon,Optimism, Arbitrum, Avalanche and Solana
- **Real-Time Portfolio**: View total USD value and chain-by-chain breakdown
- **Token Holdings**: See all ERC-20 and SPL tokens in your wallets
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Performance**: Portfolio loads in under 5 seconds

## Tech Stack

### Frontend
- **React 18** - Modern React with functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Tatum MCP** - Blockchain data integration
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Tatum API key (get from [Tatum Dashboard](https://dashboard.tatum.io))
- **For Windows users**: WSL (Windows Subsystem for Linux) recommended for optimal MCP functionality

### Setup Options

#### 🐧 Option A: WSL Setup (Recommended for Windows)

**Why WSL?** The Tatum MCP package works best in a Linux environment. WSL provides perfect compatibility while keeping your Windows workflow.

📖 **[Complete WSL Setup Guide](./WSL_SETUP.md)** - Follow this for the best MCP experience!

#### 🪟 Option B: Windows Native Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tatum_Maxi
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   Edit `.env` and add your Tatum API key:
   ```
   TATUM_API_KEY=your_actual_api_key_here
   ```

4. **Configure MCP Integration** (Optional for real data)
   ```bash
   # The mcp-config.json file is already created
   # Add your API key to server/.env for live blockchain data
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Frontend server on http://localhost:3000
- Backend API on http://localhost:5000
- MCP client connection to Tatum blockchain services

### ✅ Verifying MCP Functionality

Check if MCP is working properly:

```bash
# Test MCP status
curl http://localhost:5001/api/mcp/status
```

Expected response:
```json
{
  "mcpConnected": true,
  "hasApiKey": true,
  "message": "MCP is connected and active"
}
```

⚠️ **Note**: If you see `"mcpConnected": false` on Windows, use the WSL setup for full functionality.

## MCP Integration

This project uses **Model Context Protocol (MCP)** to securely connect to Tatum's blockchain services:

- 📋 **MCP Configuration**: `mcp-config.json` 
- 🔗 **Real-time Data**: Live blockchain data when API key is configured
- 🛠️ **MCP Tools**: Balance, tokens, transactions, NFTs

See `MCP_SETUP.md` for detailed setup instructions.

## Project Structure

```
tatum_Maxi/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── WalletInput.jsx
│   │   │   ├── PortfolioCard.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── services/
│   │   └── tatumService.js # Tatum API integration
│   ├── index.js            # Express server
│   └── package.json
└── README.md
```

## API Endpoints

### `GET /api/portfolio/:address`
Fetch complete portfolio data for a wallet address.

**Response:**
```json
{
  "address": "0x...",
  "totalUsdValue": 15847.32,
  "chains": [
    {
      "name": "ethereum",
      "symbol": "ETH",
      "balance": "2.45673",
      "usdValue": 5234.12,
      "tokens": [...]
    }
  ]
}
```

### `GET /api/transactions/:address`
Get transaction history (optional feature).

### `GET /api/nfts/:address`
Get NFT holdings (optional feature).

## Usage

1. **Enter Wallet Address**: Paste any Ethereum, Polygon, or Solana wallet address
2. **View Portfolio**: See total USD value and breakdown by chain
3. **Explore Holdings**: Review native balances and token holdings
4. **Track Performance**: Monitor your crypto investments in one place
5. **Chat with AI chatbot**: do more complex portfolio tracking and analysis

## Supported Blockchains

- ⟠ **Ethereum** - ETH and ERC-20 tokens
- ⬟ **Polygon** - MATIC and Polygon tokens  
- ◎ **Solana** - SOL and SPL tokens
- **Arbitrum**
- **Avalanche**
- **Optimism**

## Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Start only frontend
npm run client:dev

# Start only backend
npm run server:dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Chains

To add support for additional blockchains:

1. Update `tatumService.js` to include new chain queries
2. Add chain icons and colors in `PortfolioCard.jsx`
3. Update validation logic in `WalletInput.jsx`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Tatum](https://tatum.io) for blockchain data
- UI components inspired by modern DeFi interfaces
- Icons by [Lucide](https://lucide.dev)

---

**Note**: This is a hackathon demo project. For production use, implement proper error handling, rate limiting, and security measures.
