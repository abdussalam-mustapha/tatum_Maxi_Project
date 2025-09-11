import { MCPClient } from './mcpClient.js'

export class TatumService {
  constructor() {
    this.apiKey = process.env.TATUM_API_KEY
    this.baseURL = 'https://api.tatum.io'
    
    // Use MCPClient for all platforms - it has WSL detection built-in
    this.mcpClient = new MCPClient()
    console.log('� Initializing Tatum MCP client...')
    
    this.mcpConnected = false
    
    // Try to connect to MCP server on startup
    this.initializeMCP()
  }

  async initializeMCP() {
    if (this.apiKey) {
      try {
        console.log('🔗 Attempting to connect to Tatum MCP server...')
        this.mcpConnected = await this.mcpClient.connect()
        if (this.mcpConnected) {
          console.log('🚀 Tatum MCP client initialized successfully')
          console.log('✅ Windows MCP compatibility mode active')
        } else {
          console.log('⚠️  MCP connection failed, using direct API calls')
        }
      } catch (error) {
        console.warn('⚠️  Could not initialize MCP client:', error.message)
        console.log('📡 Will use direct Tatum API calls with your API key')
        this.mcpConnected = false
      }
    } else {
      console.warn('⚠️  No TATUM_API_KEY found - using mock data for demonstration')
    }
  }

  // Get portfolio data using Tatum MCP or direct API
  async getPortfolioData(address) {
    try {
      if (!this.isValidAddress(address)) {
        throw new Error('Invalid wallet address format')
      }

      console.log(`Fetching portfolio for address: ${address}`)

      // Try MCP client first
      if (this.mcpConnected) {
        try {
          console.log('🔗 Trying MCP get_wallet_portfolio tool...')
          const portfolioResult = await this.mcpClient.getWalletPortfolio(address)
          
          if (portfolioResult && portfolioResult.content?.[0]?.text) {
            const portfolioData = JSON.parse(portfolioResult.content[0].text)
            console.log('✅ MCP Portfolio data received:', portfolioData)
            return this.formatPortfolioData(portfolioData)
          }
        } catch (mcpError) {
          console.log('⚠️  MCP call failed, falling back to direct API:', mcpError.message)
        }
      }

      // Fallback to direct Tatum API calls
      console.log('📡 Using direct Tatum API calls')
      return await this.getPortfolioDataDirect(address)

    } catch (error) {
      console.error('Error fetching portfolio:', error)
      throw error
    }
  }

  // Get comprehensive portfolio data with enhanced MCP features
  async getComprehensivePortfolio(address) {
    try {
      const portfolioData = await this.getPortfolioData(address)
      
      // Try to enhance with additional MCP data
      if (this.mcpConnected) {
        try {
          // Add security check
          const securityCheck = await this.mcpClient.checkMaliciousAddress(address)
          portfolioData.security = {
            isMalicious: securityCheck?.isKnownMalicious || false,
            checked: true
          }
          
          // Add recent transaction count
          const recentTxs = await this.mcpClient.getTransactionHistory(address, 5)
          portfolioData.recentActivity = {
            transactionCount: recentTxs?.length || 0,
            hasRecentActivity: (recentTxs?.length || 0) > 0
          }
          
          // Add metadata if available
          const metadata = await this.mcpClient.getMetadata(address)
          if (metadata) {
            portfolioData.metadata = metadata
          }
          
        } catch (enhanceError) {
          console.log('MCP enhancement failed:', enhanceError.message)
          // Continue with basic portfolio data
        }
      }
      
      return portfolioData
    } catch (error) {
      console.error('Comprehensive portfolio error:', error)
      throw error
    }
  }

  // Direct API implementation
  async getPortfolioDataDirect(address) {
    console.log('🔗 Fetching portfolio using direct Tatum API...')
    
    const portfolioData = {
      address,
      chains: [],
      totalUsdValue: 0
    }

    // Determine compatible chains based on address format
    const compatibleChains = this.getCompatibleChains(address)
    console.log(`📋 Compatible chains for address ${address.substring(0, 10)}...: ${compatibleChains.join(', ')}`)
    
    for (const chain of compatibleChains) {
      try {
        const chainData = await this.getChainBalance(address, chain)
        // Always add chain data, even with 0 balance, for better UX
        portfolioData.chains.push(chainData)
        portfolioData.totalUsdValue += chainData.usdValue || 0
      } catch (error) {
        console.log(`Error fetching ${chain} data:`, error.message)
        // Add chain with 0 balance even if there's an error
        const chainConfig = {
          ethereum: { symbol: 'ETH', name: 'Ethereum' },
          polygon: { symbol: 'MATIC', name: 'Polygon' },
          solana: { symbol: 'SOL', name: 'Solana' },
          bsc: { symbol: 'BNB', name: 'BNB Smart Chain' },
          arbitrum: { symbol: 'ETH', name: 'Arbitrum' },
          optimism: { symbol: 'ETH', name: 'Optimism' },
          avalanche: { symbol: 'AVAX', name: 'Avalanche' }
        }
        const config = chainConfig[chain]
        if (config) {
          portfolioData.chains.push({
            name: chain,
            symbol: config.symbol,
            balance: '0',
            usdValue: 0,
            tokens: []
          })
        }
      }
    }

    return portfolioData
  }

  // Determine compatible blockchain networks based on address format
  getCompatibleChains(address) {
    const chains = []
    
    // Ethereum-compatible (0x prefix, 42 characters)
    if (address.startsWith('0x') && address.length === 42) {
      chains.push('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche')
    }
    
    // Solana (base58, typically 32-44 characters, no 0x prefix)
    if (!address.startsWith('0x') && address.length >= 32 && address.length <= 44) {
      // Basic validation for Solana address format
      if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
        chains.push('solana')
      }
    }
    
    // Bitcoin (starts with 1, 3, or bc1)
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
        /^bc1[a-z0-9]{39,59}$/.test(address)) {
      chains.push('bitcoin')
    }
    
    // If no specific format detected, default to Ethereum-compatible
    if (chains.length === 0 && address.startsWith('0x')) {
      chains.push('ethereum', 'polygon')
    }
    
    return chains
  }

  async getChainBalance(address, chain) {
    const chainConfig = {
      ethereum: { symbol: 'ETH', endpoint: 'v3/ethereum/account/balance' },
      polygon: { symbol: 'MATIC', endpoint: 'v3/polygon/account/balance' },
      bsc: { symbol: 'BNB', endpoint: 'v3/bsc/account/balance' },
      arbitrum: { symbol: 'ETH', endpoint: 'v3/arbitrum/account/balance' },
      optimism: { symbol: 'ETH', endpoint: 'v3/optimism/account/balance' },
      avalanche: { symbol: 'AVAX', endpoint: 'v3/avalanche/account/balance' },
      solana: { symbol: 'SOL', endpoint: 'v3/solana/account/balance' }
    }

    const config = chainConfig[chain]
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    try {
      const url = `${this.baseURL}/${config.endpoint}/${address}`
      const response = await fetch(url, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`${chain} balance data:`, data)

      let balance = '0'
      
      // Handle different response formats
      if (data.balance !== undefined) {
        balance = data.balance
      } else if (data.value !== undefined) {
        balance = data.value
      } else if (data.result !== undefined) {
        balance = data.result
      }

      // Convert balance and get USD value
      const balanceNum = parseFloat(balance)
      const usdValue = await this.getUSDValue(config.symbol, balanceNum)

      const chainData = {
        name: chain,
        symbol: config.symbol,
        balance: balance,
        usdValue: usdValue,
        tokens: []
      }

      // Try to fetch tokens for this chain and address
      try {
        const tokens = await this.getTokenBalances(address, chain)
        chainData.tokens = tokens
        
        // Add token values to chain total
        const tokenUsdValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0)
        chainData.usdValue += tokenUsdValue
      } catch (tokenError) {
        console.log(`Could not fetch tokens for ${chain}:`, tokenError.message)
      }

      return chainData
    } catch (error) {
      console.error(`Error fetching ${chain} balance:`, error)
      throw error
    }
  }

  async getTokenBalances(address, chain) {
    // This would require additional API calls to get token balances
    // For now, return empty array but this can be expanded
    return []
  }

  async getUSDValue(symbol, amount) {
    try {
      // Use CoinGecko API for price data
      const symbolMap = {
        'ETH': 'ethereum',
        'MATIC': 'polygon',
        'SOL': 'solana'
      }
      
      const coinId = symbolMap[symbol] || symbol.toLowerCase()
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
      
      if (response.ok) {
        const data = await response.json()
        const price = data[coinId]?.usd || 0
        return amount * price
      }
      
      return 0
    } catch (error) {
      console.error(`Error fetching USD value for ${symbol}:`, error)
      return 0
    }
  }

  formatPortfolioData(data) {
    // Format the portfolio data for consistency
    return {
      address: data.address || '',
      chains: data.chains || [],
      totalUsdValue: data.totalUsdValue || 0
    }
  }

  // Enhanced method to get comprehensive portfolio data with prices and metadata
  async getComprehensivePortfolio(address) {
    try {
      const portfolioData = await this.getPortfolioData(address)
      
      // Enhance with additional real-time data
      if (portfolioData.chains) {
        for (let chain of portfolioData.chains) {
          // Get current price for native tokens
          if (chain.balance && parseFloat(chain.balance) > 0) {
            try {
              const price = await this.getCurrentPrice(chain.symbol)
              chain.currentPrice = price
            } catch (error) {
              console.log(`Could not fetch price for ${chain.symbol}:`, error.message)
            }
          }
        }
      }
      
      return portfolioData
    } catch (error) {
      console.error('Error getting comprehensive portfolio:', error)
      throw error
    }
  }

  // Get current price for a token/coin
  async getCurrentPrice(symbol) {
    try {
      const symbolMap = {
        'ETH': 'ethereum',
        'MATIC': 'polygon',
        'SOL': 'solana'
      }
      
      const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase()
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
      
      if (response.ok) {
        const data = await response.json()
        return data[coinId]?.usd || 0
      }
      
      return 0
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      return 0
    }
  }

  // Utility method to validate wallet addresses
  isValidAddress(address) {
    // Ethereum/Polygon address format
    const ethRegex = /^0x[a-fA-F0-9]{40}$/
    // Solana address format
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    
    return ethRegex.test(address) || solanaRegex.test(address)
  }

  // Method to determine chain from address format
  getChainFromAddress(address) {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    
    if (ethRegex.test(address)) {
      return 'ethereum' // Could also be Polygon
    } else if (solanaRegex.test(address)) {
      return 'solana'
    }
    
    return null
  }

  // Get transaction history (placeholder for MCP integration)
  async getTransactions(address, chain = 'ethereum', limit = 10) {
    if (this.mcpConnected) {
      try {
        console.log('🔗 Trying MCP get_transaction_history tool...')
        const result = await this.mcpClient.getTransactionHistory(address, limit)
        if (result && result.content?.[0]?.text) {
          return JSON.parse(result.content[0].text)
        }
      } catch (error) {
        console.log('MCP transaction history failed:', error.message)
      }
    }

    // Fallback to mock data
    return {
      transactions: [
        {
          hash: '0x...',
          from: address,
          to: '0x...',
          value: '0.1',
          timestamp: Date.now() - 86400000,
          type: 'sent'
        }
      ]
    }
  }

  // Get NFT data (placeholder for MCP integration)
  async getNFTs(address) {
    if (this.mcpConnected) {
      try {
        console.log('🔗 Trying MCP get_metadata tool...')
        const result = await this.mcpClient.getNFTMetadata(address)
        if (result && result.content?.[0]?.text) {
          return JSON.parse(result.content[0].text)
        }
      } catch (error) {
        console.log('MCP NFT data failed:', error.message)
      }
    }

    // Fallback to mock data
    return {
      nfts: []
    }
  }

  // Get comprehensive portfolio data with enhanced MCP features
  async getComprehensivePortfolio(address) {
    try {
      const portfolioData = await this.getPortfolioData(address)
      
      // Try to enhance with additional MCP data
      if (this.mcpConnected) {
        try {
          // Add security check
          const securityCheck = await this.mcpClient.checkMaliciousAddress(address)
          portfolioData.security = {
            isMalicious: securityCheck?.isKnownMalicious || false,
            checked: true
          }
          
          // Add recent transaction count
          const recentTxs = await this.mcpClient.getTransactionHistory(address, 5)
          portfolioData.recentActivity = {
            transactionCount: recentTxs?.length || 0,
            hasRecentActivity: (recentTxs?.length || 0) > 0
          }
          
          // Add metadata if available
          const metadata = await this.mcpClient.getMetadata(address)
          if (metadata) {
            portfolioData.metadata = metadata
          }
          
        } catch (enhanceError) {
          console.log('MCP enhancement failed:', enhanceError.message)
          // Continue with basic portfolio data
        }
      }
      
      return portfolioData
    } catch (error) {
      console.error('Comprehensive portfolio error:', error)
      throw error
    }
  }
  async getSupportedChains() {
    if (this.mcpConnected) {
      try {
        console.log('🔗 Getting supported chains from MCP...')
        return await this.mcpClient.getSupportedChains()
      } catch (error) {
        console.log('MCP supported chains failed:', error.message)
      }
    }
    
    // Fallback list
    return {
      chains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche', 'solana']
    }
  }

  // Get exchange rates efficiently
  async getExchangeRates(currencies = ['ETH', 'BTC', 'MATIC']) {
    const rates = {}
    
    if (this.mcpConnected) {
      console.log('💱 Getting exchange rates from MCP...')
      // Process currencies in parallel but with timeout
      const ratePromises = currencies.map(async (currency) => {
        try {
          const rate = await this.mcpClient.getExchangeRateWithTimeout(currency, 'USD')
          return { currency, rate: rate.rate || 0 }
        } catch (error) {
          console.log(`Exchange rate for ${currency} failed:`, error.message)
          return { currency, rate: 0 }
        }
      })
      
      const results = await Promise.allSettled(ratePromises)
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          rates[result.value.currency] = result.value.rate
        } else {
          rates[currencies[index]] = 0
        }
      })
    } else {
      // Fallback to CoinGecko for basic rates
      for (const currency of currencies.slice(0, 3)) { // Limit to prevent blocking
        try {
          rates[currency] = await this.getCurrentPrice(currency)
        } catch (error) {
          rates[currency] = 0
        }
      }
    }
    
    return rates
  }
}
