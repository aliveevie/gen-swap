const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9056;

// Basic middleware
app.use(cors());
app.use(express.json());

// Mock data
const NETWORKS = {
  ethereum: { chainId: 1, name: "Ethereum" },
  optimism: { chainId: 10, name: "Optimism" },
  bsc: { chainId: 56, name: "BSC" },
  polygon: { chainId: 137, name: "Polygon" },
  fantom: { chainId: 250, name: "Fantom" },
  arbitrum: { chainId: 42161, name: "Arbitrum" },
  avalanche: { chainId: 43114, name: "Avalanche" },
  base: { chainId: 8453, name: "Base" }
};

const TOKENS = {
  ethereum: {
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
  },
  polygon: {
    MATIC: "0x0000000000000000000000000000000000000000",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"
  },
  bsc: {
    BNB: "0x0000000000000000000000000000000000000000",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEF2aF378a0fD5a76d26",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    WETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
  }
};

// Helper functions
function getTokenName(symbol) {
  const tokenNames = {
    'ETH': 'Ethereum',
    'WETH': 'Wrapped Ethereum',
    'USDC': 'USD Coin',
    'USDT': 'Tether',
    'DAI': 'Dai',
    'WBTC': 'Wrapped Bitcoin',
    'MATIC': 'Polygon',
    'WMATIC': 'Wrapped Polygon',
    'BNB': 'Binance Coin',
    'WBNB': 'Wrapped Binance Coin',
    'AVAX': 'Avalanche',
    'WAVAX': 'Wrapped Avalanche',
    'OP': 'Optimism',
    'FTM': 'Fantom',
    'WFTM': 'Wrapped Fantom',
    'USDbC': 'USD Base Coin'
  };
  return tokenNames[symbol] || symbol;
}

function getTokenLogo(symbol) {
  const tokenLogos = {
    'ETH': '⟠',
    'WETH': '⟠',
    'USDC': '💰',
    'USDT': '💵',
    'DAI': '🏦',
    'WBTC': '₿',
    'MATIC': '🟣',
    'WMATIC': '🟣',
    'BNB': '🟡',
    'WBNB': '🟡',
    'AVAX': '🔺',
    'WAVAX': '🔺',
    'OP': '🔵',
    'FTM': '👻',
    'WFTM': '👻',
    'USDbC': '💰'
  };
  return tokenLogos[symbol] || '🪙';
}

function getNetworkSymbol(networkName) {
  const symbols = {
    'ethereum': 'ETH',
    'optimism': 'OP',
    'bsc': 'BNB',
    'polygon': 'MATIC',
    'fantom': 'FTM',
    'arbitrum': 'ARB',
    'avalanche': 'AVAX',
    'base': 'BASE'
  };
  return symbols[networkName] || networkName.toUpperCase();
}

function getNetworkLogo(networkName) {
  const logos = {
    'ethereum': '⟠',
    'optimism': '🔵',
    'bsc': '🟡',
    'polygon': '🟣',
    'fantom': '👻',
    'arbitrum': '🔷',
    'avalanche': '🔺',
    'base': '🔵'
  };
  return logos[networkName] || '🌐';
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GenSwap API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get supported networks
app.get('/api/networks', (req, res) => {
  try {
    const networks = Object.keys(NETWORKS).map(networkName => {
      const network = NETWORKS[networkName];
      return {
        id: network.chainId,
        name: network.name,
        symbol: getNetworkSymbol(networkName),
        logo: getNetworkLogo(networkName),
        networkName: networkName
      };
    });
    
    res.json({
      success: true,
      data: networks
    });
  } catch (error) {
    console.error('Error getting networks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported networks'
    });
  }
});

// Get supported tokens for a network
app.get('/api/tokens/:networkName', (req, res) => {
  try {
    const networkName = req.params.networkName;
    
    if (!NETWORKS[networkName]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      });
    }
    
    const tokens = TOKENS[networkName] || {};
    const tokenList = Object.keys(tokens).map(symbol => ({
      symbol,
      name: getTokenName(symbol),
      logo: getTokenLogo(symbol),
      address: tokens[symbol]
    }));
    
    res.json({
      success: true,
      data: tokenList
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported tokens'
    });
  }
});

// Get quote for swap
app.post('/api/quote', (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Mock quote calculation
    const mockRate = Math.random() * 2000 + 1000;
    const estimatedOutput = (parseFloat(amount) * mockRate).toFixed(6);
    
    res.json({
      success: true,
      data: {
        estimatedOutput,
        fromAmount: amount,
        toAmount: estimatedOutput,
        fromToken,
        toToken,
        fromChainId,
        toChainId
      }
    });
    
  } catch (error) {
    console.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quote'
    });
  }
});

// Execute swap
app.post('/api/swap', (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    console.log(`🚀 Executing swap: ${amount} ${fromToken} on chain ${fromChainId} to ${toToken} on chain ${toChainId}`);
    
    // Mock order hash
    const orderHash = '0x' + Math.random().toString(16).substr(2, 40);
    
    res.json({
      success: true,
      data: {
        orderHash,
        fromAmount: amount,
        fromToken,
        toToken,
        fromChainId,
        toChainId,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('Error executing swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute swap'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GenSwap API Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Supported Networks: ${Object.keys(NETWORKS).join(', ')}`);
});

module.exports = app;
