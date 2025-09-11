import React, { useState } from 'react'
import { Search, Wallet } from 'lucide-react'

const WalletInput = ({ onSubmit, loading }) => {
  const [address, setAddress] = useState('')
  const [isValid, setIsValid] = useState(true)

  const validateAddress = (addr) => {
    // Basic validation for different wallet formats
    const ethRegex = /^0x[a-fA-F0-9]{40}$/
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    
    return ethRegex.test(addr) || solanaRegex.test(addr)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!address.trim()) {
      setIsValid(false)
      return
    }

    if (!validateAddress(address.trim())) {
      setIsValid(false)
      return
    }

    setIsValid(true)
    onSubmit(address.trim())
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setAddress(value)
    
    if (value.trim() && !validateAddress(value.trim())) {
      setIsValid(false)
    } else {
      setIsValid(true)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Wallet className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold">Enter Wallet Address</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={handleInputChange}
              placeholder="Enter Ethereum, Polygon, or Solana wallet address..."
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors ${
                !isValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          {!isValid && (
            <p className="mt-2 text-sm text-red-600">
              Please enter a valid wallet address
            </p>
          )}
          
          <p className="mt-2 text-sm text-gray-500">
            Supports Ethereum (0x...), Solana, and Polygon addresses
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Tracking...' : 'Track Portfolio'}
        </button>
      </form>
    </div>
  )
}

export default WalletInput
