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
      
      // Convert balances to human-readable format
      const readableBalances = {};
      let totalValueUSD = 0;
      
      if (balanceData.balances) {
        for (const [tokenAddress, balance] of Object.entries(balanceData.balances)) {
          if (balance && balance !== '0') {
            // Convert from wei to human readable (assuming 18 decimals for most tokens)
            const balanceInWei = BigInt(balance);
            const balanceInEth = Number(balanceInWei) / Math.pow(10, 18);
            
            // Get token symbol from address (you can expand this mapping)
            const tokenSymbol = getTokenSymbol(tokenAddress, chainId);
            
            readableBalances[tokenAddress] = {
              symbol: tokenSymbol,
              balance: balanceInEth,
              balanceWei: balance,
              address: tokenAddress
            };
            
            // For ETH (0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee), estimate USD value
            if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
              // Rough estimate: 1 ETH ≈ $2000 (you can make this dynamic)
              totalValueUSD += balanceInEth * 2000;
            }
          }
        }
      }
      
      const prompt = `Analyze this wallet balance data and provide professional insights:

Wallet Balance Analysis for ${walletAddress} on Chain ${chainId}:

Human-Readable Balances:
${Object.entries(readableBalances).map(([addr, data]) => 
  `- ${data.symbol}: ${data.balance.toFixed(6)} (${data.balanceWei} wei)`
).join('\n')}

Total Estimated Portfolio Value: $${totalValueUSD.toLocaleString()}

Please provide a professional analysis with the following structure:

## Portfolio Overview
- Total portfolio value and key metrics
- Network and wallet summary

## Token Holdings Analysis
- Breakdown of significant holdings
- Token distribution percentages
- Notable positions and their implications

## Market Context
- Current market conditions
- Token performance insights
- Network-specific considerations

## Risk Assessment
- Portfolio concentration analysis
- Diversification recommendations
- Risk mitigation strategies

## DeFi Opportunities
- Yield farming possibilities
- Liquidity provision opportunities
- Staking and governance participation

## Strategic Recommendations
- Portfolio optimization suggestions
- Investment strategy adjustments
- Market timing considerations

Make the response professional, data-driven, and actionable. Use proper formatting with markdown.`;

      const aiResult = await this.generateAIResponse(prompt, { balanceData, chainId, walletAddress });
      
      return {
        success: true,
        balanceData: balanceData,
        readableBalances: readableBalances,
        totalValueUSD: totalValueUSD,
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
   * Helper function to get token symbol from address
   * @param {string} tokenAddress - Token contract address
   * @param {number} chainId - Chain ID
   * @returns {string} Token symbol
   */
  getTokenSymbol(tokenAddress, chainId) {
    const tokenMappings = {
      // Ethereum Mainnet
      1: {
        '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c': 'USDC',
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
        '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI'
      },
      // Arbitrum
      42161: {
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC',
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT',
        '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'WETH',
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'USDC.e',
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'DAI'
      },
      // Polygon
      137: {
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDC',
        '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
        '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 'WETH',
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'MATIC',
        '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'WMATIC'
      },
      // Base
      8453: {
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
        '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'USDT',
        '0x4200000000000000000000000000000000000006': 'WETH',
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH'
      }
    };
    
    const chainTokens = tokenMappings[chainId] || {};
    return chainTokens[tokenAddress.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Get token list analysis with AI insights
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Token list analysis
   */
  async getTokenListAnalysis(chainId) {
    try {
      console.log(`🤖 Getting token list analysis for chain ${chainId}...`);

      // Import the tools module to get token list data
      const { getTokenList } = require('./tools.js');
      
      const tokenListResult = await getTokenList(chainId);
      
      if (!tokenListResult.success) {
        throw new Error(`Failed to get token list: ${tokenListResult.error}`);
      }

      const tokenListData = tokenListResult.data;
      
      // Analyze token categories and types
      const tokenAnalysis = this.analyzeTokenList(tokenListData, chainId);
      
      const prompt = `Analyze this token list data and provide comprehensive insights:

Token List Analysis for Chain ${chainId}:

Token Statistics:
- Total Tokens: ${tokenListData?.tokens?.length || 0}
- Token Categories: ${tokenAnalysis.categories.join(', ')}
- Notable Tokens: ${tokenAnalysis.notableTokens.join(', ')}
- Market Coverage: ${tokenAnalysis.marketCoverage}

Token Distribution:
${tokenAnalysis.categoryBreakdown.map(cat => `- ${cat.name}: ${cat.count} tokens (${cat.percentage}%)`).join('\n')}

Please provide a professional analysis with the following structure:

## Network Overview
- Chain characteristics and token ecosystem
- Market maturity and diversity assessment
- Network-specific advantages

## Token Ecosystem Analysis
- Token diversity and distribution
- Notable projects and protocols
- Market coverage and gaps

## DeFi Opportunities
- Available DeFi protocols and tokens
- Yield farming and liquidity opportunities
- Emerging trends and new tokens

## Market Insights
- Token categories and their significance
- Popular tokens and their use cases
- Network-specific token advantages

## Strategic Recommendations
- Token selection strategies
- Portfolio diversification opportunities
- Risk assessment and considerations

Make the response professional, data-driven, and actionable. Use proper formatting with markdown.`;

      const aiResult = await this.generateAIResponse(prompt, { tokenListData, tokenAnalysis, chainId });
      
      return {
        success: true,
        tokenListData: tokenListData,
        tokenAnalysis: tokenAnalysis,
        aiAnalysis: aiResult.response || aiResult.fallback,
        chainId: chainId,
        tokenCount: tokenListResult.tokenCount,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Token list analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token list analysis',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Helper function to analyze token list data
   * @param {Object} tokenListData - Token list data from API
   * @param {number} chainId - Chain ID
   * @returns {Object} Token analysis
   */
  analyzeTokenList(tokenListData, chainId) {
    const tokens = tokenListData?.tokens || [];
    const categories = new Set();
    const notableTokens = [];
    
    // Define token categories
    const categoryMappings = {
      'USDC': 'Stablecoins',
      'USDT': 'Stablecoins', 
      'DAI': 'Stablecoins',
      'WETH': 'Wrapped Tokens',
      'WBTC': 'Wrapped Tokens',
      'WMATIC': 'Wrapped Tokens',
      'ETH': 'Native Tokens',
      'MATIC': 'Native Tokens',
      'ARB': 'Governance Tokens',
      'UNI': 'DeFi Tokens',
      'AAVE': 'DeFi Tokens',
      'CRV': 'DeFi Tokens',
      'COMP': 'DeFi Tokens'
    };
    
    // Analyze tokens
    tokens.forEach(token => {
      const symbol = token.symbol || 'UNKNOWN';
      
      // Categorize tokens
      if (categoryMappings[symbol]) {
        categories.add(categoryMappings[symbol]);
      } else if (symbol.includes('USD') || symbol.includes('USDC') || symbol.includes('USDT')) {
        categories.add('Stablecoins');
      } else if (symbol.startsWith('W')) {
        categories.add('Wrapped Tokens');
      } else if (symbol.includes('LP') || symbol.includes('UNI')) {
        categories.add('LP Tokens');
      } else {
        categories.add('Other Tokens');
      }
      
      // Identify notable tokens
      if (['USDC', 'USDT', 'WETH', 'WBTC', 'DAI', 'UNI', 'AAVE'].includes(symbol)) {
        notableTokens.push(symbol);
      }
    });
    
    // Calculate category breakdown
    const categoryBreakdown = Array.from(categories).map(category => {
      const count = tokens.filter(token => {
        const symbol = token.symbol || 'UNKNOWN';
        if (category === 'Stablecoins') {
          return symbol.includes('USD') || symbol.includes('USDC') || symbol.includes('USDT') || symbol === 'DAI';
        } else if (category === 'Wrapped Tokens') {
          return symbol.startsWith('W') && symbol !== 'WMATIC';
        } else if (category === 'LP Tokens') {
          return symbol.includes('LP') || symbol.includes('UNI');
        } else if (category === 'Other Tokens') {
          return !symbol.includes('USD') && !symbol.startsWith('W') && !symbol.includes('LP');
        }
        return false;
      }).length;
      
      return {
        name: category,
        count: count,
        percentage: tokens.length > 0 ? Math.round((count / tokens.length) * 100) : 0
      };
    });
    
    return {
      categories: Array.from(categories),
      notableTokens: notableTokens,
      categoryBreakdown: categoryBreakdown,
      marketCoverage: this.getMarketCoverage(chainId, tokens.length)
    };
  }

  /**
   * Helper function to get market coverage assessment
   * @param {number} chainId - Chain ID
   * @param {number} tokenCount - Number of tokens
   * @returns {string} Market coverage assessment
   */
  getMarketCoverage(chainId, tokenCount) {
    const networkInfo = {
      1: { name: 'Ethereum', expectedTokens: 1000 },
      42161: { name: 'Arbitrum', expectedTokens: 500 },
      137: { name: 'Polygon', expectedTokens: 800 },
      8453: { name: 'Base', expectedTokens: 300 }
    };
    
    const network = networkInfo[chainId] || { name: 'Unknown', expectedTokens: 500 };
    const coverage = (tokenCount / network.expectedTokens) * 100;
    
    if (coverage >= 80) return 'Excellent';
    if (coverage >= 60) return 'Good';
    if (coverage >= 40) return 'Moderate';
    return 'Limited';
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
   * Analyze Fusion Intent order with AI
   * @param {Object} orderData - Fusion Intent order data
   * @returns {Promise<Object>} AI analysis
   */
  async analyzeFusionIntentOrder(orderData) {
    try {
      console.log(`🤖 Analyzing Fusion Intent order...`);

      const prompt = `Analyze this Fusion Intent order and provide insights:

Order Data:
${JSON.stringify(orderData, null, 2)}

Please provide:
1. Order structure analysis
2. Security assessment
3. Execution efficiency
4. Cost optimization opportunities
5. Risk factors and recommendations
6. Best practices compliance

Focus on Fusion Intent specific features and advantages.`;

      const result = await this.generateAIResponse(prompt, { orderData });
      
      return {
        success: true,
        analysis: result.response || result.fallback,
        orderData: orderData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Fusion Intent order analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to analyze Fusion Intent order',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Fusion Intent quote with AI analysis
   * @param {Object} quoteParams - Quote parameters
   * @returns {Promise<Object>} Quote with AI analysis
   */
  async getFusionIntentQuoteWithAnalysis(quoteParams) {
    try {
      console.log(`🤖 Getting Fusion Intent quote with AI analysis...`);

      // Import the tools module to get quote data
      const { getFusionIntentQuote } = require('./tools.js');
      
      const quoteResult = await getFusionIntentQuote(quoteParams);
      
      if (!quoteResult.success) {
        throw new Error(`Failed to get Fusion Intent quote: ${quoteResult.error}`);
      }

      const quoteData = quoteResult.data;
      const prompt = `Analyze this Fusion Intent quote and provide insights:

Quote Parameters:
${JSON.stringify(quoteParams, null, 2)}

Quote Data:
${JSON.stringify(quoteData, null, 2)}

Please provide:
1. Quote efficiency analysis
2. Cost breakdown and optimization
3. Execution timing recommendations
4. Risk assessment
5. Alternative route suggestions
6. Best practices for Fusion Intent

Make it actionable for users.`;

      const aiResult = await this.generateAIResponse(prompt, { quoteData, quoteParams });
      
      return {
        success: true,
        quoteData: quoteData,
        aiAnalysis: aiResult.response || aiResult.fallback,
        quoteParams: quoteParams,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Fusion Intent quote analysis failed:', error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get Fusion Intent quote with analysis',
        quoteParams: quoteParams,
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
  getTokenListAnalysis: (chainId) => aiTools.getTokenListAnalysis(chainId),
  analyzeFusionIntentOrder: (orderData) => aiTools.analyzeFusionIntentOrder(orderData),
  getFusionIntentQuoteWithAnalysis: (quoteParams) => aiTools.getFusionIntentQuoteWithAnalysis(quoteParams),
  validateConfiguration: () => aiTools.validateConfiguration()
}; 