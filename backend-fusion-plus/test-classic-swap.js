const axios = require('axios');
require('dotenv').config();

// Test configuration
const API_BASE_URL = 'https://gen-swap-server.vercel.app/api';

// Test parameters for Base network
const testParams = {
  src: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  dst: '0x4200000000000000000000000000000000000006', // WETH on Base
  amount: '100000', // 0.1 USDC (6 decimals)
  from: '0x1234567890123456789012345678901234567890', // Test wallet address
  slippage: '1',
  chainId: 8453 // Base
};

async function testClassicSwapQuote() {
  try {
    console.log('🔄 Testing Classic Swap Quote...');
    console.log('📋 Test parameters:', testParams);

    const response = await axios.post(`${API_BASE_URL}/classic-swap/quote`, testParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap quote test passed!');
      console.log('📊 Quote data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap quote test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap quote test error:', error.response?.data || error.message);
    return null;
  }
}

async function testClassicSwapAllowance() {
  try {
    console.log('🔐 Testing Classic Swap Allowance...');

    const allowanceParams = {
      tokenAddress: testParams.src,
      walletAddress: testParams.from,
      chainId: testParams.chainId
    };

    const response = await axios.post(`${API_BASE_URL}/classic-swap/allowance`, allowanceParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap allowance test passed!');
      console.log('📊 Allowance data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap allowance test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap allowance test error:', error.response?.data || error.message);
    return null;
  }
}

async function testClassicSwapApproval() {
  try {
    console.log('✅ Testing Classic Swap Approval...');

    const approvalParams = {
      tokenAddress: testParams.src,
      amount: testParams.amount,
      chainId: testParams.chainId
    };

    const response = await axios.post(`${API_BASE_URL}/classic-swap/approval`, approvalParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap approval test passed!');
      console.log('📊 Approval data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap approval test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap approval test error:', error.response?.data || error.message);
    return null;
  }
}

async function testClassicSwapTransaction() {
  try {
    console.log('🔄 Testing Classic Swap Transaction...');

    const response = await axios.post(`${API_BASE_URL}/classic-swap/transaction`, testParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap transaction test passed!');
      console.log('📊 Transaction data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap transaction test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap transaction test error:', error.response?.data || error.message);
    return null;
  }
}

async function testClassicSwapAnalysis() {
  try {
    console.log('🔍 Testing Classic Swap Analysis...');

    const response = await axios.post(`${API_BASE_URL}/classic-swap/analysis`, testParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap analysis test passed!');
      console.log('📊 Analysis data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap analysis test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap analysis test error:', error.response?.data || error.message);
    return null;
  }
}

async function testAIClassicSwapQuote() {
  try {
    console.log('🤖 Testing AI Classic Swap Quote...');

    const response = await axios.post(`${API_BASE_URL}/classic-swap/ai-quote`, testParams);
    
    if (response.data.success) {
      console.log('✅ AI classic swap quote test passed!');
      console.log('📊 AI Quote data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ AI classic swap quote test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ AI classic swap quote test error:', error.response?.data || error.message);
    return null;
  }
}

async function testAIClassicSwapAnalysis() {
  try {
    console.log('🤖 Testing AI Classic Swap Analysis...');

    const response = await axios.post(`${API_BASE_URL}/classic-swap/ai-analysis`, testParams);
    
    if (response.data.success) {
      console.log('✅ AI classic swap analysis test passed!');
      console.log('📊 AI Analysis data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ AI classic swap analysis test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ AI classic swap analysis test error:', error.response?.data || error.message);
    return null;
  }
}

async function testClassicSwapOptimize() {
  try {
    console.log('⚡ Testing Classic Swap Optimization...');

    const response = await axios.post(`${API_BASE_URL}/classic-swap/optimize`, testParams);
    
    if (response.data.success) {
      console.log('✅ Classic swap optimization test passed!');
      console.log('📊 Optimization data:', response.data.data);
      return response.data.data;
    } else {
      console.error('❌ Classic swap optimization test failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Classic swap optimization test error:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Classic Swap API Tests...\n');

  // Test basic functionality
  await testClassicSwapQuote();
  console.log('');
  
  await testClassicSwapAllowance();
  console.log('');
  
  await testClassicSwapApproval();
  console.log('');
  
  await testClassicSwapTransaction();
  console.log('');
  
  await testClassicSwapAnalysis();
  console.log('');

  // Test AI functionality
  await testAIClassicSwapQuote();
  console.log('');
  
  await testAIClassicSwapAnalysis();
  console.log('');
  
  await testClassicSwapOptimize();
  console.log('');

  console.log('🎉 All Classic Swap API tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testClassicSwapQuote,
  testClassicSwapAllowance,
  testClassicSwapApproval,
  testClassicSwapTransaction,
  testClassicSwapAnalysis,
  testAIClassicSwapQuote,
  testAIClassicSwapAnalysis,
  testClassicSwapOptimize,
  runAllTests
}; 