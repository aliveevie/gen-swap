const axios = require('axios');

/**
 * AI Tools for GenSwap DeFi Platform
 * Integrates OpenAI API with 1inch APIs for intelligent DeFi assistance
 */

class AITools {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.devPortalKey = process.env.DEV_PORTAL_KEY;
    this.openaiBaseURL = 'https://api.openai.com/v1';
    
    if (!this.openaiApiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured - AI features will be limited');
    }
    
    if (!this.devPortalKey) {
      console.warn('⚠️  DEV_PORTAL_KEY not configured - 1inch API features will be limited');
    }
  }

  /**
   * Validate AI tools configuration
   * @returns {Object} Configuration status
   */
  validateConfiguration() {
    return {
      openaiConfigured: !!this.openaiApiKey,
      devPortalConfigured: !!this.devPortalKey,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate AI response using OpenAI API
   * @param {string} prompt - User input
   * @param {Object} context - Additional context (optional)
   * @returns {Promise<Object>} AI response
   */
  async generateAIResponse(prompt, context = {}) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      console.log('🤖 Generating AI response for:', prompt.substring(0, 100) + '...');

      const systemPrompt = `You are an expert DeFi assistant for GenSwap, a cross-chain swap platform. You help users with:

1. Cross-chain swaps and token exchanges
2. Understanding token prices and market trends
3. Wallet balance management
4. Network selection and gas fees
5. Security best practices
6. 1inch API integration features

Current context: ${JSON.stringify(context)}

Provide helpful, accurate, and concise responses. Always prioritize user security and explain complex DeFi concepts clearly.`;

      const response = await axios.post(
        `${this.openaiBaseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      console.log('✅ AI response generated successfully');

      return {
        success: true,
        response: aiResponse,
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ AI response generation failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to generate AI response',
        fallback: this.getFallbackResponse(prompt),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get fallback response when AI is not available
   * @param {string} prompt - User input
   * @returns {string} Fallback response
   */
  getFallbackResponse(prompt) {
    const input = prompt.toLowerCase();
    
    if (input.includes('swap') || input.includes('exchange')) {
      return 'I can help you with cross-chain swaps! Select your source and destination chains, choose your tokens, enter the amount, and I\'ll guide you through the process. The platform supports 8+ major networks including Ethereum, Polygon, Arbitrum, and more.';
    }
    
    if (input.includes('price') || input.includes('quote')) {
      return 'Token prices are fetched in real-time from 1inch Price Feeds API. You can see live prices when you select tokens, and I can help you understand price movements and market trends.';
    }
    
    if (input.includes('balance') || input.includes('wallet')) {
      return 'Your wallet balance is automatically checked when you connect. I can help you understand your token balances across different networks and ensure you have sufficient funds for swaps.';
    }
    
    if (input.includes('network') || input.includes('chain')) {
      return 'GenSwap supports 8 major networks: Ethereum, Arbitrum, Base, Polygon, BSC, Avalanche, Optimism, and Fantom. Each network has different gas fees and transaction speeds.';
    }
    
    if (input.includes('gas') || input.includes('fee')) {
      return 'Gas fees vary by network. Ethereum typically has higher fees but is the most secure. Layer 2 networks like Arbitrum and Polygon offer lower fees.';
    }
    
    if (input.includes('security') || input.includes('safe')) {
      return 'GenSwap uses TRUE DeFi architecture - you maintain complete control of your wallet. All transactions are signed in your wallet, and the server only provides API access.';
    }
    
    return 'I\'m your AI DeFi assistant for GenSwap. I can help you with cross-chain swaps, token prices, wallet balances, network information, and general DeFi questions. How can I assist you today?';
  }

  /**
   * Analyze swap transaction with AI
   * @param {Object} swapData - Swap transaction data
   * @returns {Promise<Object>} AI analysis
   */
  async analyzeSwapTransaction(swapData) {
    try {
      const prompt = `Analyze this cross-chain swap transaction and provide insights:

Transaction Data:
- From: ${swapData.fromToken} on ${swapData.fromNetwork}
- To: ${swapData.toToken} on ${swapData.toNetwork}
- Amount: ${swapData.amount}
- Gas Fee: ${swapData.gasFee || 'N/A'}
- Slippage: ${swapData.slippage || 'N/A'}

Provide analysis on:
1. Transaction efficiency
2. Cost optimization opportunities
3. Security considerations
4. Network selection rationale
5. Recommendations for future swaps`;

      const result = await this.generateAIResponse(prompt, { swapData });
      
      return {
        success: true,
        analysis: result.response || result.fallback,
        transactionData: swapData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Swap analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to analyze swap transaction',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get market insights using AI
   * @param {Array} tokens - Array of token symbols
   * @param {Object} priceData - Current price data
   * @returns {Promise<Object>} Market insights
   */
  async getMarketInsights(tokens, priceData) {
    try {
      const prompt = `Analyze the current market situation for these tokens: ${tokens.join(', ')}

Current Price Data:
${JSON.stringify(priceData, null, 2)}

Provide insights on:
1. Market trends
2. Price movements
3. Trading opportunities
4. Risk assessment
5. Portfolio recommendations`;

      const result = await this.generateAIResponse(prompt, { tokens, priceData });
      
      return {
        success: true,
        insights: result.response || result.fallback,
        tokens: tokens,
        priceData: priceData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Market insights failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get market insights',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate DeFi education content
   * @param {string} topic - Educational topic
   * @returns {Promise<Object>} Educational content
   */
  async generateEducationalContent(topic) {
    try {
      const prompt = `Create educational content about this DeFi topic: ${topic}

Please provide:
1. Clear explanation of the concept
2. How it relates to cross-chain swaps
3. Practical examples
4. Best practices
5. Common pitfalls to avoid

Make it beginner-friendly but informative for advanced users too.`;

      const result = await this.generateAIResponse(prompt, { topic });
      
      return {
        success: true,
        content: result.response || result.fallback,
        topic: topic,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Educational content generation failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to generate educational content',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get token price information with AI analysis
   * @param {number} chainId - Chain ID
   * @param {string} tokenAddress - Token contract address
   * @param {string} currency - Currency for price
   * @returns {Promise<Object>} Token price with AI analysis
   */
  async getTokenPriceWithAnalysis(chainId, tokenAddress, currency = 'USD') {
    try {
      console.log(`🤖 Getting token price with AI analysis for ${tokenAddress} on chain ${chainId}...`);

      // Import the tools module to get price data
      const { getTokenPrice } = require('./tools.js');
      
      const priceResult = await getTokenPrice(chainId, tokenAddress, currency);
      
      if (!priceResult.success) {
        throw new Error(`Failed to get token price: ${priceResult.error}`);
      }

      const priceData = priceResult.data;
      const prompt = `Analyze this token price data and provide insights:

Token Price Data:
- Chain ID: ${chainId}
- Token Address: ${tokenAddress}
- Currency: ${currency}
- Price Data: ${JSON.stringify(priceData, null, 2)}

Please provide:
1. Current price analysis
2. Price trends (if available)
3. Market context
4. Trading recommendations
5. Risk assessment

Make it user-friendly and actionable.`;

      const aiResult = await this.generateAIResponse(prompt, { priceData, chainId, tokenAddress, currency });
      
      return {
        success: true,
        priceData: priceData,
        aiAnalysis: aiResult.response || aiResult.fallback,
        chainId: chainId,
        tokenAddress: tokenAddress,
        currency: currency,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Token price analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token price with analysis',
        chainId: chainId,
        tokenAddress: tokenAddress,
        currency: currency,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get gas price information with AI analysis
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Gas price with AI analysis
   */
  async getGasPriceWithAnalysis(chainId) {
    try {
      console.log(`🤖 Getting gas price with AI analysis for chain ${chainId}...`);

      // Import the tools module to get gas price data
      const { getGasPrice } = require('./tools.js');
      
      const gasResult = await getGasPrice(chainId);
      
      if (!gasResult.success) {
        throw new Error(`Failed to get gas price: ${gasResult.error}`);
      }

      const gasData = gasResult.data;
      const prompt = `Analyze this gas price data and provide insights:

Gas Price Data for Chain ${chainId}:
${JSON.stringify(gasData, null, 2)}

Please provide:
1. Current gas price analysis
2. Cost comparison (slow vs fast)
3. Transaction timing recommendations
4. Cost optimization tips
5. Network congestion assessment

Make it practical for users planning transactions.`;

      const aiResult = await this.generateAIResponse(prompt, { gasData, chainId });
      
      return {
        success: true,
        gasData: gasData,
        aiAnalysis: aiResult.response || aiResult.fallback,
        chainId: chainId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Gas price analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get gas price with analysis',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get wallet balance analysis with AI insights
   * @param {number} chainId - Chain ID
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Wallet balance analysis
   */
  async getWalletBalanceAnalysis(chainId, walletAddress) {
    try {
      console.log(`🤖 Getting wallet balance analysis for ${walletAddress} on chain ${chainId}...`);

      // Import the tools module to get wallet balance data
      const { getWalletBalances } = require('./tools.js');
      
      const balanceResult = await getWalletBalances(chainId, walletAddress);
      
      if (!balanceResult.success) {
        throw new Error(`Failed to get wallet balances: ${balanceResult.error}`);
      }

      const balanceData = balanceResult.data;
      const prompt = `Analyze this wallet balance data and provide insights:

Wallet Balance Data for ${walletAddress} on Chain ${chainId}:
${JSON.stringify(balanceData, null, 2)}

Please provide:
1. Portfolio overview and total value
2. Token distribution analysis
3. Notable holdings and their significance
4. Portfolio diversification assessment
5. Potential DeFi opportunities
6. Risk assessment and recommendations

Make it user-friendly and actionable for DeFi users.`;

      const aiResult = await this.generateAIResponse(prompt, { balanceData, chainId, walletAddress });
      
      return {
        success: true,
        balanceData: balanceData,
        aiAnalysis: aiResult.response || aiResult.fallback,
        chainId: chainId,
        walletAddress: walletAddress,
        balanceCount: balanceResult.balanceCount,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Wallet balance analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance analysis',
        chainId: chainId,
        walletAddress: walletAddress,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive price analysis for multiple tokens
   * @param {Array} tokens - Array of {chainId, tokenAddress, currency} objects
   * @returns {Promise<Object>} Comprehensive price analysis
   */
  async getComprehensivePriceAnalysis(tokens) {
    try {
      console.log(`🤖 Getting comprehensive price analysis for ${tokens.length} tokens...`);

      // Import the tools module to get batch price data
      const { getBatchTokenPrices } = require('./tools.js');
      
      const batchResult = await getBatchTokenPrices(tokens);
      
      if (!batchResult.success) {
        throw new Error(`Failed to get batch token prices: ${batchResult.error}`);
      }

      const priceData = batchResult.data;
      const prompt = `Analyze this batch token price data and provide comprehensive insights:

Batch Token Price Data:
${JSON.stringify(priceData, null, 2)}

Please provide:
1. Overall market analysis
2. Price comparisons between tokens
3. Trading opportunities
4. Portfolio recommendations
5. Risk assessment
6. Market trends

Focus on actionable insights for DeFi users.`;

      const aiResult = await this.generateAIResponse(prompt, { priceData, tokens });
      
      return {
        success: true,
        priceData: priceData,
        aiAnalysis: aiResult.response || aiResult.fallback,
        tokens: tokens,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Comprehensive price analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get comprehensive price analysis',
        tokens: tokens,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Optimize swap parameters with AI
   * @param {Object} swapRequest - Swap request parameters
   * @returns {Promise<Object>} Optimized parameters
   */
  async optimizeSwapParameters(swapRequest) {
    try {
      const prompt = `Optimize these swap parameters for best execution:

Swap Request:
- From: ${swapRequest.fromToken} on ${swapRequest.fromNetwork}
- To: ${swapRequest.toToken} on ${swapRequest.toNetwork}
- Amount: ${swapRequest.amount}
- Current Slippage: ${swapRequest.slippage || 'Not set'}
- Gas Priority: ${swapRequest.gasPriority || 'Not set'}

Provide recommendations for:
1. Optimal slippage tolerance
2. Gas fee optimization
3. Network selection
4. Timing considerations
5. Risk management`;

      const result = await this.generateAIResponse(prompt, { swapRequest });
      
      return {
        success: true,
        recommendations: result.response || result.fallback,
        originalRequest: swapRequest,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Swap optimization failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to optimize swap parameters',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export the class and create a singleton instance
const aiTools = new AITools();

module.exports = {
  AITools,
  aiTools,
  generateAIResponse: (prompt, context) => aiTools.generateAIResponse(prompt, context),
  analyzeSwapTransaction: (swapData) => aiTools.analyzeSwapTransaction(swapData),
  getMarketInsights: (tokens, priceData) => aiTools.getMarketInsights(tokens, priceData),
  generateEducationalContent: (topic) => aiTools.generateEducationalContent(topic),
  optimizeSwapParameters: (swapRequest) => aiTools.optimizeSwapParameters(swapRequest),
  getTokenPriceWithAnalysis: (chainId, tokenAddress, currency) => aiTools.getTokenPriceWithAnalysis(chainId, tokenAddress, currency),
  getGasPriceWithAnalysis: (chainId) => aiTools.getGasPriceWithAnalysis(chainId),
  getComprehensivePriceAnalysis: (tokens) => aiTools.getComprehensivePriceAnalysis(tokens),
  getWalletBalanceAnalysis: (chainId, walletAddress) => aiTools.getWalletBalanceAnalysis(chainId, walletAddress),
  validateConfiguration: () => aiTools.validateConfiguration()
}; 