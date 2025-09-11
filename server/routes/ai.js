const express = require('express')
const TatumService = require('../services/tatumService')

const router = express.Router()

// AI Portfolio Analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { walletAddress, query } = req.body

    if (!walletAddress || !query) {
      return res.status(400).json({ 
        error: 'Wallet address and query are required' 
      })
    }

    // Get fresh portfolio data
    const portfolioData = await TatumService.getWalletPortfolio(walletAddress)
    
    // Enhanced analysis based on query
    const analysis = await analyzePortfolioQuery(portfolioData, query)
    
    res.json({
      analysis,
      portfolioData
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
  
  // Extract all holdings from all chains
  const allHoldings = []
  
  portfolioData.chains?.forEach(chain => {
    // Add native token
    allHoldings.push({
      symbol: chain.symbol,
      balance: parseFloat(chain.balance),
      usdValue: chain.usdValue,
      chain: chain.name,
      type: 'native'
    })
    
    // Add tokens
    chain.tokens?.forEach(token => {
      allHoldings.push({
        symbol: token.symbol,
        balance: parseFloat(token.balance),
        usdValue: token.usdValue || 0,
        chain: chain.name,
        type: 'token',
        contractAddress: token.contractAddress
      })
    })
  })

  // Advanced portfolio analysis
  if (lowerQuery.includes('diversity') || lowerQuery.includes('diversification')) {
    const chainDistribution = {}
    let totalValue = 0
    
    allHoldings.forEach(holding => {
      if (!chainDistribution[holding.chain]) {
        chainDistribution[holding.chain] = 0
      }
      chainDistribution[holding.chain] += holding.usdValue
      totalValue += holding.usdValue
    })
    
    const diversityReport = Object.entries(chainDistribution)
      .map(([chain, value]) => ({
        chain,
        value,
        percentage: ((value / totalValue) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
    
    let analysis = "Portfolio Diversification Analysis:\n\n"
    diversityReport.forEach(item => {
      analysis += `${item.chain.toUpperCase()}: $${item.value.toFixed(2)} (${item.percentage}%)\n`
    })
    
    const dominantChain = diversityReport[0]
    if (parseFloat(dominantChain.percentage) > 70) {
      analysis += `\n⚠️ Your portfolio is heavily concentrated on ${dominantChain.chain.toUpperCase()} (${dominantChain.percentage}%). Consider diversifying across other chains.`
    } else if (parseFloat(dominantChain.percentage) < 40) {
      analysis += `\n✅ Good diversification across multiple chains!`
    }
    
    return analysis
  }

  if (lowerQuery.includes('risk') || lowerQuery.includes('exposure')) {
    const riskAnalysis = {
      highValue: allHoldings.filter(h => h.usdValue > 1000),
      mediumValue: allHoldings.filter(h => h.usdValue > 100 && h.usdValue <= 1000),
      lowValue: allHoldings.filter(h => h.usdValue <= 100 && h.usdValue > 1),
      dustTokens: allHoldings.filter(h => h.usdValue <= 1)
    }
    
    let analysis = "Risk & Exposure Analysis:\n\n"
    analysis += `💎 High-value holdings (>$1K): ${riskAnalysis.highValue.length}\n`
    analysis += `💰 Medium-value holdings ($100-$1K): ${riskAnalysis.mediumValue.length}\n`
    analysis += `💵 Low-value holdings ($1-$100): ${riskAnalysis.lowValue.length}\n`
    analysis += `🗑️ Dust tokens (<$1): ${riskAnalysis.dustTokens.length}\n\n`
    
    if (riskAnalysis.highValue.length > 0) {
      analysis += "Top Risk Exposures:\n"
      riskAnalysis.highValue
        .sort((a, b) => b.usdValue - a.usdValue)
        .slice(0, 3)
        .forEach(holding => {
          analysis += `• ${holding.balance.toFixed(4)} ${holding.symbol} ($${holding.usdValue.toFixed(2)}) on ${holding.chain}\n`
        })
    }
    
    return analysis
  }

  if (lowerQuery.includes('performance') || lowerQuery.includes('gains') || lowerQuery.includes('profit')) {
    // Note: This would require historical data, for now we'll provide portfolio composition
    let analysis = "Portfolio Performance Insights:\n\n"
    analysis += `Total Portfolio Value: $${portfolioData.totalUsdValue?.toFixed(2) || '0.00'}\n\n`
    
    const topHoldings = allHoldings
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 5)
    
    analysis += "Top 5 Holdings by Value:\n"
    topHoldings.forEach((holding, index) => {
      const percentage = ((holding.usdValue / portfolioData.totalUsdValue) * 100).toFixed(1)
      analysis += `${index + 1}. ${holding.balance.toFixed(4)} ${holding.symbol} - $${holding.usdValue.toFixed(2)} (${percentage}%)\n`
    })
    
    return analysis
  }

  if (lowerQuery.includes('recommendations') || lowerQuery.includes('advice') || lowerQuery.includes('suggest')) {
    let recommendations = "Portfolio Recommendations:\n\n"
    
    const totalValue = portfolioData.totalUsdValue || 0
    const dustTokens = allHoldings.filter(h => h.usdValue <= 5 && h.usdValue > 0)
    const chainCount = new Set(allHoldings.map(h => h.chain)).size
    
    if (dustTokens.length > 10) {
      recommendations += "🧹 Consider cleaning up dust tokens (worth <$5) to simplify your portfolio.\n\n"
    }
    
    if (chainCount === 1) {
      recommendations += "🌐 Consider diversifying across multiple blockchains to reduce risk.\n\n"
    }
    
    const dominantHolding = allHoldings.sort((a, b) => b.usdValue - a.usdValue)[0]
    if (dominantHolding && (dominantHolding.usdValue / totalValue) > 0.5) {
      recommendations += `⚖️ Your ${dominantHolding.symbol} holding represents ${((dominantHolding.usdValue / totalValue) * 100).toFixed(1)}% of your portfolio. Consider rebalancing.\n\n`
    }
    
    if (totalValue < 100) {
      recommendations += "📈 Consider DCA (Dollar Cost Averaging) to build your portfolio steadily.\n\n"
    } else if (totalValue > 10000) {
      recommendations += "🔐 Consider cold storage solutions for your high-value holdings.\n\n"
    }
    
    return recommendations
  }

  // Default comprehensive analysis
  return `Portfolio Analysis for ${query}:\n\nI can provide detailed insights about:\n• Diversification analysis\n• Risk & exposure breakdown\n• Performance overview\n• Personalized recommendations\n\nTry asking: "Analyze my portfolio diversification" or "What's my risk exposure?"`
}

module.exports = router
