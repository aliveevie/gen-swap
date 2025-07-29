const axios = require('axios');
const { ONEINCH_BASE_URL, getHeaders } = require('./config');

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

module.exports = {
  getQuote,
  createSwap
}; 