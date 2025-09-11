import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { TatumService } from './services/tatumService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Tatum service
const tatumService = new TatumService()

// Check if Tatum API key is configured
if (!process.env.TATUM_API_KEY) {
  console.warn('⚠️  TATUM_API_KEY not found in environment variables')
  console.warn('   Add your API key to .env file for live blockchain data')
  console.warn('   Currently using mock data for demonstration')
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tatum Maxi API is running' })
})

// MCP Status endpoint
app.get('/api/mcp/status', (req, res) => {
  res.json({ 
    mcpConnected: tatumService.mcpConnected,
    hasApiKey: !!tatumService.apiKey,
    message: tatumService.mcpConnected ? 'MCP is connected and active' : 'Using direct API calls (MCP not available)'
  })
})

// Test endpoint for debugging MCP calls
app.get('/api/mcp/test/:address', async (req, res) => {
  try {
    const { address } = req.params
    console.log(`🧪 Testing MCP calls for address: ${address}`)
    
    // Test 1: Get supported chains
    console.log('🔍 Test 1: Getting supported chains...')
    const chains = await tatumService.mcpClient.callTool('gateway_get_supported_chains')
    console.log('✅ Supported chains result:', JSON.stringify(chains, null, 2))
    
    // Test 2: Try simple get_wallet_portfolio
    console.log('🔍 Test 2: Simple wallet portfolio call...')
    const simplePortfolio = await tatumService.mcpClient.callTool('get_wallet_portfolio', { address })
    console.log('✅ Simple portfolio result:', JSON.stringify(simplePortfolio, null, 2))
    
    res.json({
      chains,
      simplePortfolio,
      address
    })
  } catch (error) {
    console.error('❌ MCP test error:', error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

// Portfolio endpoint - get wallet portfolio data
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params
    console.log(`📊 Portfolio request for address: ${address}`)
    
    const portfolioData = await tatumService.getPortfolioData(address)
    res.json(portfolioData)
  } catch (error) {
    console.error('Portfolio API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch portfolio data',
      details: error.message 
    })
  }
})

// Supported chains endpoint
app.get('/api/chains', async (req, res) => {
  try {
    console.log('🔗 Supported chains request')
    const chains = await tatumService.getSupportedChains()
    res.json(chains)
  } catch (error) {
    console.error('Chains API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch supported chains',
      details: error.message 
    })
  }
})

// Exchange rates endpoint
app.get('/api/rates', async (req, res) => {
  try {
    const { currencies } = req.query
    const currencyList = currencies ? currencies.split(',').slice(0, 5) : ['ETH', 'BTC', 'MATIC'] // Limit to prevent blocking
    
    console.log(`💱 Exchange rates request for: ${currencyList.join(', ')}`)
    const rates = await tatumService.getExchangeRates(currencyList)
    res.json({ rates, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Rates API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch exchange rates',
      details: error.message 
    })
  }
})

// Transaction history endpoint
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    // Validate address format
    if (!tatumService.isValidAddress(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        details: 'Please provide a valid Ethereum, Polygon, or Solana address'
      })
    }

    console.log(`Fetching portfolio for address: ${address}`)
    
    const portfolioData = await tatumService.getPortfolioData(address)
    
    res.json(portfolioData)
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    res.status(500).json({ 
      error: 'Failed to fetch portfolio data',
      details: error.message 
    })
  }
})

// Get transaction history for a wallet address
app.get('/api/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { chain = 'ethereum', limit = 10 } = req.query
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    const transactions = await tatumService.getTransactions(address, chain, parseInt(limit))
    
    res.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    })
  }
})

// Get NFT data for a wallet address
app.get('/api/nfts/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    const nfts = await tatumService.getNFTs(address)
    
    res.json({ nfts })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    res.status(500).json({ 
      error: 'Failed to fetch NFT data',
      details: error.message 
    })
  }
})

// AI Portfolio Analysis endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { walletAddress, query } = req.body

    if (!walletAddress || !query) {
      return res.status(400).json({ 
        error: 'Wallet address and query are required' 
      })
    }

    console.log(`🤖 AI Analysis request: "${query}" for wallet ${walletAddress}`)

    // Get fresh comprehensive portfolio data with real-time prices
    const portfolioData = await tatumService.getComprehensivePortfolio(walletAddress)
    
    // Enhanced AI analysis based on real-time blockchain data
    const analysis = await analyzePortfolioQuery(portfolioData, query)
    
    res.json({
      analysis,
      portfolioData,
      timestamp: new Date().toISOString(),
      query
    })

  } catch (error) {
    console.error('AI Analysis error:', error)
    res.status(500).json({ 
      error: 'Failed to analyze portfolio',
      details: error.message 
    })
  }
})

async function analyzePortfolioQuery(portfolioData, query) {
  const lowerQuery = query.toLowerCase()
  
  // Extract all holdings from all chains with real-time data
  const allHoldings = []
  let totalValue = 0
  
  portfolioData.chains?.forEach(chain => {
    // Add native token with real balance
    const nativeHolding = {
      symbol: chain.symbol,
      balance: parseFloat(chain.balance),
      usdValue: chain.usdValue,
      chain: chain.name,
      type: 'native',
      priceUsd: chain.usdValue / parseFloat(chain.balance) // Calculate price per token
    }
    allHoldings.push(nativeHolding)
    totalValue += chain.usdValue
    
    // Add tokens with real balance data
    chain.tokens?.forEach(token => {
      const tokenHolding = {
        symbol: token.symbol,
        balance: parseFloat(token.balance),
        usdValue: token.usdValue || 0,
        chain: chain.name,
        type: 'token',
        contractAddress: token.contractAddress,
        priceUsd: token.usdValue && parseFloat(token.balance) > 0 ? token.usdValue / parseFloat(token.balance) : 0
      }
      allHoldings.push(tokenHolding)
      totalValue += tokenHolding.usdValue
    })
  })

  // Real-time diversification analysis
  if (lowerQuery.includes('diversity') || lowerQuery.includes('diversification') || lowerQuery.includes('spread')) {
    const chainDistribution = {}
    const tokenTypeDistribution = { native: 0, token: 0 }
    
    allHoldings.forEach(holding => {
      if (!chainDistribution[holding.chain]) {
        chainDistribution[holding.chain] = 0
      }
      chainDistribution[holding.chain] += holding.usdValue
      tokenTypeDistribution[holding.type] += holding.usdValue
    })
    
    const diversityReport = Object.entries(chainDistribution)
      .map(([chain, value]) => ({
        chain,
        value,
        percentage: ((value / totalValue) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
    
    let analysis = "🔍 REAL-TIME Portfolio Diversification Analysis:\n\n"
    analysis += `💰 Total Portfolio Value: $${totalValue.toFixed(2)}\n\n`
    analysis += "📊 Chain Distribution:\n"
    
    diversityReport.forEach(item => {
      analysis += `${item.chain.toUpperCase()}: $${item.value.toFixed(2)} (${item.percentage}%)\n`
    })
    
    const dominantChain = diversityReport[0]
    const nativeVsTokens = `\n💎 Asset Types:\n• Native tokens: $${tokenTypeDistribution.native.toFixed(2)} (${((tokenTypeDistribution.native/totalValue)*100).toFixed(1)}%)\n• ERC-20/SPL tokens: $${tokenTypeDistribution.token.toFixed(2)} (${((tokenTypeDistribution.token/totalValue)*100).toFixed(1)}%)\n`
    analysis += nativeVsTokens
    
    if (parseFloat(dominantChain.percentage) > 70) {
      analysis += `\n⚠️ HIGH CONCENTRATION RISK: ${dominantChain.chain.toUpperCase()} represents ${dominantChain.percentage}% of your portfolio. Consider diversifying!`
    } else if (parseFloat(dominantChain.percentage) < 40) {
      analysis += `\n✅ WELL DIVERSIFIED: Good distribution across multiple chains!`
    } else {
      analysis += `\n⚖️ MODERATE CONCENTRATION: ${dominantChain.chain.toUpperCase()} dominance is reasonable at ${dominantChain.percentage}%`
    }
    
    return analysis
  }

  // Real-time risk analysis
  if (lowerQuery.includes('risk') || lowerQuery.includes('exposure') || lowerQuery.includes('danger')) {
    const riskAnalysis = {
      whale: allHoldings.filter(h => h.usdValue > 10000),
      highValue: allHoldings.filter(h => h.usdValue > 1000 && h.usdValue <= 10000),
      mediumValue: allHoldings.filter(h => h.usdValue > 100 && h.usdValue <= 1000),
      lowValue: allHoldings.filter(h => h.usdValue <= 100 && h.usdValue > 1),
      dustTokens: allHoldings.filter(h => h.usdValue <= 1 && h.usdValue > 0)
    }
    
    let analysis = "⚠️ REAL-TIME Risk & Exposure Analysis:\n\n"
    analysis += `💰 Total at Risk: $${totalValue.toFixed(2)}\n\n`
    analysis += `🐋 Whale positions (>$10K): ${riskAnalysis.whale.length}\n`
    analysis += `💎 High-value positions ($1K-$10K): ${riskAnalysis.highValue.length}\n`
    analysis += `💰 Medium positions ($100-$1K): ${riskAnalysis.mediumValue.length}\n`
    analysis += `💵 Small positions ($1-$100): ${riskAnalysis.lowValue.length}\n`
    analysis += `🗑️ Dust tokens (<$1): ${riskAnalysis.dustTokens.length}\n\n`
    
    const highRiskHoldings = [...riskAnalysis.whale, ...riskAnalysis.highValue]
    if (highRiskHoldings.length > 0) {
      analysis += "⚡ MAJOR RISK EXPOSURES:\n"
      highRiskHoldings
        .sort((a, b) => b.usdValue - a.usdValue)
        .slice(0, 5)
        .forEach((holding, index) => {
          const riskLevel = holding.usdValue > 10000 ? '🔴' : '🟡'
          analysis += `${riskLevel} ${index + 1}. ${holding.balance.toFixed(4)} ${holding.symbol} = $${holding.usdValue.toFixed(2)} (${holding.chain})\n`
        })
    }
    
    // Smart Contract Risk Assessment
    const tokenHoldings = allHoldings.filter(h => h.type === 'token')
    if (tokenHoldings.length > 0) {
      analysis += `\n🔒 Smart Contract Risk: ${tokenHoldings.length} token contracts\n`
      if (tokenHoldings.length > 20) {
        analysis += "⚠️ HIGH: Many token contracts increase smart contract risk"
      } else if (tokenHoldings.length > 10) {
        analysis += "⚖️ MEDIUM: Moderate token diversification"
      } else {
        analysis += "✅ LOW: Conservative token exposure"
      }
    }
    
    return analysis
  }

  // Real-time performance insights
  if (lowerQuery.includes('performance') || lowerQuery.includes('gains') || lowerQuery.includes('profit') || lowerQuery.includes('top') || lowerQuery.includes('best')) {
    let analysis = "📈 REAL-TIME Performance Insights:\n\n"
    analysis += `💰 Current Portfolio Value: $${totalValue.toFixed(2)}\n`
    analysis += `📊 Active Positions: ${allHoldings.filter(h => h.usdValue > 0).length}\n\n`
    
    const topHoldings = allHoldings
      .filter(h => h.usdValue > 0)
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 10)
    
    analysis += "🏆 TOP PERFORMERS BY VALUE:\n"
    topHoldings.forEach((holding, index) => {
      const percentage = ((holding.usdValue / totalValue) * 100).toFixed(1)
      const priceInfo = holding.priceUsd > 0 ? ` @ $${holding.priceUsd.toFixed(holding.priceUsd < 1 ? 6 : 2)}` : ''
      analysis += `${index + 1}. ${holding.balance.toFixed(4)} ${holding.symbol}${priceInfo} = $${holding.usdValue.toFixed(2)} (${percentage}%)\n`
    })
    
    // Portfolio concentration analysis
    const top3Value = topHoldings.slice(0, 3).reduce((sum, h) => sum + h.usdValue, 0)
    const concentrationRatio = (top3Value / totalValue) * 100
    
    analysis += `\n📊 Portfolio Concentration:\n`
    analysis += `Top 3 holdings: ${concentrationRatio.toFixed(1)}% of total value\n`
    
    if (concentrationRatio > 80) {
      analysis += "⚠️ HIGH CONCENTRATION: Consider diversifying your top holdings"
    } else if (concentrationRatio > 60) {
      analysis += "⚖️ MODERATE CONCENTRATION: Reasonable but watch for over-exposure"
    } else {
      analysis += "✅ WELL DISTRIBUTED: Good balance across holdings"
    }
    
    return analysis
  }

  // Real-time investment recommendations
  if (lowerQuery.includes('recommendations') || lowerQuery.includes('advice') || lowerQuery.includes('suggest') || lowerQuery.includes('should')) {
    let recommendations = "💡 REAL-TIME Investment Recommendations:\n\n"
    
    const dustTokens = allHoldings.filter(h => h.usdValue <= 5 && h.usdValue > 0)
    const chainCount = new Set(allHoldings.map(h => h.chain)).size
    const dominantHolding = allHoldings.sort((a, b) => b.usdValue - a.usdValue)[0]
    
    recommendations += `📊 Portfolio Health Check:\n`
    recommendations += `• Total Value: $${totalValue.toFixed(2)}\n`
    recommendations += `• Active Positions: ${allHoldings.filter(h => h.usdValue > 0).length}\n`
    recommendations += `• Chains: ${chainCount}\n• Dust Tokens: ${dustTokens.length}\n\n`
    
    recommendations += `🎯 ACTIONABLE RECOMMENDATIONS:\n`
    
    if (dustTokens.length > 15) {
      recommendations += `1. 🧹 CLEANUP: You have ${dustTokens.length} dust tokens (<$5). Consider consolidating to reduce gas fees.\n\n`
    }
    
    if (chainCount === 1) {
      recommendations += `2. 🌐 DIVERSIFY: All funds on ${[...new Set(allHoldings.map(h => h.chain))][0].toUpperCase()}. Consider multi-chain exposure.\n\n`
    }
    
    if (dominantHolding && (dominantHolding.usdValue / totalValue) > 0.6) {
      recommendations += `3. ⚖️ REBALANCE: ${dominantHolding.symbol} is ${((dominantHolding.usdValue / totalValue) * 100).toFixed(1)}% of portfolio. Consider taking profits.\n\n`
    }
    
    if (totalValue < 1000) {
      recommendations += `4. 📈 ACCUMULATE: Portfolio under $1K. Focus on DCA into blue-chip assets (ETH, BTC, SOL).\n\n`
    } else if (totalValue > 50000) {
      recommendations += `4. 🔐 SECURE: High-value portfolio. Consider hardware wallet and insurance.\n\n`
    }
    
    // Chain-specific recommendations
    const ethValue = allHoldings.filter(h => h.chain === 'ethereum').reduce((sum, h) => sum + h.usdValue, 0)
    const polyValue = allHoldings.filter(h => h.chain === 'polygon').reduce((sum, h) => sum + h.usdValue, 0)
    const solValue = allHoldings.filter(h => h.chain === 'solana').reduce((sum, h) => sum + h.usdValue, 0)
    
    if (ethValue > polyValue + solValue) {
      recommendations += `5. 💸 GAS OPTIMIZATION: Heavy Ethereum exposure. Consider moving some assets to Polygon/Solana for lower fees.\n\n`
    }
    
    recommendations += `💎 Remember: This analysis is based on current market data. Always DYOR (Do Your Own Research)!`
    
    return recommendations
  }

  // Default comprehensive real-time analysis
  if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('status')) {
    let summary = `📊 REAL-TIME Portfolio Overview:\n\n`
    summary += `💰 Total Value: $${totalValue.toFixed(2)}\n`
    summary += `🔗 Chains: ${new Set(allHoldings.map(h => h.chain)).size}\n`
    summary += `💎 Active Positions: ${allHoldings.filter(h => h.usdValue > 0).length}\n\n`
    
    portfolioData.chains?.forEach(chain => {
      const chainTokens = allHoldings.filter(h => h.chain === chain.name && h.type === 'token')
      summary += `${chain.name.toUpperCase()}: ${parseFloat(chain.balance).toFixed(4)} ${chain.symbol} ($${chain.usdValue.toFixed(2)})`
      if (chainTokens.length > 0) {
        summary += ` + ${chainTokens.length} token${chainTokens.length !== 1 ? 's' : ''}`
      }
      summary += '\n'
    })
    
    return summary
  }

  // Fallback with suggestions for real-time queries
  return `🤖 I can provide REAL-TIME analysis of your $${totalValue.toFixed(2)} portfolio!\n\nTry asking:
  
🔍 "Analyze my portfolio diversification"
⚠️ "What's my risk exposure?"
📈 "Show me performance insights"
💡 "Give me investment recommendations"
📊 "Portfolio summary"

💎 All data is live from the blockchain via Tatum API!`
}

app.listen(PORT, () => {
  console.log(`🚀 Tatum Maxi server running on port ${PORT}`)
  console.log(`📊 API endpoints available:`)
  console.log(`   GET /api/health`)
  console.log(`   GET /api/mcp/status`)
  console.log(`   GET /api/portfolio/:address`)
  console.log(`   GET /api/chains`)
  console.log(`   GET /api/rates`)
  console.log(`   GET /api/transactions/:address`)
  console.log(`   GET /api/nfts/:address`)
  console.log(`   POST /api/ai/analyze`)
  console.log(``)
  console.log(`🔗 MCP Integration:`)
  console.log(`   Config: mcp-config.json`)
  console.log(`   Status: ${process.env.TATUM_API_KEY ? 'API key configured' : 'API key required'}`)
  console.log(`   Check: curl http://localhost:${PORT}/api/mcp/status`)
})
