const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import all functions from the functions directory
const {
  getQuote,
  createSwap,
  createFusionOrder,
  getFusionOrderStatus,
  getUserFusionOrders,
  getSupportedTokens,
  getTokenPrices,
  getTokenMetadata,
  getWalletTokenBalances,
  getCrossChainQuote,
  createCrossChainOrder,
  getCrossChainOrderStatus,
  getCrossChainRoutes,
  getUserCrossChainOrders
} = require('./functions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '1inch API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===== SWAP ROUTES =====

// Get quote
app.post('/api/quote', async (req, res) => {
  try {
    const { fromToken, toToken, amount, chainId = 1 } = req.body;
    
    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const quote = await getQuote(fromToken, toToken, amount, chainId);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create swap transaction
app.post('/api/swap', async (req, res) => {
  try {
    const { fromToken, toToken, amount, fromAddress, chainId = 1, slippage = 1 } = req.body;
    
    if (!fromToken || !toToken || !amount || !fromAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const swap = await createSwap(fromToken, toToken, amount, fromAddress, chainId, slippage);
    res.json(swap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FUSION (INTENT-BASED SWAP) ROUTES =====

// Create fusion order
app.post('/api/fusion/order', async (req, res) => {
  try {
    const orderParams = req.body;
    const order = await createFusionOrder(orderParams);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fusion order status
app.get('/api/fusion/order/:orderHash', async (req, res) => {
  try {
    const { orderHash } = req.params;
    const status = await getFusionOrderStatus(orderHash);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user fusion orders
app.get('/api/fusion/orders/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const orders = await getUserFusionOrders(userAddress, parseInt(limit), parseInt(offset));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TOKEN ROUTES =====

// Get supported tokens
app.get('/api/tokens/:chainId?', async (req, res) => {
  try {
    const chainId = req.params.chainId || 1;
    const tokens = await getSupportedTokens(chainId);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token prices
app.get('/api/prices/:chainId?', async (req, res) => {
  try {
    const chainId = req.params.chainId || 1;
    const { tokens } = req.query;
    
    if (!tokens) {
      return res.status(400).json({ error: 'Tokens parameter is required' });
    }

    const tokenList = tokens.split(',');
    const prices = await getTokenPrices(tokenList, chainId);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token metadata
app.get('/api/token/:chainId/:tokenAddress', async (req, res) => {
  try {
    const { chainId, tokenAddress } = req.params;
    const metadata = await getTokenMetadata(tokenAddress, chainId);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet token balances
app.get('/api/balances/:chainId/:walletAddress', async (req, res) => {
  try {
    const { chainId, walletAddress } = req.params;
    const balances = await getWalletTokenBalances(walletAddress, chainId);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CROSS-CHAIN ROUTES =====

// Get cross-chain quote
app.post('/api/crosschain/quote', async (req, res) => {
  try {
    const quoteParams = req.body;
    const quote = await getCrossChainQuote(quoteParams);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create cross-chain order
app.post('/api/crosschain/order', async (req, res) => {
  try {
    const orderParams = req.body;
    const order = await createCrossChainOrder(orderParams);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cross-chain order status
app.get('/api/crosschain/order/:orderHash', async (req, res) => {
  try {
    const { orderHash } = req.params;
    const status = await getCrossChainOrderStatus(orderHash);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cross-chain routes
app.get('/api/crosschain/routes', async (req, res) => {
  try {
    const routes = await getCrossChainRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user cross-chain orders
app.get('/api/crosschain/orders/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const orders = await getUserCrossChainOrders(userAddress, parseInt(limit), parseInt(offset));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/quote',
      'POST /api/swap',
      'POST /api/fusion/order',
      'GET /api/fusion/order/:orderHash',
      'GET /api/fusion/orders/:userAddress',
      'GET /api/tokens/:chainId',
      'GET /api/prices/:chainId',
      'GET /api/token/:chainId/:tokenAddress',
      'GET /api/balances/:chainId/:walletAddress',
      'POST /api/crosschain/quote',
      'POST /api/crosschain/order',
      'GET /api/crosschain/order/:orderHash',
      'GET /api/crosschain/routes',
      'GET /api/crosschain/orders/:userAddress'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 1inch API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💱 Swap API: http://localhost:${PORT}/api/swap`);
  console.log(`🔍 Quote API: http://localhost:${PORT}/api/quote`);
  console.log(`⚡ Fusion API: http://localhost:${PORT}/api/fusion/order`);
  console.log(`🌉 Cross-chain API: http://localhost:${PORT}/api/crosschain/quote`);
  console.log(`🪙 Token API: http://localhost:${PORT}/api/tokens/1`);
});

module.exports = app; 