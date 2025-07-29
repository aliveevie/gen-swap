const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 1inch API Configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || 'your-api-key-here';
const ONEINCH_BASE_URL = 'https://api.1inch.dev';

// Supported networks (using mainnet for now, can switch to Sepolia if needed)
const NETWORKS = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  avalanche: 43114,
  fantom: 250,
  arbitrum: 42161,
  optimism: 10,
  base: 8453
};

// Common token addresses
const TOKENS = {
  ethereum: {
    USDC: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  polygon: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  }
};

// 1inch API Headers
const getHeaders = () => ({
  'Authorization': `Bearer ${ONEINCH_API_KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// Get quote for swap
async function getQuote(fromToken, toToken, amount, chainId = 1) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/quote`,
      {
        headers: getHeaders(),
        params: {
          src: fromToken,
          dst: toToken,
          amount: amount,
          includeTokensInfo: true,
          includeProtocols: true,
          includeGas: true
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting quote:', error.response?.data || error.message);
    throw error;
  }
}

// Create swap transaction
async function createSwap(fromToken, toToken, amount, fromAddress, chainId = 1, slippage = 1) {
  try {
    const response = await axios.post(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/swap`,
      {
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: fromAddress,
        slippage: slippage,
        includeTokensInfo: true,
        includeProtocols: true,
        includeGas: true
      },
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating swap:', error.response?.data || error.message);
    throw error;
  }
}

// Intent-based Swap (Fusion) - Create order
async function createFusionOrder(params) {
  try {
    const response = await axios.post(
      `${ONEINCH_BASE_URL}/fusion/orders`,
      {
        source: params.source,
        destination: params.destination,
        sourceAmount: params.sourceAmount,
        destinationAmount: params.destinationAmount,
        sourceToken: params.sourceToken,
        destinationToken: params.destinationToken,
        user: params.user,
        receiver: params.receiver,
        permit: params.permit,
        nonce: params.nonce,
        deadline: params.deadline,
        signature: params.signature
      },
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating fusion order:', error.response?.data || error.message);
    throw error;
  }
}

// Get fusion order status
async function getFusionOrderStatus(orderHash) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/orders/${orderHash}`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting fusion order status:', error.response?.data || error.message);
    throw error;
  }
}

// Get supported tokens
async function getSupportedTokens(chainId = 1) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/tokens`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting supported tokens:', error.response?.data || error.message);
    throw error;
  }
}

// Get token prices
async function getTokenPrices(tokens, chainId = 1) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/prices`,
      {
        headers: getHeaders(),
        params: {
          tokens: tokens.join(','),
          currency: 'USD'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting token prices:', error.response?.data || error.message);
    throw error;
  }
}

// API Routes

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '1inch API Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 1inch API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💱 Swap API: http://localhost:${PORT}/api/swap`);
  console.log(`🔍 Quote API: http://localhost:${PORT}/api/quote`);
  console.log(`⚡ Fusion API: http://localhost:${PORT}/api/fusion/order`);
});

module.exports = {
  getQuote,
  createSwap,
  createFusionOrder,
  getFusionOrderStatus,
  getSupportedTokens,
  getTokenPrices
}; 