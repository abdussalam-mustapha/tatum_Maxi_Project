import React from 'react'
import { ExternalLink, Coins } from 'lucide-react'

const PortfolioCard = ({ chain, balance, symbol, usdValue, tokens }) => {
  const getChainIcon = (chainName) => {
    const icons = {
      ethereum: '⟠',
      polygon: '⬟', 
      solana: '◎',
      bitcoin: '₿',
      bsc: '●',
      arbitrum: '🔵',
      optimism: '🔴',
      avalanche: '🔺'
    }
    return icons[chainName.toLowerCase()] || '🔗'
  }

  const getChainColor = (chainName) => {
    const colors = {
      ethereum: 'from-blue-500 to-blue-600',
      polygon: 'from-purple-500 to-purple-600',
      solana: 'from-green-500 to-green-600',
      bitcoin: 'from-orange-500 to-orange-600',
      bsc: 'from-yellow-500 to-yellow-600',
      arbitrum: 'from-blue-400 to-blue-500',
      optimism: 'from-red-500 to-red-600',
      avalanche: 'from-red-400 to-red-500'
    }
    return colors[chainName.toLowerCase()] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Chain Header */}
      <div className={`bg-gradient-to-r ${getChainColor(chain)} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getChainIcon(chain)}</span>
            <h3 className="font-semibold text-lg capitalize">{chain}</h3>
          </div>
          <ExternalLink className="h-5 w-5 opacity-70" />
        </div>
      </div>

      {/* Balance Info */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Main Balance */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Native Balance</p>
            <p className="text-2xl font-bold text-gray-800">
              {parseFloat(balance).toFixed(4)} {symbol}
            </p>
            <p className="text-lg text-green-600 font-semibold">
              ${parseFloat(usdValue).toFixed(2)}
            </p>
          </div>

          {/* Token Holdings */}
          {tokens && tokens.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Token Holdings</p>
              </div>
              <div className="space-y-2">
                {tokens.slice(0, 3).map((token, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">{token.symbol}</span>
                    <div className="text-right">
                      <p className="text-gray-800">{parseFloat(token.balance).toFixed(4)}</p>
                      <p className="text-gray-500">${parseFloat(token.usdValue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {tokens.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{tokens.length - 3} more tokens
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PortfolioCard
