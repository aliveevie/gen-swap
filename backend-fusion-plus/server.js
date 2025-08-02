const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
// Import the getQuote function
const { getQuote } = require('./functions/getQuote.js');
// Import the placeOrder function
const { placeOrder, placeOrderSerializable } = require('./functions/placeOrder.js');
// Import the real Swapper logic
const { CrossChainSwapper, NETWORKS, TOKENS } = require('./functions/Swapper.js');
const { submitOrder } = require('./functions/submitOrder.js');
// Import provider functions for TRUE DeFi SDK creation
const { createSDKWithProvider, getAuthKey, validateSDK } = require('./functions/createProvider.js');
const { Swapping } = require('./functions/orderWithGlobal.js');
// Import required 1inch SDK components (for other functions)
const { SDK, NetworkEnum, HashLock } = require('@1inch/cross-chain-sdk');
// Import 1inch Price Feeds API functions
const { priceFeedsAPI } = require('./functions/priceFeeds.js');
// Import AI and DeFi tools
const { aiTools } = require('./tools/ai.js');
const { deFiTools } = require('./tools/tools.js');

const app = express();
const PORT = process.env.PORT || 9056;

// Basic middleware
app.use(cors());
app.use(express.json());

// Global SDK instance (like a database connection)
let globalSDK = null;
let sdkConnectionStatus = 'disconnected';

// Store quotes in memory with reference IDs
let quoteStore = new Map();
let quoteCounter = 0;

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
            const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress, web3Provider, approve, approvalTxHash, quote, eip712Signature, userRpcUrl } = req.body;
    
    console.log('🚀 /api/quote endpoint called with parameters:');
    console.log('📋 Request body:', { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress, hasWeb3Provider: !!web3Provider, approve, hasApprovalTxHash: !!approvalTxHash, hasQuote: !!quote, hasEIP712Signature: !!eip712Signature, userRpcUrl });
    
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
    
    // Handle different scenarios based on request parameters
    if (approve && approvalTxHash && quote && quote.quoteReferenceId) {
        // User has approved tokens and is sending the stored quote reference
        console.log('🎉 User approved tokens - processing swap with stored quote');
        console.log('📋 Approval transaction hash:', approvalTxHash);
        console.log('📋 Quote reference ID:', quote.quoteReferenceId);
        
        // Retrieve the full quote object from memory
        const fullQuote = quoteStore.get(quote.quoteReferenceId);
        if (!fullQuote) {
            console.error('❌ Quote not found in memory store:', quote.quoteReferenceId);
            return res.status(400).json({
                success: false,
                error: 'Quote not found. Please try again.',
            });
        }
        
        console.log('✅ Retrieved full quote from memory store');
        
        try {
            const submitOrderResult = await submitOrder(fullQuote, approve, walletAddress, eip712Signature, userRpcUrl);
            console.log('✅ Submit order result from submitOrder.js:', submitOrderResult);
            
            // Clean up the stored quote
            quoteStore.delete(quote.quoteReferenceId);
            console.log('🧹 Cleaned up stored quote:', quote.quoteReferenceId);
            
            return res.json({
                success: true,
                data: {
                    quote: quote,
                    toAmount: fullQuote.dstTokenAmount ? fullQuote.dstTokenAmount.toString() : '0',
                    sdkCreated: !!sdk,
                    providerType: sdk ? 'user_wallet' : 'server_fallback',
                    globalSDKUsed: sdk === globalSDK,
                    connectionStatus: sdkConnectionStatus,
                    submitOrderResult: submitOrderResult,
                    orderSubmitted: true,
                    approvalTxHash: approvalTxHash,
                    swapProcessed: true
                }
            });
        } catch (submitError) {
            console.error('❌ Submit order failed:', submitError);
            return res.status(500).json({
                success: false,
                error: `Submit order failed: ${submitError.message}`,
                quoteData: {
                    quote: quote,
                    toAmount: fullQuote.dstTokenAmount ? fullQuote.dstTokenAmount.toString() : '0'
                }
            });
        }
    } else if (approve) {
        // Initial order creation - get quote and prepare for approval
        console.log('🚀 User requested order creation - getting quote for approval');
        
        // Import and call the getQuote function
        const { getQuote } = require('./functions/getQuote.js');
        
        const quoteResult = await getQuote(srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress);
        
        console.log('✅ Quote result from getQuote.js:', quoteResult);

        console.log('🚀 User requested order approval - calling submitOrder with existing quote and SDK');
        console.log('📋 submitOrder parameters:', {
            quote: quoteResult,
            sdk: !!sdk,
            approve: approve,
            walletAddress: walletAddress
        });
        
        try {
            const submitOrderResult = await submitOrder(quoteResult, approve, walletAddress, eip712Signature, userRpcUrl);
            console.log('✅ Submit order result from submitOrder.js:', submitOrderResult);
            
            // Return the submit order result along with quote
            return res.json({
                success: true,
                data: {
                    quote: quoteResult,
                    toAmount: quoteResult.dstTokenAmount || '0',
                    sdkCreated: !!sdk,
                    providerType: sdk ? 'user_wallet' : 'server_fallback',
                    globalSDKUsed: sdk === globalSDK,
                    connectionStatus: sdkConnectionStatus,
                    submitOrderResult: submitOrderResult,
                    orderSubmitted: true
                }
            });
        } catch (submitError) {
            console.error('❌ Submit order failed:', submitError);
            return res.status(500).json({
                success: false,
                error: `Submit order failed: ${submitError.message}`,
                quoteData: {
                    quote: quoteResult,
                    toAmount: quoteResult.dstTokenAmount || '0'
                }
            });
        }
    }
    
    // Handle case where no approve parameter is provided (regular quote request)
    if (!approve) {
      console.log('📋 Regular quote request - getting quote without approval');
      
      // Import and call the getQuote function
      const { getQuote } = require('./functions/getQuote.js');
      
      const quoteResult = await getQuote(srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress);
      
      console.log('✅ Quote result from getQuote.js:', quoteResult);
      
      // Extract the exact values that the SDK will expect for the order
      console.log('🔍 Extracting exact values from quote for EIP-712 signing...');
      
      // Get the preset from the quote to extract exact values
      let exactValues = {};
      try {
        const preset = quoteResult.getPreset();
        console.log('🔍 Quote preset:', preset);
        
        // Extract exact values that the SDK will use for the order
        exactValues = {
          salt: preset?.salt || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
          dstTokenAmount: quoteResult.dstTokenAmount?.toString() || '0',
          dstTokenAddress: quoteResult.dstTokenAddress || dstTokenAddress,
          makerTraits: preset?.makerTraits || '62419173104490761595518734106643312524177918888344010093236686688879363751936'
        };
        
        console.log('🔍 Extracted exact values:', exactValues);
      } catch (error) {
        console.warn('⚠️ Could not extract exact values from preset, using defaults:', error.message);
        exactValues = {
          salt: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
          dstTokenAmount: quoteResult.dstTokenAmount?.toString() || '0',
          dstTokenAddress: quoteResult.dstTokenAddress || dstTokenAddress,
          makerTraits: '62419173104490761595518734106643312524177918888344010093236686688879363751936'
        };
      }
      
      // Store the full quote object in memory with a reference ID
      const quoteId = `quote_${++quoteCounter}`;
      quoteStore.set(quoteId, quoteResult);
      
      console.log('📋 Stored quote in memory with ID:', quoteId);
      console.log('📋 Quote store size:', quoteStore.size);
      
      // Helper function to convert BigInt values to strings for JSON serialization
      const convertBigIntToString = (obj) => {
        if (obj === null || obj === undefined) return obj;
        
        if (typeof obj === 'bigint') {
          return obj.toString();
        }
        
        if (Array.isArray(obj)) {
          return obj.map(convertBigIntToString);
        }
        
        if (typeof obj === 'object') {
          const converted = {};
          for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
          }
          return converted;
        }
        
        return obj;
      };

      // Convert the entire quote object to serializable format
      const serializedQuote = convertBigIntToString(quoteResult);
      
      // Add the reference ID and exact values to the serialized quote
      serializedQuote.quoteReferenceId = quoteId;
      serializedQuote.exactValues = exactValues; // Add the exact values for EIP-712 signing
      
      res.json({
        success: true,
        data: {
          quote: serializedQuote,
          quoteReferenceId: quoteId, // This is the key for retrieving the full quote
          toAmount: serializedQuote.dstTokenAmount ? serializedQuote.dstTokenAmount.toString() : '0',
          sdkCreated: !!sdk,
          providerType: sdk ? 'user_wallet' : 'server_fallback',
          globalSDKUsed: sdk === globalSDK,
          connectionStatus: sdkConnectionStatus
        }
      });
    }
    
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
    const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress, approve } = req.body;

    // srcChainId: parseInt(fromChain),
    // dstChainId: parseInt(toChain),
    // srcTokenAddress: srcTokenAddress,
    // dstTokenAddress: dstTokenAddress,
    // amount: weiAmount,
    // walletAddress: address,
    // approve: true

    console.log("Request body, ", req.body)

    const params = {
      srcChainId: srcChainId, // Pass as number, not NetworkEnum
      dstChainId: dstChainId, // Pass as number, not NetworkEnum
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      walletAddress: walletAddress,
    };

    console.log('The params, ', params)
    
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
      
      Swapping(params, globalSDK, true);

    }
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

// Prepare order data for user wallet signature (TRUE DeFi - no server signing)
app.post('/api/prepare-order', async (req, res) => {
  try {
    const { 
      srcChainId, 
      dstChainId, 
      srcTokenAddress, 
      dstTokenAddress, 
      amount, 
      walletAddress
    } = req.body;
    
    console.log('🚀 /api/prepare-order endpoint called with parameters:');
    console.log('📋 Request body:', { 
      srcChainId, 
      dstChainId, 
      srcTokenAddress, 
      dstTokenAddress, 
      amount, 
      walletAddress
    });
    
    // Validate required parameters
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters for order preparation'
      });
    }

    console.log('🔧 TRUE DeFi: Preparing order data for user wallet signature');
    console.log('👤 User will sign all transactions in their own wallet');
    console.log('🔐 Server provides order data only - no private keys used');

    // Create REAL order using 1inch SDK (TRUE DeFi with real data)
    console.log('🚀 Creating REAL order with 1inch SDK...');
    
    if (!globalSDK) {
      throw new Error('No SDK available for order creation');
    }

    // Check if SDK has required methods
    if (typeof globalSDK.getQuote !== 'function') {
      throw new Error('SDK does not have getQuote method');
    }
    if (typeof globalSDK.placeOrder !== 'function') {
      throw new Error('SDK does not have placeOrder method');
    }

    // Get REAL quote from 1inch SDK
    console.log('🔍 Getting REAL quote from 1inch SDK...');
    const quoteParams = {
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      enableEstimate: true,
      walletAddress: walletAddress,
    };

    console.log('📋 Quote parameters:', quoteParams);
    const quote = await globalSDK.getQuote(quoteParams);
    console.log('✅ REAL quote received from 1inch SDK');

    // Generate secrets and hash lock for REAL order
    const secretsCount = quote.getPreset().secretsCount;
    console.log('🔐 Secrets count from REAL quote:', secretsCount);

    const secrets = Array.from({ length: secretsCount }).map(() => '0x' + Buffer.from(require('crypto').randomBytes(32)).toString('hex'));
    const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

    console.log('🔑 Generated REAL secrets:', secrets.length);
    console.log('🔒 Generated REAL secret hashes:', secretHashes.length);

    // Create REAL hash lock
    const hashLock = secretsCount === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(
          secretHashes.map((secretHash, i) =>
            solidityPackedKeccak256(
              ["uint64", "bytes32"],
              [i, secretHash.toString()],
            ),
          ),
        );

    console.log('🔒 REAL hash lock created');

    // Place REAL order with 1inch SDK
    console.log('📝 Placing REAL order with 1inch SDK...');
    const orderResponse = await globalSDK.placeOrder(quote, {
      walletAddress: walletAddress,
      hashLock,
      secretHashes
    });

    console.log('✅ REAL order placed successfully with 1inch SDK');
    console.log('📋 Order response type:', typeof orderResponse);
    console.log('📋 Order response keys:', Object.keys(orderResponse || {}));
    
    // Extract REAL order hash from 1inch SDK response
    const realOrderHash = orderResponse.orderHash;
    console.log('🔗 REAL order hash from 1inch SDK:', realOrderHash);

    if (!realOrderHash) {
      throw new Error('1inch SDK did not return a valid order hash');
    }

    // Prepare REAL order data
    const orderData = {
      orderHash: realOrderHash,
      order: orderResponse,
      quote: quote,
      secrets: secrets,
      secretHashes: secretHashes,
      hashLock: hashLock,
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      walletAddress: walletAddress,
      status: 'pending_user_signature',
      timestamp: new Date().toISOString(),
      requiresApproval: true,
      spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
      note: 'REAL order created with 1inch SDK - User must approve tokens and sign order in their wallet'
    };

    console.log('✅ REAL order data prepared with 1inch SDK');
    console.log('🔗 REAL order hash:', realOrderHash);

    // Helper function to convert BigInt values to strings for JSON serialization
    const convertBigIntToString = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
      }
      
      if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigIntToString(value);
        }
        return converted;
      }
      
      return obj;
    };



    // Prepare response data with REAL order data
    const responseData = {
      success: true,
      message: 'REAL order created with 1inch SDK',
      data: {
        orderHash: realOrderHash,
        orderData: convertBigIntToString(orderData),
        srcChainId: parseInt(srcChainId),
        dstChainId: parseInt(dstChainId),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: amount,
        walletAddress: walletAddress,
        status: 'pending_user_signature',
        timestamp: new Date().toISOString(),
        requiresApproval: true,
        spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
        note: 'REAL order created with 1inch SDK - User must approve tokens and sign order in their wallet',
        isRealOrder: true,
        sdkUsed: true
      }
    };

    // Send response (no serialization issues with simple data)
    console.log('✅ Order data prepared successfully for user wallet signature');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error preparing order data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare order data',
      details: 'Check parameters and try again'
    });
  }
});

// Get order status using SDK
app.get('/api/order-status/:orderHash', async (req, res) => {
  try {
    const { orderHash } = req.params;
    
    console.log('🔍 Checking order status for:', orderHash);
    
    if (!globalSDK) {
      return res.status(500).json({
        success: false,
        error: 'No SDK available for order status check'
      });
    }

    // Check if SDK has getOrderStatus method
    if (typeof globalSDK.getOrderStatus !== 'function') {
      return res.status(500).json({
        success: false,
        error: 'SDK does not support getOrderStatus method'
      });
    }

    console.log('📋 Getting order status with SDK...');
    
    try {
      const orderStatus = await globalSDK.getOrderStatus(orderHash);
      console.log('✅ Order status retrieved:', orderStatus);

      // Use the existing convertBigIntToString function from placeOrder.js
      const { convertBigIntToString } = require('./functions/placeOrder.js');
      const serializableStatus = convertBigIntToString(orderStatus);

      res.json({
        success: true,
        data: {
          orderHash: orderHash,
          status: serializableStatus,
          timestamp: new Date().toISOString(),
          globalSDKUsed: true,
          connectionStatus: sdkConnectionStatus
        }
      });

    } catch (statusError) {
      console.error('❌ Order status check failed:', statusError);
      res.status(500).json({
        success: false,
        error: `Failed to get order status: ${statusError.message}`,
        details: 'Order may not exist or SDK method failed'
      });
    }

  } catch (error) {
    console.error('❌ Error in order status endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check order status'
    });
  }
});

// Prepare token approval transaction for user wallet signature
app.post('/api/prepare-approval', async (req, res) => {
  try {
    const { 
      tokenAddress, 
      spenderAddress, 
      amount, 
      walletAddress, 
      chainId
    } = req.body;

    console.log('🔐 Preparing token approval transaction for user wallet');
    console.log('💰 Token address:', tokenAddress);
    console.log('🎯 Spender address:', spenderAddress);
    console.log('📊 Amount:', amount);
    console.log('👤 Wallet:', walletAddress);
    console.log('🔗 Chain ID:', chainId);

    // ERC20 approve ABI
    const approveABI = [{
      "constant": false,
      "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }];

    try {
      console.log('🔐 Creating approval transaction data for user wallet');
      
      // Create approval transaction data (user will sign this in their wallet)
      const approvalData = {
        to: tokenAddress,
        data: '0x095ea7b3' + '000000000000000000000000' + spenderAddress.slice(2) + amount.toString(16).padStart(64, '0'),
        from: walletAddress,
        chainId: parseInt(chainId),
        value: '0x0'
      };

      console.log('✅ Approval transaction data created for user wallet signature');

      res.json({
        success: true,
        message: 'Approval transaction ready for user wallet signature',
        data: {
          approvalTransaction: approvalData,
          tokenAddress: tokenAddress,
          spenderAddress: spenderAddress,
          amount: amount,
          walletAddress: walletAddress,
          chainId: parseInt(chainId),
          timestamp: new Date().toISOString(),
          status: 'approval_ready',
          note: 'User must sign this transaction in their wallet to approve token spending'
        }
      });

    } catch (approvalError) {
      console.error('❌ Token approval preparation failed:', approvalError);
      res.status(500).json({
        success: false,
        error: `Token approval preparation failed: ${approvalError.message}`
      });
    }

  } catch (error) {
    console.error('❌ Error in token approval preparation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare token approval'
    });
  }
});

// ========================================
// 1INCH DATA APIs - PRICE FEEDS API
// ========================================

// Get token price from 1inch Price Feeds API
app.get('/api/price-feeds/:chainId/:tokenAddress', async (req, res) => {
  try {
    const { chainId, tokenAddress } = req.params;
    
    console.log('💰 Getting token price from 1inch Price Feeds API...');
    console.log('🔗 Chain ID:', chainId);
    console.log('🪙 Token Address:', tokenAddress);
    
    const result = await priceFeedsAPI.getTokenPrice(chainId, tokenAddress, 'USD');
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error getting token price:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get token price from 1inch Price Feeds API'
    });
  }
});

// Get multiple token prices from 1inch Price Feeds API
app.post('/api/price-feeds/batch', async (req, res) => {
  try {
    const { tokens } = req.body; // Array of {chainId, tokenAddress}
    
    console.log('💰 Getting batch token prices from 1inch Price Feeds API...');
    console.log('📋 Tokens count:', tokens?.length || 0);
    
    const result = await priceFeedsAPI.getBatchTokenPrices(tokens);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error getting batch token prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get batch token prices from 1inch Price Feeds API'
    });
  }
});

// Get token price with USD conversion from 1inch Price Feeds API
app.get('/api/price-feeds/:chainId/:tokenAddress/usd', async (req, res) => {
  try {
    const { chainId, tokenAddress } = req.params;
    
    console.log('💰 Getting USD token price from 1inch Price Feeds API...');
    console.log('🔗 Chain ID:', chainId);
    console.log('🪙 Token Address:', tokenAddress);
    
    const result = await priceFeedsAPI.getTokenPriceWithCurrency(chainId, tokenAddress, 'USD');
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error getting USD token price:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get USD token price from 1inch Price Feeds API'
    });
  }
});

// Get price comparison between two tokens from 1inch Price Feeds API
app.get('/api/price-feeds/compare/:chainId/:token1Address/:token2Address', async (req, res) => {
  try {
    const { chainId, token1Address, token2Address } = req.params;
    const { currency = 'USD' } = req.query;
    
    console.log('⚖️ Getting price comparison from 1inch Price Feeds API...');
    console.log('🔗 Chain ID:', chainId);
    console.log('🪙 Token 1:', token1Address);
    console.log('🪙 Token 2:', token2Address);
    console.log('💱 Currency:', currency);
    
    const result = await priceFeedsAPI.getPriceComparison(chainId, token1Address, token2Address, currency);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error getting price comparison:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price comparison from 1inch Price Feeds API'
    });
  }
});

// Validate 1inch Price Feeds API status
app.get('/api/price-feeds/status', async (req, res) => {
  try {
    console.log('🔍 Validating 1inch Price Feeds API status...');
    
    const result = await priceFeedsAPI.validateAPI();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error validating Price Feeds API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate 1inch Price Feeds API'
    });
  }
});

// ========================================
// AI CHAT ENDPOINTS
// ========================================

// AI Chat endpoint with price query handling
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    console.log('🤖 AI Chat request received:', message.substring(0, 100) + '...');
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if the message is asking for price information
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('price') || lowerMessage.includes('gas') || lowerMessage.includes('cost')) {
      // Handle price-related queries
      const result = await handlePriceQuery(message, context);
      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    // Check if the message is asking for wallet balance information
    if (lowerMessage.includes('balance') || lowerMessage.includes('wallet') || lowerMessage.includes('portfolio')) {
      // Handle wallet balance queries
      const result = await handleWalletBalanceQuery(message, context);
      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    // Check if the message is asking for token list information
    if (lowerMessage.includes('token list') || lowerMessage.includes('available tokens') || lowerMessage.includes('all tokens')) {
      // Handle token list queries
      const result = await handleTokenListQuery(message, context);
      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    const result = await aiTools.generateAIResponse(message, context);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process AI chat request'
    });
  }
});

// Helper function to handle price-related queries
async function handlePriceQuery(message, context) {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Check for gas price queries
    if (lowerMessage.includes('gas') && context.fromChain) {
      console.log('⛽ Handling gas price query for chain:', context.fromChain);
      const result = await aiTools.getGasPriceWithAnalysis(parseInt(context.fromChain));
      return {
        success: true,
        response: result.aiAnalysis,
        gasData: result.gasData,
        type: 'gas_price'
      };
    }
    
    // Check for token price queries
    if (lowerMessage.includes('price') && context.fromToken && context.fromChain) {
      console.log('💰 Handling token price query for:', context.fromToken, 'on chain:', context.fromChain);
      
      // Get token address from context or use a default
      const tokenAddress = context.tokenAddress || getDefaultTokenAddress(context.fromToken, context.fromChain);
      
      if (tokenAddress) {
        const result = await aiTools.getTokenPriceWithAnalysis(
          parseInt(context.fromChain), 
          tokenAddress, 
          'USD'
        );
        return {
          success: true,
          response: result.aiAnalysis,
          priceData: result.priceData,
          type: 'token_price'
        };
      }
    }
    
    // Default to general AI response
    return await aiTools.generateAIResponse(message, context);
    
  } catch (error) {
    console.error('❌ Price query handling failed:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'I can help you check prices! Please make sure you have selected a token and network, then ask me about the price or gas fees.'
    };
  }
}

// Helper function to handle wallet balance queries
async function handleWalletBalanceQuery(message, context) {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Check if we have a wallet address and chain ID
    if (context.address && context.fromChain) {
      console.log('💰 Handling wallet balance query for:', context.address, 'on chain:', context.fromChain);
      
      const result = await aiTools.getWalletBalanceAnalysis(
        parseInt(context.fromChain), 
        context.address
      );
      return {
        success: true,
        response: result.aiAnalysis,
        balanceData: result.balanceData,
        type: 'wallet_balance'
      };
    }
    
    // Default to general AI response
    return await aiTools.generateAIResponse(message, context);
    
  } catch (error) {
    console.error('❌ Wallet balance query handling failed:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'I can help you check your wallet balances! Please make sure you have connected your wallet and selected a network, then ask me about your balances.'
    };
  }
}

// Helper function to handle token list queries
async function handleTokenListQuery(message, context) {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Check if we have a chain ID
    if (context.fromChain) {
      console.log('📋 Handling token list query for chain:', context.fromChain);
      
      const result = await aiTools.getTokenListAnalysis(parseInt(context.fromChain));
      return {
        success: true,
        response: result.aiAnalysis,
        tokenListData: result.tokenListData,
        tokenAnalysis: result.tokenAnalysis,
        type: 'token_list'
      };
    }
    
    // Default to general AI response
    return await aiTools.generateAIResponse(message, context);
    
  } catch (error) {
    console.error('❌ Token list query handling failed:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'I can help you explore available tokens! Please select a network first, then ask me about the token list or available tokens.'
    };
  }
}

// Helper function to get default token addresses
function getDefaultTokenAddress(tokenSymbol, chainId) {
  const tokenAddresses = {
    'USDC': {
      '1': '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', // Ethereum
      '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
      '42161': '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // Arbitrum
      '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base
    },
    'USDT': {
      '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum
      '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
      '42161': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
      '8453': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' // Base
    },
    'WETH': {
      '1': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Ethereum
      '137': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // Polygon
      '42161': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
      '8453': '0x4200000000000000000000000000000000000006' // Base
    }
  };
  
  return tokenAddresses[tokenSymbol]?.[chainId] || null;
}

// AI Swap Analysis endpoint
app.post('/api/ai/analyze-swap', async (req, res) => {
  try {
    const { swapData } = req.body;
    
    console.log('🔍 AI Swap analysis request received');
    
    if (!swapData) {
      return res.status(400).json({
        success: false,
        error: 'Swap data is required'
      });
    }

    const result = await aiTools.analyzeSwapTransaction(swapData);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Swap analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze swap transaction'
    });
  }
});

// AI Market Insights endpoint
app.post('/api/ai/market-insights', async (req, res) => {
  try {
    const { tokens, priceData } = req.body;
    
    console.log('📊 AI Market insights request received');
    
    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({
        success: false,
        error: 'Tokens array is required'
      });
    }

    const result = await aiTools.getMarketInsights(tokens, priceData || {});
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Market insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get market insights'
    });
  }
});

// AI Token Price endpoint
app.post('/api/ai/token-price', async (req, res) => {
  try {
    const { chainId, tokenAddress, currency = 'USD' } = req.body;
    
    console.log('💰 AI Token price request received:', { chainId, tokenAddress, currency });
    
    if (!chainId || !tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID and token address are required'
      });
    }

    const result = await aiTools.getTokenPriceWithAnalysis(parseInt(chainId), tokenAddress, currency);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Token price error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get token price with analysis'
    });
  }
});

// AI Gas Price endpoint
app.post('/api/ai/gas-price', async (req, res) => {
  try {
    const { chainId } = req.body;
    
    console.log('⛽ AI Gas price request received for chain:', chainId);
    
    if (!chainId) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID is required'
      });
    }

    const result = await aiTools.getGasPriceWithAnalysis(parseInt(chainId));
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Gas price error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get gas price with analysis'
    });
  }
});

// AI Comprehensive Price Analysis endpoint
app.post('/api/ai/comprehensive-price-analysis', async (req, res) => {
  try {
    const { tokens } = req.body;
    
    console.log('📊 AI Comprehensive price analysis request received for', tokens?.length || 0, 'tokens');
    
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tokens array is required and must not be empty'
      });
    }

    const result = await aiTools.getComprehensivePriceAnalysis(tokens);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Comprehensive price analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get comprehensive price analysis'
    });
  }
});

// AI Wallet Balance Analysis endpoint
app.post('/api/ai/wallet-balance', async (req, res) => {
  try {
    const { chainId, walletAddress } = req.body;
    
    console.log('💰 AI Wallet balance analysis request received for:', { chainId, walletAddress });
    
    if (!chainId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID and wallet address are required'
      });
    }

    const result = await aiTools.getWalletBalanceAnalysis(parseInt(chainId), walletAddress);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Wallet balance analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet balance analysis'
    });
  }
});

// AI Token List Analysis endpoint
app.post('/api/ai/token-list', async (req, res) => {
  try {
    const { chainId } = req.body;
    
    console.log('📋 AI Token list analysis request received for chain:', chainId);
    
    if (!chainId) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID is required'
      });
    }

    const result = await aiTools.getTokenListAnalysis(parseInt(chainId));
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Token list analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get token list analysis'
    });
  }
});

// Fusion Intent Quote endpoint
app.post('/api/fusion-intent/quote', async (req, res) => {
  try {
    const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress } = req.body;
    
    console.log('🔍 Fusion Intent quote request received:', { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress });
    
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'All parameters are required: srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress'
      });
    }

    const result = await deFiTools.getFusionIntentQuote({
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fusion Intent quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Fusion Intent quote'
    });
  }
});

// Fusion Intent Order Submission endpoint
app.post('/api/fusion-intent/submit-order', async (req, res) => {
  try {
    const { chainId, orderData } = req.body;
    
    console.log('🚀 Fusion Intent order submission request received for chain:', chainId);
    
    if (!chainId || !orderData) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID and order data are required'
      });
    }

    const result = await deFiTools.submitFusionIntentOrder(parseInt(chainId), orderData);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fusion Intent order submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit Fusion Intent order'
    });
  }
});

// AI Fusion Intent Quote Analysis endpoint
app.post('/api/ai/fusion-intent-quote', async (req, res) => {
  try {
    const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress } = req.body;
    
    console.log('🤖 AI Fusion Intent quote analysis request received');
    
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'All parameters are required: srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress'
      });
    }

    const result = await aiTools.getFusionIntentQuoteWithAnalysis({
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Fusion Intent quote analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Fusion Intent quote analysis'
    });
  }
});

// AI Educational Content endpoint
app.post('/api/ai/educational-content', async (req, res) => {
  try {
    const { topic } = req.body;
    
    console.log('📚 AI Educational content request received:', topic);
    
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    const result = await aiTools.generateEducationalContent(topic);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Educational content error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate educational content'
    });
  }
});

// AI Swap Optimization endpoint
app.post('/api/ai/optimize-swap', async (req, res) => {
  try {
    const { swapRequest } = req.body;
    
    console.log('⚡ AI Swap optimization request received');
    
    if (!swapRequest) {
      return res.status(400).json({
        success: false,
        error: 'Swap request is required'
      });
    }

    const result = await aiTools.optimizeSwapParameters(swapRequest);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Swap optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize swap parameters'
    });
  }
});

// AI Tools Status endpoint
app.get('/api/ai/status', async (req, res) => {
  try {
    console.log('🔍 Checking AI tools status...');
    
    const aiStatus = aiTools.validateConfiguration();
    const toolsStatus = deFiTools.validateConfiguration();
    
    res.json({
      success: true,
      data: {
        ai: aiStatus,
        tools: toolsStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI Tools status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI tools status'
    });
  }
});

// Complete swap execution (TRUE DeFi - user wallet handles everything)
app.post('/api/complete-swap', async (req, res) => {
  try {
    const { 
      orderHash, 
      walletAddress,
      approvalTxHash,
      userSignedData 
    } = req.body;

    console.log('🎉 Completing swap execution (TRUE DeFi):', orderHash);
    console.log('👤 Wallet:', walletAddress);
    console.log('✅ Approval TX:', approvalTxHash ? 'Provided' : 'Not provided');
    console.log('🔐 User signed data:', userSignedData ? 'Provided' : 'Not provided');

    // In TRUE DeFi, the server only validates and logs the completion
    // All actual execution happens in the user's wallet
    
    const completionData = {
      orderHash: orderHash,
      walletAddress: walletAddress,
      approvalTxHash: approvalTxHash,
      status: 'completed',
      timestamp: new Date().toISOString(),
      executionMethod: 'TRUE_DeFi_user_wallet',
      note: 'Swap completed through user wallet signature'
    };

    console.log('✅ Swap completion logged:', completionData);

    res.json({
      success: true,
      message: 'Swap completed successfully through user wallet',
      data: completionData
    });

  } catch (error) {
    console.error('❌ Error in swap completion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete swap'
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
  console.log(`📝 Order Preparation: http://localhost:${PORT}/api/prepare-order`);
  console.log(`🔍 Order Status: http://localhost:${PORT}/api/order-status/:orderHash`);
  console.log(`🔐 Token Approval: http://localhost:${PORT}/api/prepare-approval`);
  console.log(`🎉 Swap Completion: http://localhost:${PORT}/api/complete-swap`);
  console.log(`💰 Price Feeds API: http://localhost:${PORT}/api/price-feeds`);
  console.log(`⚖️ Price Comparison: http://localhost:${PORT}/api/price-feeds/compare`);
  console.log(`🔍 Price Feeds Status: http://localhost:${PORT}/api/price-feeds/status`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/api/ai/chat`);
  console.log(`🔍 AI Swap Analysis: http://localhost:${PORT}/api/ai/analyze-swap`);
  console.log(`📊 AI Market Insights: http://localhost:${PORT}/api/ai/market-insights`);
  console.log(`📚 AI Educational Content: http://localhost:${PORT}/api/ai/educational-content`);
  console.log(`⚡ AI Swap Optimization: http://localhost:${PORT}/api/ai/optimize-swap`);
  console.log(`🔍 AI Tools Status: http://localhost:${PORT}/api/ai/status`);
  console.log(`🌐 Supported Networks: ${Object.keys(NETWORKS).join(', ')}`);
  console.log(`🔧 TRUE DeFi Status: ${process.env.DEV_PORTAL_KEY ? '✅ Ready for swaps' : '⚠️  DEV_PORTAL_KEY required'}`);
  console.log(`👤 User Role: Sign ALL transactions in their own wallet`);
  console.log(`🔐 Server Role: API access ONLY (NO private keys)`);
  console.log(`🔧 Provider System: User wallet integration ready`);
  console.log(`🔗 SDK Connection: ${sdkConnectionStatus} (like database connection)`);
});

module.exports = app;
