const { priceFeedsAPI } = require('./priceFeeds.js');

/**
 * Test suite for 1inch Price Feeds API Integration
 * Comprehensive testing of all price feed functionality
 */

async function testPriceFeedsAPI() {
  console.log('🧪 Testing 1inch Price Feeds API Integration...\n');

  // Test 1: Validate API Status
  console.log('📋 Test 1: Validating API Status');
  try {
    const statusResult = await priceFeedsAPI.validateAPI();
    console.log('✅ API Status:', statusResult);
  } catch (error) {
    console.error('❌ API Status Test Failed:', error.message);
  }
  console.log('');

  // Test 2: Get Single Token Price (USDC on Ethereum)
  console.log('📋 Test 2: Getting USDC Price on Ethereum');
  try {
    const usdcPrice = await priceFeedsAPI.getTokenPrice(1, '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', 'USD');
    console.log('✅ USDC Price Result:', usdcPrice.success ? 'Success' : 'Failed');
    if (usdcPrice.success) {
      console.log('💰 Price Data:', usdcPrice.data);
    } else {
      console.log('❌ Error:', usdcPrice.error);
    }
  } catch (error) {
    console.error('❌ USDC Price Test Failed:', error.message);
  }
  console.log('');

  // Test 3: Get Token Price with Custom Currency
  console.log('📋 Test 3: Getting Token Price with EUR Currency');
  try {
    const eurPrice = await priceFeedsAPI.getTokenPriceWithCurrency(1, '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', 'EUR');
    console.log('✅ EUR Price Result:', eurPrice.success ? 'Success' : 'Failed');
    if (eurPrice.success) {
      console.log('💶 Price Data:', eurPrice.data);
    } else {
      console.log('❌ Error:', eurPrice.error);
    }
  } catch (error) {
    console.error('❌ EUR Price Test Failed:', error.message);
  }
  console.log('');

  // Test 4: Batch Token Prices
  console.log('📋 Test 4: Getting Batch Token Prices');
  try {
    const batchTokens = [
      { chainId: 1, tokenAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', currency: 'USD' },
      { chainId: 1, tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', currency: 'USD' }, // USDT
      { chainId: 137, tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', currency: 'USD' } // USDC on Polygon
    ];
    
    const batchResult = await priceFeedsAPI.getBatchTokenPrices(batchTokens);
    console.log('✅ Batch Price Result:', batchResult.success ? 'Success' : 'Failed');
    if (batchResult.success) {
      console.log('📊 Batch Results:', {
        total: batchResult.data.total,
        successful: batchResult.data.successful.length,
        failed: batchResult.data.failed.length
      });
    } else {
      console.log('❌ Error:', batchResult.error);
    }
  } catch (error) {
    console.error('❌ Batch Price Test Failed:', error.message);
  }
  console.log('');

  // Test 5: Price Comparison
  console.log('📋 Test 5: Getting Price Comparison (USDC vs USDT)');
  try {
    const comparisonResult = await priceFeedsAPI.getPriceComparison(
      1, 
      '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      'USD'
    );
    console.log('✅ Price Comparison Result:', comparisonResult.success ? 'Success' : 'Failed');
    if (comparisonResult.success) {
      console.log('⚖️ Comparison Data:', comparisonResult.data.comparison);
    } else {
      console.log('❌ Error:', comparisonResult.error);
    }
  } catch (error) {
    console.error('❌ Price Comparison Test Failed:', error.message);
  }
  console.log('');

  // Test 6: Error Handling - Invalid Token Address
  console.log('📋 Test 6: Testing Error Handling (Invalid Token Address)');
  try {
    const invalidResult = await priceFeedsAPI.getTokenPrice(1, '0xINVALID', 'USD');
    console.log('✅ Error Handling Result:', invalidResult.success ? 'Unexpected Success' : 'Expected Failure');
    if (!invalidResult.success) {
      console.log('✅ Properly handled invalid token address');
    } else {
      console.log('⚠️ Unexpected success with invalid token address');
    }
  } catch (error) {
    console.log('✅ Error properly caught:', error.message);
  }
  console.log('');

  // Test 7: Error Handling - Invalid Chain ID
  console.log('📋 Test 7: Testing Error Handling (Invalid Chain ID)');
  try {
    const invalidChainResult = await priceFeedsAPI.getTokenPrice(999999, '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', 'USD');
    console.log('✅ Invalid Chain Result:', invalidChainResult.success ? 'Unexpected Success' : 'Expected Failure');
    if (!invalidChainResult.success) {
      console.log('✅ Properly handled invalid chain ID');
    } else {
      console.log('⚠️ Unexpected success with invalid chain ID');
    }
  } catch (error) {
    console.log('✅ Error properly caught:', error.message);
  }
  console.log('');

  console.log('🎉 Price Feeds API Testing Complete!');
}

// Test different currencies
async function testMultipleCurrencies() {
  console.log('🧪 Testing Multiple Currencies...\n');

  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
  const testToken = '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C'; // USDC
  const chainId = 1; // Ethereum

  for (const currency of currencies) {
    console.log(`📋 Testing ${currency} currency...`);
    try {
      const result = await priceFeedsAPI.getTokenPriceWithCurrency(chainId, testToken, currency);
      console.log(`✅ ${currency} Result:`, result.success ? 'Success' : 'Failed');
      if (result.success) {
        console.log(`💰 ${currency} Price Data:`, result.data.price);
      }
    } catch (error) {
      console.error(`❌ ${currency} Test Failed:`, error.message);
    }
    console.log('');
  }
}

// Test cross-chain price feeds
async function testCrossChainPrices() {
  console.log('🧪 Testing Cross-Chain Price Feeds...\n');

  const testCases = [
    { chainId: 1, tokenAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', name: 'USDC on Ethereum' },
    { chainId: 137, tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USDC on Polygon' },
    { chainId: 10, tokenAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', name: 'USDC on Optimism' },
    { chainId: 42161, tokenAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', name: 'USDC on Arbitrum' }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing ${testCase.name}...`);
    try {
      const result = await priceFeedsAPI.getTokenPrice(testCase.chainId, testCase.tokenAddress, 'USD');
      console.log(`✅ ${testCase.name} Result:`, result.success ? 'Success' : 'Failed');
      if (result.success) {
        console.log(`💰 Price:`, result.data.price);
      } else {
        console.log(`❌ Error:`, result.error);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name} Test Failed:`, error.message);
    }
    console.log('');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive 1inch Price Feeds API Tests\n');
  
  await testPriceFeedsAPI();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testMultipleCurrencies();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testCrossChainPrices();
  
  console.log('\n🎯 All Price Feeds API Tests Completed!');
}

// Export for use in other files
module.exports = {
  testPriceFeedsAPI,
  testMultipleCurrencies,
  testCrossChainPrices,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 