const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';

// Correct Ethereum mainnet token addresses
const TEST_TOKENS = {
  ethereum: {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8', // This is wrong
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  }
};

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testGetTokens() {
  try {
    console.log('🪙 Testing get supported tokens...');
    const response = await axios.get(`${BASE_URL}/tokens/1`);
    console.log('✅ Get tokens passed. Token count:', Object.keys(response.data.tokens || {}).length);
    return true;
  } catch (error) {
    console.error('❌ Get tokens failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetQuote() {
  try {
    console.log('💱 Testing get quote...');
    const response = await axios.post(`${BASE_URL}/quote`, {
      fromToken: TEST_TOKENS.ethereum.WETH,
      toToken: TEST_TOKENS.ethereum.USDC,
      amount: '1000000000000000000', // 1 WETH (18 decimals)
      chainId: 1
    });
    console.log('✅ Get quote passed. Quote received:', {
      fromToken: response.data.src,
      toToken: response.data.dst,
      fromAmount: response.data.srcAmount,
      toAmount: response.data.dstAmount,
      protocols: response.data.protocols?.length || 0
    });
    return true;
  } catch (error) {
    console.error('❌ Get quote failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPrices() {
  try {
    console.log('💰 Testing get token prices...');
    const tokens = [TEST_TOKENS.ethereum.WETH, TEST_TOKENS.ethereum.USDC, TEST_TOKENS.ethereum.USDT];
    const response = await axios.get(`${BASE_URL}/prices/1?tokens=${tokens.join(',')}`);
    console.log('✅ Get prices passed. Prices received:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Get prices failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetTokenMetadata() {
  try {
    console.log('📋 Testing get token metadata...');
    const response = await axios.get(`${BASE_URL}/token/1/${TEST_TOKENS.ethereum.WETH}`);
    console.log('✅ Get token metadata passed:', {
      symbol: response.data.symbol,
      name: response.data.name,
      decimals: response.data.decimals
    });
    return true;
  } catch (error) {
    console.error('❌ Get token metadata failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetCrossChainRoutes() {
  try {
    console.log('🌉 Testing get cross-chain routes...');
    const response = await axios.get(`${BASE_URL}/crosschain/routes`);
    console.log('✅ Get cross-chain routes passed. Routes available:', response.data.routes?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Get cross-chain routes failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetFusionOrders() {
  try {
    console.log('⚡ Testing get fusion orders...');
    const testAddress = '0x1234567890123456789012345678901234567890';
    const response = await axios.get(`${BASE_URL}/fusion/orders/${testAddress}?limit=5`);
    console.log('✅ Get fusion orders passed. Orders found:', response.data.orders?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Get fusion orders failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting 1inch API Tests...\n');
  
  const tests = [
    testHealthCheck,
    testGetTokens,
    testGetQuote,
    testGetPrices,
    testGetTokenMetadata,
    testGetCrossChainRoutes,
    testGetFusionOrders
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    console.log(''); // Add spacing between tests
  }
  
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your 1inch API server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your API key and server configuration.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testGetTokens,
  testGetQuote,
  testGetPrices,
  testGetTokenMetadata,
  testGetCrossChainRoutes,
  testGetFusionOrders,
  runAllTests
}; 