import React, { useState } from 'react'
import WalletInput from './components/WalletInput'
import PortfolioCard from './components/PortfolioCard'
import LoadingSpinner from './components/LoadingSpinner'
import AIChat from './components/AIChat'
import { Wallet, TrendingUp, Shield } from 'lucide-react'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleWalletSubmit = async (address) => {
    setLoading(true)
    setError('')
    setWalletAddress(address)
    
    try {
      const response = await fetch(`/api/portfolio/${address}`)
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data')
      }
      const data = await response.json()
      setPortfolioData(data)
    } catch (err) {
      setError('Failed to fetch portfolio data. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Wallet className="h-10 w-10" />
              Tatum Maxi
            </h1>
            <p className="text-lg opacity-90">
              Track your crypto portfolio across multiple blockchains
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Wallet Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <WalletInput onSubmit={handleWalletSubmit} loading={loading} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Fetching your portfolio data...</p>
          </div>
        )}

        {/* Portfolio Results */}
        {portfolioData && !loading && (
          <div className="space-y-8">
            {/* Total Portfolio Value */}
            <div className="text-center">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Total Portfolio Value</h2>
                </div>
                <p className="text-4xl font-bold text-green-600">
                  ${portfolioData.totalUsdValue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-gray-500 mt-2">Across {portfolioData.chains?.length || 0} chains</p>
              </div>
            </div>

            {/* Chain Breakdown */}
            <div>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Chain Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioData.chains?.map((chain, index) => (
                  <PortfolioCard
                    key={index}
                    chain={chain.name}
                    balance={chain.balance}
                    symbol={chain.symbol}
                    usdValue={chain.usdValue}
                    tokens={chain.tokens}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!portfolioData && !loading && (
          <div className="text-center py-12">
            <Wallet className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Enter a wallet address to get started
            </h3>
            <p className="text-gray-500">
              View balances and portfolio details across multiple blockchains including Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, and Solana
            </p>
          </div>
        )}
      </main>
      
      {/* AI Chat Component */}
      <AIChat portfolioData={portfolioData} walletAddress={walletAddress} />
    </div>
  )
}

export default App
