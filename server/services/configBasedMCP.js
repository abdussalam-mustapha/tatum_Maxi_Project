import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class ConfigBasedMCP {
  constructor() {
    this.client = null
    this.transport = null
    this.isConnected = false
    this.config = null
  }

  loadConfig() {
    try {
      const configPath = join(__dirname, '../../mcp-config.json')
      const configContent = readFileSync(configPath, 'utf8')
      this.config = JSON.parse(configContent)
      
      const tatumConfig = this.config.mcpServers?.tatumio
      if (!tatumConfig) {
        throw new Error('Tatum MCP server config not found in mcp-config.json')
      }
      
      console.log('📋 Loaded MCP config from mcp-config.json')
      console.log(`   Command: ${tatumConfig.command}`)
      console.log(`   Args: ${tatumConfig.args.join(' ')}`)
      console.log(`   Type: ${tatumConfig.type || 'stdio'}`)
      console.log(`   Disabled: ${tatumConfig.disabled || false}`)
      
      return tatumConfig
    } catch (error) {
      console.error('❌ Failed to load mcp-config.json:', error.message)
      throw error
    }
  }

  async connect() {
    try {
      console.log('🔗 Connecting to Tatum MCP using config-based approach...')
      
      // Load configuration from mcp-config.json
      const config = this.loadConfig()
      
      if (config.disabled) {
        console.log('⏭️ MCP server is disabled in configuration')
        return false
      }
      
      // Prepare environment variables
      const env = {
        ...process.env,
        ...config.env
      }
      
      console.log(`🔑 Using API Key: ${env.TATUM_API_KEY ? 'Set' : 'Missing'}`)
      console.log(`🖥️ Platform: ${process.platform}`)
      console.log(`🔧 Command: ${config.command} ${config.args.join(' ')}`)
      
      // Create transport using config
      this.transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: env,
        // Windows-specific options
        ...(process.platform === 'win32' && {
          windowsHide: true,
          shell: true  // Enable shell for Windows
        })
      })

      // Add event listeners for debugging
      this.transport.onclose = () => {
        console.log('🔌 MCP transport closed')
      }
      
      this.transport.onerror = (error) => {
        console.error('❌ MCP transport error:', error)
      }

      this.client = new Client({
        name: 'tatum-maxi-config-client',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      })

      // Add client event listeners
      this.client.onerror = (error) => {
        console.error('❌ MCP client error:', error)
      }

      console.log('⏳ Establishing MCP connection...')
      await this.client.connect(this.transport)
      
      console.log('🔍 Discovering available tools...')
      const tools = await this.client.listTools()
      const toolNames = tools.tools?.map(t => t.name) || []
      
      this.isConnected = true
      console.log('✅ MCP connection established successfully!')
      console.log(`📋 Available MCP tools (${toolNames.length}):`, toolNames.slice(0, 10).join(', '))
      if (toolNames.length > 10) {
        console.log(`   ... and ${toolNames.length - 10} more tools`)
      }
      
      // Log detailed tool information for debugging
      console.log('🔍 Detailed tool information:')
      for (const tool of tools.tools || []) {
        console.log(`   📋 ${tool.name}: ${tool.description}`)
        if (tool.inputSchema) {
          console.log(`      Parameters:`, JSON.stringify(tool.inputSchema, null, 6))
        }
      }
      
      // Test a simple tool call to verify connection
      try {
        console.log('🧪 Testing MCP connection with a simple call...')
        // Most MCP servers have a list_tools or similar basic function
        await this.client.listTools()
        console.log('✅ MCP connection test successful!')
      } catch (testError) {
        console.warn('⚠️ MCP connection established but test call failed:', testError.message)
      }
      
      return true
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error.message)
      console.error('📋 Full error details:', error)
      
      // Provide specific troubleshooting based on error type
      if (error.message.includes('ENOENT')) {
        console.log('💡 Command not found. Check:')
        console.log('   1. Is npx installed? Run: npx --version')
        console.log('   2. Is @tatumio/blockchain-mcp installed? Run: npm list -g @tatumio/blockchain-mcp')
        console.log('   3. Try: npm install -g @tatumio/blockchain-mcp')
      } else if (error.message.includes('spawn') || error.message.includes('EINVAL')) {
        console.log('💡 Process spawn error. Try:')
        console.log('   1. Run in Administrator mode')
        console.log('   2. Check antivirus/security software')
        console.log('   3. Verify PATH environment variable includes npm/npx')
      } else if (error.message.includes('EPIPE') || error.message.includes('connection')) {
        console.log('💡 Connection/pipe error. Check:')
        console.log('   1. TATUM_API_KEY is valid and active')
        console.log('   2. Network connectivity')
        console.log('   3. Try restarting the server')
      }
      
      this.isConnected = false
      return false
    }
  }

  async callTool(name, arguments_ = {}) {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected')
    }

    try {
      console.log(`🔧 Calling MCP tool: ${name}`)
      console.log(`📋 Parameters being sent:`, JSON.stringify(arguments_, null, 2))
      
      const result = await this.client.callTool({
        name,
        arguments: arguments_
      })
      
      console.log(`✅ MCP tool ${name} completed successfully`)
      console.log(`📤 Raw result:`, JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error(`❌ Error calling MCP tool ${name}:`, error.message)
      console.error(`📋 Parameters that failed:`, JSON.stringify(arguments_, null, 2))
      throw error
    }
  }

  async disconnect() {
    if (this.client && this.transport) {
      try {
        await this.client.close()
        await this.transport.close()
        this.isConnected = false
        console.log('🔌 Disconnected from MCP server')
      } catch (error) {
        console.warn('⚠️ Error during MCP disconnect:', error.message)
      }
    }
  }

  // Blockchain-specific methods
  async getWalletPortfolio(address) {
    console.log(`🔍 Getting portfolio for address: ${address}`)
    
    if (address.startsWith('0x')) {
      // The MCP tool requires ALL THREE parameters: chain, addresses, tokenTypes
      try {
        console.log(`🧪 Calling with all required parameters...`)
        const result = await this.callTool('get_wallet_portfolio', { 
          chain: 'ethereum',
          addresses: [address],
          tokenTypes: ['native', 'erc20']  // These are the token types Tatum expects
        })
        return { simple: true, result: result }
      } catch (error) {
        console.log(`❌ Ethereum call failed: ${error.message}`)
        
        // Try with different tokenTypes format
        try {
          console.log(`🧪 Trying different tokenTypes format...`)
          const result2 = await this.callTool('get_wallet_portfolio', { 
            chain: 'ethereum',
            addresses: [address],
            tokenTypes: ['NATIVE', 'FUNGIBLE']  // Try uppercase
          })
          return { simple: true, result: result2 }
        } catch (error2) {
          console.log(`❌ Alternative format failed: ${error2.message}`)
          
          // Try minimal tokenTypes
          try {
            console.log(`🧪 Trying minimal tokenTypes...`)
            const result3 = await this.callTool('get_wallet_portfolio', { 
              chain: 'ethereum',
              addresses: [address],
              tokenTypes: ['native']  // Just native tokens
            })
            return { simple: true, result: result3 }
          } catch (error3) {
            console.log(`❌ All attempts failed: ${error3.message}`)
            return { error: 'All portfolio calls failed', details: error3.message }
          }
        }
      }
    } else {
      // Solana address
      return await this.callTool('get_wallet_portfolio', { 
        chain: 'solana',
        addresses: [address],
        tokenTypes: ['native', 'spl']  // Solana token types
      })
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
    return await this.callTool('check_malicous_address', { address })
  }

  async getBalance(address, network) {
    return await this.callTool('get_balance', { address, network })
  }

  async getGasPrice(network) {
    return await this.callTool('get_gas_price', { network })
  }
}
