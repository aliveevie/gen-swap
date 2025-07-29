require('dotenv').config();

// 1inch API Configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || 'your-api-key-here';
const ONEINCH_BASE_URL = 'https://api.1inch.dev';
console.log(ONEINCH_API_KEY);
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

module.exports = {
  ONEINCH_API_KEY,
  ONEINCH_BASE_URL,
  NETWORKS,
  TOKENS,
  getHeaders
}; 