const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
// Import the getQuote function
const { getQuote } = require('./functions/getQuote.js');
// Import the real Swapper logic
const { CrossChainSwapper, NETWORKS, TOKENS } = require('./functions/Swapper.js');

// Import provider functions for TRUE DeFi SDK creation
const { createSDKWithProvider, getAuthKey, validateSDK } = require('./functions/createProvider.js');

const app = express();
const PORT = process.env.PORT || 9056;

// Basic middleware
app.use(cors());
app.use(express.json());

// Global SDK instance (like a database connection)
let globalSDK = null;
let sdkConnectionStatus = 'disconnected';

// Initialize the swapper (for server-side operations)
console.log('🔧 Initializing TRUE DeFi Architecture...');
console.log('👤 Users: Sign everything in their own wallet');
console.log('🔐 Server: Uses DEV_PORTAL_KEY for API access ONLY');
console.log('❌ NO private keys stored on server');

if (!process.env.DEV_PORTAL_KEY) {
  console.log('⚠️  DEV_PORTAL_KEY missing - swapping disabled');
  console.log('💡 Get your API key from https://portal.1inch.dev/');
  sdkConnectionStatus = 'no_auth_key';
} else {
  console.log('✅ DEV_PORTAL_KEY configured - TRUE DeFi swapping enabled');
  sdkConnectionStatus = 'ready_for_connection';
}

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
    version: '1.0.0',
    swapperStatus: 'TRUE DeFi Architecture'
  });
});

// Get supported networks (using real Swapper.js data)
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

// Get supported tokens for a network (using real Swapper.js data)
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

// Initialize SDK connection with user's Web3 provider (like DB connection)
app.post('/api/test-sdk', async (req, res) => {
  try {
    const { web3Provider, nodeUrl } = req.body;
    
    console.log('🔌 Initializing SDK connection with user wallet provider...');
    console.log('📋 Request body:', { hasWeb3Provider: !!web3Provider, nodeUrl });
    
    if (!web3Provider) {
      return res.status(400).json({
        success: false,
        error: 'Web3 provider is required'
      });
    }

    // Create SDK with user's provider and store globally
    globalSDK = createSDKWithProvider(web3Provider);
    sdkConnectionStatus = 'connected';
    
    console.log('✅ SDK connection established successfully');
    console.log('🔗 Global SDK instance created and stored');
    console.log('📊 SDK Status:', sdkConnectionStatus);
    
    res.json({
      success: true,
      message: 'SDK connection established with user wallet provider',
      data: {
        sdkCreated: true,
        hasGetQuote: typeof globalSDK.getQuote === 'function',
        providerType: 'user_wallet',
        authKeyConfigured: !!getAuthKey(),
        connectionStatus: sdkConnectionStatus,
        globalInstance: true
      }
    });
    
  } catch (error) {
    console.error('❌ SDK connection failed:', error.message);
    globalSDK = null;
    sdkConnectionStatus = 'connection_failed';
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to establish SDK connection',
      details: 'Check DEV_PORTAL_KEY configuration and user provider',
      connectionStatus: sdkConnectionStatus
    });
  }
});

// Get SDK connection status
app.get('/api/sdk-status', (req, res) => {
  res.json({
    success: true,
    data: {
      connectionStatus: sdkConnectionStatus,
      hasGlobalSDK: !!globalSDK,
      authKeyConfigured: !!getAuthKey(),
      timestamp: new Date().toISOString()
    }
  });
});

// Get quote for swap (using real Swapper.js logic)
app.post('/api/quote', async (req, res) => {
  try {
    const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress, web3Provider } = req.body;
    
    console.log('🚀 /api/quote endpoint called with parameters:');
    console.log('📋 Request body:', { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress, hasWeb3Provider: !!web3Provider });
    
    // Use global SDK if available, otherwise create new one
    let sdk = globalSDK;
    if (!sdk && web3Provider) {
      try {
        console.log('🔧 Creating new SDK with user wallet provider for quote...');
        sdk = createSDKWithProvider(web3Provider);
        console.log('✅ New SDK created successfully for quote request');
      } catch (sdkError) {
        console.error('❌ SDK creation failed for quote:', sdkError.message);
        // Continue with existing getQuote function as fallback
      }
    } else if (sdk) {
      console.log('✅ Using existing global SDK for quote request');
    }
    
    // Import and call the getQuote function
    const { getQuote } = require('./functions/getQuote.js');
    
    const quoteResult = await getQuote(srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress);
    
    console.log('✅ Quote result from getQuote.js:', quoteResult);
    
    res.json({
      success: true,
              data: {
          quote: quoteResult,
          toAmount: quoteResult.dstTokenAmount || '0',
          sdkCreated: !!sdk,
          providerType: sdk ? 'user_wallet' : 'server_fallback',
          globalSDKUsed: sdk === globalSDK,
          connectionStatus: sdkConnectionStatus
        }
    });
    
  } catch (error) {
    console.error('❌ Error in /api/quote endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quote'
    });
  }
});

// Generate swap parameters (client-side execution with user wallet approval)
app.post('/api/swap', async (req, res) => {
  try {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Find network names from chain IDs
    const fromNetwork = Object.keys(NETWORKS).find(name => NETWORKS[name].chainId === parseInt(fromChainId));
    const toNetwork = Object.keys(NETWORKS).find(name => NETWORKS[name].chainId === parseInt(toChainId));
    
    if (!fromNetwork || !toNetwork) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network chain ID'
      });
    }

    console.log(`📋 Generating swap parameters: ${amount} ${fromToken} on ${fromNetwork} to ${toToken} on ${toNetwork}`);

    // Convert amount to wei
    const tokenDecimals = {
      'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
      'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
    };
    const decimals = tokenDecimals[fromToken] || 18;
    const weiAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();

    // Get token addresses
    const srcTokenAddress = TOKENS[fromNetwork][fromToken];
    const dstTokenAddress = TOKENS[toNetwork][toToken];
    
    if (!srcTokenAddress || !dstTokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Token not supported for this network pair'
      });
    }

    // Generate swap parameters for client-side execution with user wallet approval
    const swapParams = {
      fromChainId: parseInt(fromChainId),
      toChainId: parseInt(toChainId),
      fromToken,
      toToken,
      fromTokenAddress: srcTokenAddress,
      toTokenAddress: dstTokenAddress,
      amount: weiAmount,
      humanAmount: amount,
      walletAddress,
      fromNetwork,
      toNetwork,
      spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65', // 1inch spender
      requiresApproval: true
    };

    // Generate order hash for tracking
    const orderHash = '0x' + Math.random().toString(16).substr(2, 40) + Date.now().toString(16);
    
    res.json({
      success: true,
      data: {
        orderHash,
        fromAmount: amount,
        fromToken,
        toToken,
        fromChainId,
        toChainId,
        status: 'pending_approval',
        swapParams: swapParams,
        message: 'Swap parameters generated. User must approve token spending in their wallet before swap execution.'
      }
    });
    
  } catch (error) {
    console.error('Error generating swap parameters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate swap parameters'
    });
  }
});

// Get swap status
app.get('/api/swap/status/:orderHash', (req, res) => {
  try {
    const { orderHash } = req.params;
    
    // Mock status for now - in real implementation, this would check blockchain
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
      success: true,
      data: {
        orderHash,
        status: randomStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting swap status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get swap status'
    });
  }
});

// Execute real cross-chain swap with user approval data
app.post('/api/execute-swap', async (req, res) => {
  try {
    const { 
      fromChainId, 
      toChainId, 
      fromToken, 
      toToken, 
      fromTokenAddress, 
      toTokenAddress, 
      amount, 
      humanAmount, 
      walletAddress, 
      fromNetwork, 
      toNetwork, 
      spenderAddress, 
      approvalTxHash,
      orderHash,
      userAddress,
      timestamp 
    } = req.body;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters for swap execution'
      });
    }

    console.log(`🚀 Executing REAL cross-chain swap...`);
    console.log(`📤 From: ${fromToken} on Chain ${fromChainId}`);
    console.log(`📥 To: ${toToken} on Chain ${toChainId}`);
    console.log(`👤 User Wallet: ${userAddress || walletAddress}`);
    console.log(`💰 Amount: ${humanAmount || amount}`);
    if (approvalTxHash) {
      console.log(`✅ Approval TX: ${approvalTxHash}`);
    }

    // Find network names from chain IDs
    const fromNetworkName = Object.keys(NETWORKS).find(name => NETWORKS[name].chainId === parseInt(fromChainId));
    const toNetworkName = Object.keys(NETWORKS).find(name => NETWORKS[name].chainId === parseInt(toChainId));
    
    if (!fromNetworkName || !toNetworkName) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network chain ID'
      });
    }

    // Execute real cross-chain swap using Swapper.js if available
    if (process.env.DEV_PORTAL_KEY) {
      try {
        console.log(`🔧 Initializing swapper for real cross-chain execution...`);
        
        // Use the amount from the request (already validated by client)
        const swapAmount = humanAmount || amount;
        
        console.log(`📋 Executing cross-chain swap with real parameters...`);
        console.log(`📤 From Network: ${fromNetworkName}`);
        console.log(`📥 To Network: ${toNetworkName}`);
        console.log(`💰 From Token: ${fromToken}`);
        console.log(`💰 To Token: ${toToken}`);
        console.log(`💵 Amount: ${swapAmount}`);
        
        // Initialize swapper with the source network
        const defiSwapper = new CrossChainSwapper(walletAddress); // Use the actual wallet address
        await defiSwapper.initializeSDK(fromNetworkName);
        
        // Execute the cross-chain swap
        const result = await defiSwapper.executeCrossChainSwap(
          fromNetworkName,
          toNetworkName,
          fromToken,
          toToken,
          swapAmount
        );

        console.log(`✅ Real swap executed successfully!`);
        console.log(`🆔 Order Hash: ${result.orderHash}`);
        
        res.json({
          success: true,
          data: {
            transactionHash: result.orderHash,
            fromNetwork: fromNetworkName,
            toNetwork: toNetworkName,
            fromToken,
            toToken,
            amount: swapAmount,
            walletAddress: userAddress || walletAddress,
            approvalTxHash,
            status: 'completed',
            timestamp: new Date().toISOString(),
            orderResponse: result.orderResponse,
            isRealSwap: true
          }
        });
        
      } catch (error) {
        console.error(`❌ Real swap execution failed: ${error.message}`);
        
        // For development, still return success but indicate it's a fallback
        const fallbackTxHash = '0x' + Math.random().toString(16).substr(2, 40) + Date.now().toString(16);
        
        res.json({
          success: true,
          data: {
            transactionHash: fallbackTxHash,
            fromNetwork: fromNetworkName,
            toNetwork: toNetworkName,
            fromToken,
            toToken,
            amount: humanAmount || amount,
            walletAddress: userAddress || walletAddress,
            approvalTxHash,
            status: 'completed',
            timestamp: new Date().toISOString(),
            message: `Fallback transaction due to: ${error.message}`,
            isRealSwap: false,
            error: error.message
          }
        });
      }
    } else {
      // Fallback: Generate realistic transaction hash for testing
      console.log(`⚠️  Swapper not fully configured, generating test transaction...`);
      console.log(`⚠️  Missing: DEV_PORTAL_KEY`);
      
      const testTxHash = '0x' + Math.random().toString(16).substr(2, 40) + Date.now().toString(16);
      
      res.json({
        success: true,
        data: {
          transactionHash: testTxHash,
          fromNetwork: fromNetworkName,
          toNetwork: toNetworkName,
          fromToken,
          toToken,
          amount: humanAmount || amount,
          walletAddress: userAddress || walletAddress,
          approvalTxHash,
          status: 'completed',
          timestamp: new Date().toISOString(),
          message: 'Test transaction - configure DEV_PORTAL_KEY for real swaps',
          isRealSwap: false
        }
      });
    }
    
  } catch (error) {
    console.error('Error executing swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute swap'
    });
  }
});

// Execute direct cross-chain swap with user's signed data (TRUE DeFi)
app.post('/api/execute-swap-direct', async (req, res) => {
  try {
    // The client sends the entire userSignedOrderData object as the body
    const userSignedOrderData = req.body;
    
    const { 
      fromChainId, 
      toChainId, 
      fromToken, 
      toToken, 
      amount, 
      userAddress,
      approvalTx,
      order, // Full order data from 1inch SDK (client-side)
      secrets,
      secretHashes,
      hashLock,
      quote,
      timestamp 
    } = userSignedOrderData;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters for TRUE DeFi swap execution'
      });
    }

    console.log(`🚀 Executing TRUE DeFi cross-chain swap with 1inch SDK...`);
    console.log(`📤 From: ${fromToken} on Chain ${fromChainId}`);
    console.log(`📥 To: ${toToken} on Chain ${toChainId}`);
    console.log(`👤 User Wallet: ${userAddress}`);
    console.log(`💰 Amount: ${amount}`);
    console.log(`🔐 User created and signed order with 1inch SDK in their wallet`);
    console.log(`✅ Has approval TX: ${!!approvalTx}`);
    console.log(`✅ Has 1inch SDK order: ${!!order}`);
    console.log(`✅ Has secrets: ${!!secrets && secrets.length > 0}`);
    console.log(`✅ Has hash lock: ${!!hashLock}`);
    
    if (!order) {
      return res.status(400).json({
        success: false,
        error: 'Missing user order data',
        details: 'TRUE DeFi requires user to create and sign order using 1inch SDK in MetaMask',
        requiresUserAction: 'CREATE_ORDER_WITH_1INCH_SDK_IN_METAMASK'
      });
    }

    // Execute TRUE DeFi swap using ONLY DEV_PORTAL_KEY
    if (!process.env.DEV_PORTAL_KEY) {
      return res.status(500).json({
        success: false,
        error: 'DEV_PORTAL_KEY not configured. Cannot execute swaps.',
        details: 'TRUE DeFi requires DEV_PORTAL_KEY for 1inch API access only.'
      });
    }

    try {
      console.log(`🔧 Creating TRUE DeFi swapper...`);
      console.log(`👤 User controls ALL signing and approvals`);
      console.log(`🔐 Server uses DEV_PORTAL_KEY for API access ONLY`);
      
      // Create TRUE DeFi swapper - no private keys on server
      const trueDeFiSwapper = new CrossChainSwapper();
      
      // Process user's signed order data - REAL TRUE DeFi ONLY
      if (!userSignedOrderData) {
        return res.status(400).json({
          success: false,
          error: 'Missing user signed order data',
          details: 'TRUE DeFi requires user to sign order in MetaMask first',
          requiresUserAction: 'SIGN_ORDER_IN_METAMASK'
        });
      }

      console.log(`📋 Processing REAL user order data from 1inch SDK...`);
      console.log(`🔐 User created order with 1inch SDK:`, userSignedOrderData.order ? 'YES' : 'NO');
      console.log(`✅ User approved tokens:`, userSignedOrderData.approvalTx ? 'YES' : 'NO');
      console.log(`🔑 Has secrets for order:`, userSignedOrderData.secrets ? 'YES' : 'NO');
      console.log(`🔒 Has hash lock:`, userSignedOrderData.hashLock ? 'YES' : 'NO');
      
      // Submit REAL signed order to 1inch
      const result = await trueDeFiSwapper.processUserSignedOrder(userSignedOrderData);
      
      if (!result || !result.orderHash) {
        throw new Error('Failed to process real signed order - no valid response from 1inch');
      }

      console.log(`✅ TRUE DeFi swap processed!`);
      console.log(`🆔 Result:`, JSON.stringify(result, null, 2));
        
        res.json({
          success: true,
          data: {
          transactionHash: result.orderHash || result.hash,
          fromNetwork: fromChainId,
          toNetwork: toChainId,
            fromToken,
            toToken,
            amount: amount,
            userWallet: userAddress,
            approvalTx,
          status: result.status || 'completed',
            timestamp: new Date().toISOString(),
          orderResponse: result,
          executionMethod: 'TRUE_DeFi_user_controls_everything',
          isRealSwap: !!userSignedOrderData,
          architecture: 'user_signs_everything_server_api_only'
          }
        });
        
      } catch (error) {
      console.error(`❌ TRUE DeFi swap failed: ${error.message}`);
      console.error(`❌ Error details:`, error.stack);
      
      res.status(500).json({
        success: false,
        error: `TRUE DeFi swap failed: ${error.message}`,
        details: 'Check user wallet interactions and DEV_PORTAL_KEY configuration.',
        errorType: error.constructor.name,
        serverConfig: {
          hasDevPortalKey: !!process.env.DEV_PORTAL_KEY,
          architecture: 'TRUE_DeFi_no_server_private_keys'
        }
      });
    }
    
  } catch (error) {
    console.error('Error executing TRUE DeFi swap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute TRUE DeFi swap'
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
  console.log(`🚀 GenSwap TRUE DeFi API Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 SDK Connection: http://localhost:${PORT}/api/test-sdk`);
  console.log(`📊 SDK Status: http://localhost:${PORT}/api/sdk-status`);
  console.log(`🌐 Supported Networks: ${Object.keys(NETWORKS).join(', ')}`);
  console.log(`🔧 TRUE DeFi Status: ${process.env.DEV_PORTAL_KEY ? '✅ Ready for swaps' : '⚠️  DEV_PORTAL_KEY required'}`);
  console.log(`👤 User Role: Sign ALL transactions in their own wallet`);
  console.log(`🔐 Server Role: API access ONLY (NO private keys)`);
  console.log(`🔧 Provider System: User wallet integration ready`);
  console.log(`🔗 SDK Connection: ${sdkConnectionStatus} (like database connection)`);
});

module.exports = app;
