import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export class MCPClient {
  constructor() {
    this.client = null
    this.transport = null
    this.isConnected = false
  }

  async connect() {
    try {
      console.log('🔗 Attempting to connect to Tatum MCP server...')
      
      // Detect environment for optimal MCP connection
      const isWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME
      const isWindows = process.platform === 'win32'
      
      if (isWSL) {
        console.log('🐧🪟 Using Linux MCP client (WSL detected)')
      } else if (isWindows) {
        console.log('🪟 Using Windows MCP client')
      } else {
        console.log('🐧 Using Linux MCP client')
      }
      
      // For Windows, use PowerShell to run npx
      let command, args
      
      if (isWindows && !isWSL) {
        command = 'powershell.exe'
        args = ['-Command', 'npx', '@tatumio/blockchain-mcp']
      } else {
        command = 'npx'
        args = ['@tatumio/blockchain-mcp']
      }
      
      console.log(`🖥️  Platform: ${process.platform}`)
      console.log(`🔧 Command: ${command} ${args.join(' ')}`)
      console.log(`🔑 API Key: ${process.env.TATUM_API_KEY ? 'Set' : 'Missing'}`)
      
      // Create transport for Tatum MCP server with Windows-specific options
      this.transport = new StdioClientTransport({
        command: command,
        args: args,
        env: {
          ...process.env,
          TATUM_API_KEY: process.env.TATUM_API_KEY,
          PATH: process.env.PATH
        },
        // Windows-specific options
        ...(isWindows && !isWSL && {
          windowsHide: true
        })
      })

      this.client = new Client({
        name: 'tatum-maxi-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      })

      console.log('⏳ Connecting to MCP transport...')
      await this.client.connect(this.transport)
      
      console.log('🔍 Listing available tools...')
      const tools = await this.client.listTools()
      const toolNames = tools.tools?.map(t => t.name) || []
      
      this.isConnected = true
      console.log('✅ Connected to Tatum MCP server successfully!')
      console.log(`📋 Available MCP tools (${toolNames.length}):`, toolNames)
      
      return true
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error.message)
      console.error('📋 Full error:', error)
      
      // Try alternative Windows approach
      if (process.platform === 'win32' && error.message.includes('spawn')) {
        console.log('💡 Trying alternative Windows MCP connection...')
        return await this.connectAlternative()
      }
      
      // Provide detailed troubleshooting
      if (error.message.includes('ENOENT')) {
        console.log('💡 ENOENT Error - Command not found. Troubleshooting:')
        console.log('   1. Check if npx is in PATH: npx --version')
        console.log('   2. Verify MCP package: npm list -g @tatumio/blockchain-mcp')
        console.log('   3. Try installing globally: npm install -g @tatumio/blockchain-mcp')
      } else if (error.message.includes('spawn')) {
        console.log('💡 Spawn Error - Process creation failed. Try:')
        console.log('   1. Run as Administrator')
        console.log('   2. Check Windows Defender/Antivirus')
        console.log('   3. Verify Node.js installation')
      } else if (error.message.includes('EPIPE') || error.message.includes('connection')) {
        console.log('💡 Connection Error - MCP server startup failed:')
        console.log('   1. Verify TATUM_API_KEY is valid')
        console.log('   2. Check network connectivity')
        console.log('   3. Try restarting the server')
      }
      
      console.log('🔄 Falling back to direct Tatum API calls')
      this.isConnected = false
      return false
    }
  }

  async connectAlternative() {
    try {
      console.log('🔄 Trying alternative Windows connection method...')
      
      // Alternative: Use cmd.exe instead of PowerShell
      this.transport = new StdioClientTransport({
        command: 'cmd.exe',
        args: ['/c', 'npx', '@tatumio/blockchain-mcp'],
        env: {
          ...process.env,
          TATUM_API_KEY: process.env.TATUM_API_KEY
        },
        windowsHide: true
      })

      this.client = new Client({
        name: 'tatum-maxi-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      })

      await this.client.connect(this.transport)
      this.isConnected = true
      
      const tools = await this.client.listTools()
      console.log('✅ Alternative connection successful!')
      console.log('📋 Available MCP tools:', tools.tools?.map(t => t.name) || [])
      
      return true
    } catch (altError) {
      console.error('❌ Alternative connection also failed:', altError.message)
      this.isConnected = false
      return false
    }
  }

  async callTool(name, arguments_ = {}) {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected')
    }

    try {
      const result = await this.client.callTool({
        name,
        arguments: arguments_
      })
      return result
    } catch (error) {
      console.error(`Error calling MCP tool ${name}:`, error)
      throw error
    }
  }

  async disconnect() {
    if (this.client && this.transport) {
      await this.client.close()
      await this.transport.close()
      this.isConnected = false
      console.log('🔌 Disconnected from MCP server')
    }
  }

  async getWalletPortfolio(address) {
    try {
      console.log(`🔍 Getting wallet portfolio for address: ${address}`)
      
      // Set a reasonable timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MCP call timeout after 5 seconds')), 5000)
      })
      
      
      const chainFormats = [
        'ethereum',
        'ethereum-mainnet', 
        'polygon',
        'polygon-mainnet'
      ]
      
      for (const chain of chainFormats) {
        try {
          console.log(`🔍 Trying chain format: ${chain}`)
          const params = {
            chain: chain,
            addresses: [address],
            tokenTypes: ['native', 'erc20']
          }
          
          const mcpCall = this.callTool('get_wallet_portfolio', params)
          const result = await Promise.race([mcpCall, timeoutPromise])
          
          // Check if the result contains valid data
          if (result && result.content && result.content[0] && result.content[0].text) {
            const parsedContent = JSON.parse(result.content[0].text)
            if (parsedContent.success !== false && !parsedContent.error?.includes('validation failed')) {
              console.log(`✅ Success with chain format: ${chain}`)
              return parsedContent
            } else {
              console.log(`❌ Chain ${chain} returned error:`, parsedContent.error)
            }
          }
        } catch (error) {
          console.log(`❌ Chain ${chain} failed:`, error.message)
          if (error.message.includes('timeout')) {
            console.log('⏰ MCP call timed out, falling back to direct API')
            break
          }
        }
      }
      
      throw new Error('All MCP chain formats failed or timed out')
    } catch (error) {
      console.error('❌ Portfolio fetch failed:', error.message)
      throw error
    }
  }

  async getTokens(address) {
    return await this.callTool('get_tokens', { address })
  }

  async getTransactionHistory(address, limit = 10) {
    return await this.callTool('get_transaction_history', { address, limit })
  }

  async getNFTMetadata(address) {
    return await this.callTool('get_metadata', { address })
  }

  async getExchangeRate(baseCurrency, quoteCurrency = 'USD') {
    return await this.callTool('get_exchange_rate', { baseCurrency, quoteCurrency })
  }

  async checkMaliciousAddress(address) {
    return await this.callTool('check_malicious_address', { address })
  }

  // New MCP tool methods
  async getSupportedMethods() {
    return await this.callTool('gateway_get_supported_methods')
  }

  async executeRPC(method, params, network) {
    return await this.callTool('gateway_execute_rpc', { method, params, network })
  }

  async getWalletBalanceByTime(address, timestamp, network) {
    return await this.callTool('get_wallet_balance_by_time', { address, timestamp, network })
  }

  async getOwners(contractAddress, tokenId) {
    return await this.callTool('get_owners', { contractAddress, tokenId })
  }

  async checkOwner(contractAddress, tokenId, address) {
    return await this.callTool('check_owner', { contractAddress, tokenId, address })
  }

  async getBlockByTime(timestamp, network) {
    return await this.callTool('get_block_by_time', { timestamp, network })
  }

  // Get supported chains with static fallback to prevent infinite loading
  async getSupportedChains() {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chains call timeout')), 3000)
      })
      
      const chainsCall = this.callTool('gateway_get_supported_chains')
      const result = await Promise.race([chainsCall, timeoutPromise])
      
      if (result && result.content?.[0]?.text) {
        const parsed = JSON.parse(result.content[0].text)
        // Make sure we return an array, not a string that gets split into characters
        if (parsed.chains && Array.isArray(parsed.chains)) {
          return { chains: parsed.chains }
        }
      }
    } catch (error) {
      console.log('❌ Failed to get supported chains:', error.message)
    }
    
    // Always return a static, safe list
    return { 
      chains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'] 
    }
  }

  // Get exchange rate with timeout
  async getExchangeRateWithTimeout(baseCurrency, quoteCurrency = 'USD') {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Exchange rate timeout')), 3000)
      })
      
      const rateCall = this.callTool('get_exchange_rate', { baseCurrency, quoteCurrency })
      const result = await Promise.race([rateCall, timeoutPromise])
      
      if (result && result.content?.[0]?.text) {
        return JSON.parse(result.content[0].text)
      }
      return { rate: 0 }
    } catch (error) {
      console.log(`❌ Exchange rate failed for ${baseCurrency}:`, error.message)
      return { rate: 0 }
    }
  }
}
