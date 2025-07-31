const express = require('express');
const cors = require('cors');
const { CrossChainSwapper, NETWORKS, TOKENS } = require('./functions/Swapper');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 9056;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize swapper instance (only for quotes, not for executing swaps)
let swapper;
try {
  // Only initialize for API key validation and quote generation
  // No wallet private key needed for user-initiated swaps
  swapper = new CrossChainSwapper();
} catch (error) {
  console.error('Failed to initialize swapper for quotes:', error.message);
  // Don't exit - server can still work for quotes without full swapper
}

// Helper function to get network name from chain ID
function getNetworkNameFromChainId(chainId) {
  const chainIdMap = {
    1: 'ethereum',
    10: 'optimism',
    56: 'bsc',
    137: 'polygon',
    250: 'fantom',
    42161: 'arbitrum',
    43114: 'avalanche',
    8453: 'base'
  };
  return chainIdMap[chainId] || null;
}

// Helper function to get chain ID from network name
function getChainIdFromNetworkName(networkName) {
  const network = NETWORKS[networkName];
  return network ? network.chainId : null;
}

// Helper function to get supported tokens for a network
function getSupportedTokensForNetwork(networkName) {
  const tokens = TOKENS[networkName] || {};
  return Object.keys(tokens).map(symbol => ({
    symbol,
    name: getTokenName(symbol),
    logo: getTokenLogo(symbol),
    address: tokens[symbol]
  }));
}

// Helper function to get token name
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

// Helper function to get token logo
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

// API Routes

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
    const { networkName } = req.params;
    
    if (!NETWORKS[networkName]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      });
    }
    
    const tokens = getSupportedTokensForNetwork(networkName);
    
    res.json({
      success: true,
      data: tokens
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
app.post('/api/quote', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const fromNetwork = getNetworkNameFromChainId(parseInt(fromChainId));
    const toNetwork = getNetworkNameFromChainId(parseInt(toChainId));
    
    if (!fromNetwork || !toNetwork) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      });
    }
    
    console.log(`🔍 Getting quote for ${amount} ${fromToken} on ${fromNetwork} to ${toToken} on ${toNetwork}`);
    
    // Initialize SDK for source network
    await swapper.initializeSDK(fromNetwork);
    
    // Get token addresses
    const srcTokenAddress = TOKENS[fromNetwork][fromToken];
    const dstTokenAddress = TOKENS[toNetwork][toToken];
    
    if (!srcTokenAddress || !dstTokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Token not supported for this network pair'
      });
    }
    
    // Convert amount to wei
    const weiAmount = swapper.convertHumanAmountToWei(amount, fromToken);
    
    // Prepare quote parameters
    const params = {
      srcChainId: NETWORKS[fromNetwork].id,
      dstChainId: NETWORKS[toNetwork].id,
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: weiAmount,
      enableEstimate: true,
      walletAddress: walletAddress
    };
    
    // Get quote from 1inch
    const quote = await swapper.sdk.getQuote(params);
    
    if (!quote || !quote.getPreset) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get quote from 1inch API'
      });
    }
    
    // Calculate estimated output amount
    const estimatedOutput = quote.getPreset().fillAmount || '0';
    const outputDecimals = toToken === 'USDC' || toToken === 'USDT' ? 6 : 18;
    const estimatedOutputHuman = (BigInt(estimatedOutput) / BigInt(10 ** outputDecimals)).toString();
    
    res.json({
      success: true,
      data: {
        quote,
        estimatedOutput: estimatedOutputHuman,
        estimatedOutputWei: estimatedOutput,
        fromAmount: amount,
        toAmount: estimatedOutputHuman,
        fromToken,
        toToken,
        fromNetwork,
        toNetwork,
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

// Get swap parameters for user wallet execution
app.post('/api/swap-params', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const fromNetwork = getNetworkNameFromChainId(parseInt(fromChainId));
    const toNetwork = getNetworkNameFromChainId(parseInt(toChainId));
    
    if (!fromNetwork || !toNetwork) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      });
    }
    
    console.log(`🔍 Getting swap parameters for ${amount} ${fromToken} on ${fromNetwork} to ${toToken} on ${toNetwork}`);
    
    // Initialize SDK for source network
    await swapper.initializeSDK(fromNetwork);
    
    // Get token addresses
    const srcTokenAddress = TOKENS[fromNetwork][fromToken];
    const dstTokenAddress = TOKENS[toNetwork][toToken];
    
    if (!srcTokenAddress || !dstTokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Token not supported for this network pair'
      });
    }
    
    // Convert amount to wei
    const weiAmount = swapper.convertHumanAmountToWei(amount, fromToken);
    
    // Prepare quote parameters
    const params = {
      srcChainId: NETWORKS[fromNetwork].id,
      dstChainId: NETWORKS[toNetwork].id,
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: weiAmount,
      enableEstimate: true,
      walletAddress: walletAddress
    };
    
    // Get quote from 1inch
    const quote = await swapper.sdk.getQuote(params);
    
    if (!quote || !quote.getPreset) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get quote from 1inch API'
      });
    }
    
    // Generate secrets for hash lock
    const secretsCount = quote.getPreset().secretsCount;
    const secrets = Array.from({ length: secretsCount }).map(() => swapper.getRandomBytes32());
    const secretHashes = secrets.map(x => swapper.sdk.HashLock.hashSecret(x));
    
    // Create hash lock
    const hashLock = secretsCount === 1
      ? swapper.sdk.HashLock.forSingleFill(secrets[0])
      : swapper.sdk.HashLock.forMultipleFills(
          secretHashes.map((secretHash, i) =>
            swapper.sdk.solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
          )
        );
    
    // Return swap parameters for user wallet to execute
    res.json({
      success: true,
      data: {
        quote: quote,
        hashLock: hashLock,
        secretHashes: secretHashes,
        secrets: secrets,
        fromAmount: amount,
        fromToken,
        toToken,
        fromNetwork,
        toNetwork,
        fromChainId,
        toChainId,
        srcTokenAddress,
        dstTokenAddress,
        weiAmount,
        walletAddress
      }
    });
    
  } catch (error) {
    console.error('Error getting swap parameters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get swap parameters'
    });
  }
});

// Check balance
app.get('/api/balance/:networkName/:tokenSymbol/:address', async (req, res) => {
  try {
    const { networkName, tokenSymbol, address } = req.params;
    
    if (!NETWORKS[networkName]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      });
    }
    
    // Initialize SDK for the network
    await swapper.initializeSDK(networkName);
    
    // Check balance
    const balance = await swapper.checkBalance(networkName, tokenSymbol);
    
    res.json({
      success: true,
      data: {
        network: networkName,
        token: tokenSymbol,
        address: address,
        nativeBalance: balance.nativeBalance,
        tokenBalance: balance.tokenBalance,
        formattedBalance: balance.formattedBalance
      }
    });
    
  } catch (error) {
    console.error('Error checking balance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check balance'
    });
  }
});

// Get swap status
app.get('/api/swap/status/:orderHash', async (req, res) => {
  try {
    const { orderHash } = req.params;
    
    // This would typically query the 1inch API for order status
    // For now, return a mock status
    res.json({
      success: true,
      data: {
        orderHash,
        status: 'pending', // or 'completed', 'failed'
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting swap status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get swap status'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GenSwap API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Helper functions for network symbols and logos
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
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
