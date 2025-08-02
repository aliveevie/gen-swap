const { aiTools } = require('./tools/ai.js');
const { deFiTools } = require('./tools/tools.js');

/**
 * Test AI Tools Integration
 * Verifies that all AI and DeFi tools are working correctly
 */

async function testAITools() {
  console.log('🧪 Testing AI Tools Integration...\n');

  // Test 1: Validate AI Configuration
  console.log('📋 Test 1: Validating AI Configuration');
  try {
    const aiConfig = aiTools.validateConfiguration();
    console.log('✅ AI Configuration:', aiConfig);
  } catch (error) {
    console.error('❌ AI Configuration Test Failed:', error.message);
  }
  console.log('');

  // Test 2: Validate DeFi Tools Configuration
  console.log('📋 Test 2: Validating DeFi Tools Configuration');
  try {
    const toolsConfig = deFiTools.validateConfiguration();
    console.log('✅ DeFi Tools Configuration:', toolsConfig);
  } catch (error) {
    console.error('❌ DeFi Tools Configuration Test Failed:', error.message);
  }
  console.log('');

  // Test 3: Test AI Chat Response
  console.log('📋 Test 3: Testing AI Chat Response');
  try {
    const chatResult = await aiTools.generateAIResponse('How do I perform a cross-chain swap?', {
      fromChain: 'ethereum',
      toChain: 'polygon',
      fromToken: 'USDC',
      toToken: 'USDT'
    });
    console.log('✅ AI Chat Result:', chatResult.success ? 'Success' : 'Failed');
    if (chatResult.success) {
      console.log('🤖 AI Response:', chatResult.response.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', chatResult.error);
    }
  } catch (error) {
    console.error('❌ AI Chat Test Failed:', error.message);
  }
  console.log('');

  // Test 4: Test Swap Analysis
  console.log('📋 Test 4: Testing Swap Analysis');
  try {
    const swapData = {
      fromToken: 'USDC',
      toToken: 'USDT',
      fromNetwork: 'ethereum',
      toNetwork: 'polygon',
      amount: '100',
      fromChainId: 1,
      toChainId: 137
    };
    
    const analysisResult = await aiTools.analyzeSwapTransaction(swapData);
    console.log('✅ Swap Analysis Result:', analysisResult.success ? 'Success' : 'Failed');
    if (analysisResult.success) {
      console.log('🔍 Analysis:', analysisResult.analysis.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', analysisResult.error);
    }
  } catch (error) {
    console.error('❌ Swap Analysis Test Failed:', error.message);
  }
  console.log('');

  // Test 5: Test Market Insights
  console.log('📋 Test 5: Testing Market Insights');
  try {
    const tokens = ['USDC', 'USDT', 'ETH'];
    const priceData = {
      USDC: { price: 1.00, change24h: 0.1 },
      USDT: { price: 1.00, change24h: -0.05 },
      ETH: { price: 3000, change24h: 2.5 }
    };
    
    const insightsResult = await aiTools.getMarketInsights(tokens, priceData);
    console.log('✅ Market Insights Result:', insightsResult.success ? 'Success' : 'Failed');
    if (insightsResult.success) {
      console.log('📊 Insights:', insightsResult.insights.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', insightsResult.error);
    }
  } catch (error) {
    console.error('❌ Market Insights Test Failed:', error.message);
  }
  console.log('');

  // Test 6: Test Educational Content
  console.log('📋 Test 6: Testing Educational Content');
  try {
    const educationalResult = await aiTools.generateEducationalContent('cross-chain swaps');
    console.log('✅ Educational Content Result:', educationalResult.success ? 'Success' : 'Failed');
    if (educationalResult.success) {
      console.log('📚 Content:', educationalResult.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', educationalResult.error);
    }
  } catch (error) {
    console.error('❌ Educational Content Test Failed:', error.message);
  }
  console.log('');

  // Test 7: Test Swap Optimization
  console.log('📋 Test 7: Testing Swap Optimization');
  try {
    const swapRequest = {
      fromToken: 'USDC',
      toToken: 'USDT',
      fromNetwork: 'ethereum',
      toNetwork: 'polygon',
      amount: '100',
      fromChainId: 1,
      toChainId: 137,
      slippage: 0.5,
      gasPriority: 'medium'
    };
    
    const optimizationResult = await aiTools.optimizeSwapParameters(swapRequest);
    console.log('✅ Swap Optimization Result:', optimizationResult.success ? 'Success' : 'Failed');
    if (optimizationResult.success) {
      console.log('⚡ Recommendations:', optimizationResult.recommendations.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', optimizationResult.error);
    }
  } catch (error) {
    console.error('❌ Swap Optimization Test Failed:', error.message);
  }
  console.log('');

  // Test 8: Test DeFi Tools - Gas Price
  console.log('📋 Test 8: Testing DeFi Tools - Gas Price');
  try {
    const gasResult = await deFiTools.getGasPrice(1); // Ethereum
    console.log('✅ Gas Price Result:', gasResult.success ? 'Success' : 'Failed');
    if (gasResult.success) {
      console.log('⛽ Gas Data:', JSON.stringify(gasResult.data, null, 2));
    } else {
      console.log('❌ Error:', gasResult.error);
    }
  } catch (error) {
    console.error('❌ Gas Price Test Failed:', error.message);
  }
  console.log('');

  console.log('🎉 AI Tools Integration Testing Complete!');
}

// Test different scenarios
async function testAdvancedScenarios() {
  console.log('🧪 Testing Advanced AI Scenarios...\n');

  // Test complex swap analysis
  console.log('📋 Advanced Test 1: Complex Swap Analysis');
  try {
    const complexSwapData = {
      fromToken: 'ETH',
      toToken: 'USDC',
      fromNetwork: 'ethereum',
      toNetwork: 'arbitrum',
      amount: '1.5',
      fromChainId: 1,
      toChainId: 42161,
      gasFee: '0.005',
      slippage: 0.3
    };
    
    const result = await aiTools.analyzeSwapTransaction(complexSwapData);
    console.log('✅ Complex Analysis Result:', result.success ? 'Success' : 'Failed');
  } catch (error) {
    console.error('❌ Complex Analysis Failed:', error.message);
  }
  console.log('');

  // Test market insights with real data
  console.log('📋 Advanced Test 2: Market Insights with Real Data');
  try {
    const realPriceData = {
      ETH: { price: 3200, change24h: 3.2, volume24h: 1500000000 },
      USDC: { price: 1.00, change24h: 0.0, volume24h: 500000000 },
      USDT: { price: 1.00, change24h: -0.1, volume24h: 800000000 }
    };
    
    const result = await aiTools.getMarketInsights(['ETH', 'USDC', 'USDT'], realPriceData);
    console.log('✅ Market Insights Result:', result.success ? 'Success' : 'Failed');
  } catch (error) {
    console.error('❌ Market Insights Failed:', error.message);
  }
  console.log('');

  console.log('🎯 Advanced AI Scenarios Testing Complete!');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive AI Tools Testing\n');
  
  await testAITools();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testAdvancedScenarios();
  
  console.log('\n🎯 All AI Tools Tests Completed!');
}

// Export for use in other files
module.exports = {
  testAITools,
  testAdvancedScenarios,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 