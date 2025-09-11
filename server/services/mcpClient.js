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
      
      // Windows-specific MCP connection
      const isWindows = process.platform === 'win32'
      
      // For Windows, use PowerShell to run npx
      let command, args
      
      if (isWindows) {
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
        ...(isWindows && {
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
      
      // Based on the error message, we need: chain, addresses, tokenTypes
      console.log('🔍 Using required parameters: chain, addresses, tokenTypes')
      const params = {
        chain: 'ethereum',
        addresses: [address],
        tokenTypes: ['native', 'erc20']
      }
      
      console.log('🔍 Calling get_wallet_portfolio with params:', JSON.stringify(params, null, 2))
      const result = await this.callTool('get_wallet_portfolio', params)
      
      // Check if the result contains an error in the content
      if (result && result.content && result.content[0] && result.content[0].text) {
        try {
          const parsedContent = JSON.parse(result.content[0].text)
          if (parsedContent.success === false) {
            console.log('❌ MCP returned error:', parsedContent.error)
            
            // If it's still missing parameters, try with more token types
            if (parsedContent.error.includes('Missing required parameters')) {
              console.log('🔍 Trying with more comprehensive parameters...')
              const expandedParams = {
                chain: 'ethereum',
                addresses: [address],
                tokenTypes: ['native', 'erc20', 'erc721', 'erc1155']
              }
              
              console.log('🔍 Expanded params:', JSON.stringify(expandedParams, null, 2))
              const expandedResult = await this.callTool('get_wallet_portfolio', expandedParams)
              
              if (expandedResult && expandedResult.content && expandedResult.content[0] && expandedResult.content[0].text) {
                const expandedParsed = JSON.parse(expandedResult.content[0].text)
                if (expandedParsed.success === true) {
                  console.log('✅ Success with expanded parameters!')
                  return expandedParsed
                }
              }
            }
            
            throw new Error(parsedContent.error)
          } else {
            console.log('✅ MCP call successful!')
            return parsedContent
          }
        } catch (parseError) {
          console.log('❌ Failed to parse MCP response:', parseError.message)
          console.log('Raw response:', result)
          throw parseError
        }
      }
      
      console.log('✅ MCP Portfolio result:', result)
      return result
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
    return await this.callTool('check_malicous_address', { address })
  }
}
