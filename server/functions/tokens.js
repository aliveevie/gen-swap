const axios = require('axios');
const { ONEINCH_BASE_URL, getHeaders } = require('./config');

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

// Get token metadata
async function getTokenMetadata(tokenAddress, chainId = 1) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/tokens/${tokenAddress}`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting token metadata:', error.response?.data || error.message);
    throw error;
  }
}

// Get token balances for a wallet
async function getWalletTokenBalances(walletAddress, chainId = 1) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/tokens/balances`,
      {
        headers: getHeaders(),
        params: {
          wallet: walletAddress
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting wallet token balances:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getSupportedTokens,
  getTokenPrices,
  getTokenMetadata,
  getWalletTokenBalances
}; 