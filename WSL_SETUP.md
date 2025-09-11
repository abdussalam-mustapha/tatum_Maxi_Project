# 🚀 Tatum Maxi - WSL Setup Guide

## Why WSL for MCP?

**Windows Subsystem for Linux (WSL)** solves the MCP compatibility issues we encountered on Windows:

- ✅ **Native Linux Process Management** - No spawn EINVAL errors
- ✅ **Perfect stdio Communication** - MCP protocol works as designed  
- ✅ **Better npm/npx Support** - No PowerShell complications
- ✅ **Stable Child Processes** - Reliable MCP server spawning
- ✅ **Keep Your Windows Environment** - Best of both worlds!

## 📋 WSL Setup Steps

### 1. Install WSL (if not already installed)

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

Or install a specific distribution:
```powershell
wsl --install -d Ubuntu
```

### 2. Access Your Project in WSL

Option A: Copy project to WSL filesystem (Recommended for performance)
```bash
# From WSL terminal
mkdir -p ~/projects
cp -r /mnt/c/Users/DELL/Desktop/tatum_Maxi ~/projects/
cd ~/projects/tatum_Maxi
```

Option B: Access Windows files directly (Easier, but slower)
```bash
# From WSL terminal
cd /mnt/c/Users/DELL/Desktop/tatum_Maxi
```

### 3. Install Node.js in WSL

```bash
# Update package manager
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install Project Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### 5. Set Environment Variables

```bash
# Create .env file in server directory
cd ../server
echo "TATUM_API_KEY=t-68c1860ed53ce75bfbaa2e7c-05e5e216edd7494e81e1afe3" > .env
echo "PORT=5001" >> .env
```

### 6. Install Tatum MCP Package

```bash
# Install globally for better compatibility
npm install -g @tatumio/blockchain-mcp

# Test MCP package
export TATUM_API_KEY="t-68c1860ed53ce75bfbaa2e7c-05e5e216edd7494e81e1afe3"
npx @tatumio/blockchain-mcp --version
```

## 🚀 Running the Application in WSL

### Terminal 1: Start Server
```bash
cd ~/projects/tatum_Maxi/server  # or /mnt/c/Users/DELL/Desktop/tatum_Maxi/server
npm start
```

You should see:
```
🐧🪟 Using Linux MCP client (WSL detected)
🔗 Attempting to connect to Tatum MCP server...
✅ Connected to Tatum MCP server
📋 Available MCP tools: get_wallet_portfolio, get_tokens, get_transaction_history, get_metadata, ...
🚀 Tatum Maxi server running on port 5001
```

### Terminal 2: Start Frontend
```bash
cd ~/projects/tatum_Maxi/client  # or /mnt/c/Users/DELL/Desktop/tatum_Maxi/client
npm start
```

## 🌐 Accessing the Application

- **Frontend**: http://localhost:3000 (accessible from Windows browser)
- **API**: http://localhost:5001 (server running in WSL)
- **MCP Status**: http://localhost:5001/api/mcp/status

## 🔧 Development Workflow

### VS Code with WSL Extension
1. Install "Remote - WSL" extension in VS Code
2. Open WSL terminal: `code .` from project directory
3. Edit files directly in WSL filesystem for best performance

### Debugging MCP Connection
```bash
# Test MCP directly
export TATUM_API_KEY="your-api-key"
npx @tatumio/blockchain-mcp

# Check MCP status
curl http://localhost:5001/api/mcp/status

# View server logs
cd ~/projects/tatum_Maxi/server
npm start
```

## 🎯 Expected MCP Benefits in WSL

Once running in WSL, you'll get:

- ✅ **Full MCP Functionality** - All 14 Tatum blockchain tools
- ✅ **Real-Time Data** - Direct blockchain queries via MCP
- ✅ **Enhanced AI Chat** - Advanced portfolio analysis using MCP tools
- ✅ **Reliable Connection** - No Windows process spawning issues
- ✅ **Better Performance** - Native Linux process management

## 📊 Testing MCP Functionality

### 1. Check MCP Status
```bash
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

### 2. Test AI Chat with MCP
1. Open http://localhost:3000
2. Enter wallet: `0x6748F50f686bfbcA6Fe8ad62b22228b87F31ff2b`
3. Open AI chat bubble
4. Ask: "Analyze my portfolio using MCP tools"

### 3. Verify MCP Tools
```bash
# Test portfolio endpoint
curl "http://localhost:5001/api/portfolio/0x6748F50f686bfbcA6Fe8ad62b22228b87F31ff2b"
```

## 🔄 Migration Checklist

- [ ] WSL installed and configured
- [ ] Node.js installed in WSL
- [ ] Project copied/accessed in WSL
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] MCP package installed globally
- [ ] Server starts with MCP connection
- [ ] Frontend accessible from Windows
- [ ] AI chat working with real MCP data

## 🆘 Troubleshooting

### Issue: "npx not found"
```bash
sudo apt update
sudo apt install npm
npm install -g npx
```

### Issue: "Permission denied"
```bash
sudo chown -R $USER:$USER ~/projects/tatum_Maxi
```

### Issue: "Port already in use"
```bash
# Kill existing processes
sudo lsof -ti:5001 | xargs sudo kill -9
sudo lsof -ti:3000 | xargs sudo kill -9
```

---

**🎯 Result**: Perfect MCP integration with all Tatum blockchain tools working reliably in WSL!
