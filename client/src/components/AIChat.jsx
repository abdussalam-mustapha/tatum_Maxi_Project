import React, { useState } from 'react'
import { MessageCircle, Send, Bot, User } from 'lucide-react'

const AIChat = ({ portfolioData, walletAddress }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm your Portfolio AI assistant. I can help you analyze your crypto portfolio with advanced insights. Try asking:\n\n• 'What's my biggest holding?'\n• 'Analyze my portfolio diversification'\n• 'What's my risk exposure?'\n• 'Give me investment recommendations'\n• 'Show me performance insights'",
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const analyzePortfolio = (query) => {
    if (!portfolioData || !portfolioData.chains) {
      return "I don't have any portfolio data to analyze yet. Please enter a wallet address first!"
    }

    const lowerQuery = query.toLowerCase()

    // Biggest holding analysis
    if (lowerQuery.includes('biggest') || lowerQuery.includes('largest') || lowerQuery.includes('most valuable')) {
      let biggestHolding = null
      let maxValue = 0

      portfolioData.chains.forEach(chain => {
        if (chain.usdValue > maxValue) {
          maxValue = chain.usdValue
          biggestHolding = chain
        }
        
        chain.tokens?.forEach(token => {
          if (token.usdValue > maxValue) {
            maxValue = token.usdValue
            biggestHolding = { ...token, chain: chain.name }
          }
        })
      })

      if (biggestHolding) {
        if (biggestHolding.chain && biggestHolding.symbol !== biggestHolding.chain.toUpperCase()) {
          return `Your biggest holding is ${parseFloat(biggestHolding.balance).toFixed(4)} ${biggestHolding.symbol} worth $${biggestHolding.usdValue.toFixed(2)} on ${biggestHolding.chain}.`
        } else {
          return `Your biggest holding is ${parseFloat(biggestHolding.balance).toFixed(4)} ${biggestHolding.symbol} worth $${biggestHolding.usdValue.toFixed(2)}.`
        }
      }
      return "I couldn't find any holdings to analyze."
    }

    // Total value questions
    if (lowerQuery.includes('total') || lowerQuery.includes('worth') || lowerQuery.includes('value')) {
      const totalValue = portfolioData.totalUsdValue || 0
      const chainCount = portfolioData.chains?.length || 0
      return `Your total portfolio is worth $${totalValue.toFixed(2)} across ${chainCount} blockchain${chainCount !== 1 ? 's' : ''}.`
    }

    // Chain-specific questions
    if (lowerQuery.includes('ethereum') || lowerQuery.includes('eth')) {
      const ethChain = portfolioData.chains.find(c => c.name === 'ethereum')
      if (ethChain) {
        const tokenCount = ethChain.tokens?.length || 0
        return `On Ethereum: ${parseFloat(ethChain.balance).toFixed(4)} ETH ($${ethChain.usdValue.toFixed(2)}) + ${tokenCount} token${tokenCount !== 1 ? 's' : ''}.`
      }
      return "No Ethereum holdings found."
    }

    if (lowerQuery.includes('polygon') || lowerQuery.includes('matic')) {
      const polyChain = portfolioData.chains.find(c => c.name === 'polygon')
      if (polyChain) {
        const tokenCount = polyChain.tokens?.length || 0
        return `On Polygon: ${parseFloat(polyChain.balance).toFixed(4)} MATIC ($${polyChain.usdValue.toFixed(2)}) + ${tokenCount} token${tokenCount !== 1 ? 's' : ''}.`
      }
      return "No Polygon holdings found."
    }

    if (lowerQuery.includes('solana') || lowerQuery.includes('sol')) {
      const solChain = portfolioData.chains.find(c => c.name === 'solana')
      if (solChain) {
        const tokenCount = solChain.tokens?.length || 0
        return `On Solana: ${parseFloat(solChain.balance).toFixed(4)} SOL ($${solChain.usdValue.toFixed(2)}) + ${tokenCount} token${tokenCount !== 1 ? 's' : ''}.`
      }
      return "No Solana holdings found."
    }

    // Token filtering
    if (lowerQuery.includes('worth more than') || lowerQuery.includes('above')) {
      const match = lowerQuery.match(/(\$)?(\d+)/)
      if (match) {
        const threshold = parseFloat(match[2])
        const valuableAssets = []
        
        portfolioData.chains.forEach(chain => {
          if (chain.usdValue > threshold) {
            valuableAssets.push(`${parseFloat(chain.balance).toFixed(4)} ${chain.symbol} ($${chain.usdValue.toFixed(2)})`)
          }
          
          chain.tokens?.forEach(token => {
            if (token.usdValue > threshold) {
              valuableAssets.push(`${parseFloat(token.balance).toFixed(4)} ${token.symbol} ($${token.usdValue.toFixed(2)})`)
            }
          })
        })

        if (valuableAssets.length > 0) {
          return `Assets worth more than $${threshold}:\n${valuableAssets.join('\n')}`
        }
        return `No assets found worth more than $${threshold}.`
      }
    }

    // Token count
    if (lowerQuery.includes('how many tokens') || lowerQuery.includes('token count')) {
      let totalTokens = 0
      portfolioData.chains.forEach(chain => {
        totalTokens += chain.tokens?.length || 0
      })
      return `You have ${totalTokens} different token${totalTokens !== 1 ? 's' : ''} across all chains.`
    }

    // Summary/overview
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('breakdown')) {
      let summary = `Portfolio Summary:\n`
      summary += `Total Value: $${portfolioData.totalUsdValue.toFixed(2)}\n\n`
      
      portfolioData.chains.forEach(chain => {
        const tokenCount = chain.tokens?.length || 0
        summary += `${chain.name.toUpperCase()}: ${parseFloat(chain.balance).toFixed(4)} ${chain.symbol} ($${chain.usdValue.toFixed(2)})`
        if (tokenCount > 0) {
          summary += ` + ${tokenCount} token${tokenCount !== 1 ? 's' : ''}`
        }
        summary += '\n'
      })
      
      return summary
    }

    // Default response
    return `I can help you analyze your portfolio! Try asking me:
    
📊 Basic Queries:
• "What's my biggest holding?"
• "What's my total portfolio worth?"
• "Show me my Ethereum holdings"
• "What tokens are worth more than $100?"

🔍 Advanced Analysis (requires wallet data):
• "Analyze my portfolio diversification"
• "What's my risk exposure?"
• "Give me performance insights"
• "What are your investment recommendations?"
• "How diverse is my portfolio?"

💡 Just type your question naturally and I'll help you understand your crypto holdings!`
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      type: 'user',
      text: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    const query = input
    setInput('')
    setIsLoading(true)

    try {
      // Check if this is an advanced query that needs backend analysis
      const advancedKeywords = ['diversification', 'diversity', 'risk', 'exposure', 'performance', 'gains', 'profit', 'recommendations', 'advice', 'suggest']
      const needsBackendAnalysis = advancedKeywords.some(keyword => query.toLowerCase().includes(keyword))
      
      let analysisText = ''
      
      if (needsBackendAnalysis && walletAddress) {
        // Use backend AI analysis for advanced queries
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            query
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          analysisText = data.analysis
        } else {
          throw new Error('Backend analysis failed')
        }
      } else {
        // Use local analysis for simple queries
        analysisText = analyzePortfolio(query)
      }
      
      const botResponse = {
        type: 'bot',
        text: analysisText,
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      const errorResponse = {
        type: 'bot',
        text: 'Sorry, I encountered an error while analyzing your portfolio. Please try again or ask a different question.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-2xl border w-96 h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">Portfolio AI</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="flex-shrink-0">
                <Bot className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.text}
            </div>
            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <Bot className="h-6 w-6 text-primary-600" />
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your portfolio..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChat
