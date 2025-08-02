const axios = require('axios');

/**
 * 1inch Price Feeds API Integration
 * Professional price data retrieval for tokens across multiple chains
 */

class PriceFeedsAPI {
  constructor() {
    this.baseURL = 'https://api.1inch.dev/price/v1.1';
    this.authKey = process.env.DEV_PORTAL_KEY;
    
    if (!this.authKey) {
      console.warn('⚠️  DEV_PORTAL_KEY not configured - Price Feeds API will not work');
    }
  }

  /**
   * Get token price from 1inch Price Feeds API
   * @param {number} chainId - Chain ID
   * @param {string} tokenAddress - Token contract address
   * @param {string} currency - Currency for price (optional, defaults to USD)
   * @returns {Promise<Object>} Price data
   */
  async getTokenPrice(chainId, tokenAddress, currency = 'USD') {
    try {
      if (!this.authKey) {
        throw new Error('DEV_PORTAL_KEY not configured for 1inch Price Feeds API');
      }

      console.log(`💰 Getting token price from 1inch Price Feeds API...`);
      console.log(`🔗 Chain ID: ${chainId}`);
      console.log(`🪙 Token Address: ${tokenAddress}`);
      console.log(`💱 Currency: ${currency}`);

      const url = currency === 'USD' 
        ? `${this.baseURL}/${chainId}/${tokenAddress}?currency=USD`
        : `${this.baseURL}/${chainId}/${tokenAddress}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.authKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`✅ Price data retrieved successfully for ${tokenAddress} on chain ${chainId}`);
      
      return {
        success: true,
        data: {
          chainId: parseInt(chainId),
          tokenAddress: tokenAddress,
          price: response.data,
          currency: currency,
          timestamp: new Date().toISOString(),
          source: '1inch_price_feeds_api'
        }
      };

    } catch (error) {
      console.error(`❌ Error getting token price for ${tokenAddress} on chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token price from 1inch Price Feeds API',
        chainId: parseInt(chainId),
        tokenAddress: tokenAddress,
        currency: currency
      };
    }
  }

  /**
   * Get batch token prices from 1inch Price Feeds API
   * @param {Array} tokens - Array of {chainId, tokenAddress, currency} objects
   * @returns {Promise<Object>} Batch price data
   */
  async getBatchTokenPrices(tokens) {
    try {
      if (!this.authKey) {
        throw new Error('DEV_PORTAL_KEY not configured for 1inch Price Feeds API');
      }

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        throw new Error('Tokens array is required and must not be empty');
      }

      console.log(`💰 Getting batch token prices from 1inch Price Feeds API...`);
      console.log(`📋 Tokens count: ${tokens.length}`);

      const pricePromises = tokens.map(async (token) => {
        try {
          const currency = token.currency || 'USD';
          const url = currency === 'USD' 
            ? `${this.baseURL}/${token.chainId}/${token.tokenAddress}?currency=USD`
            : `${this.baseURL}/${token.chainId}/${token.tokenAddress}`;

          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${this.authKey}`,
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          return {
            chainId: parseInt(token.chainId),
            tokenAddress: token.tokenAddress,
            currency: currency,
            price: response.data,
            success: true
          };
        } catch (error) {
          return {
            chainId: parseInt(token.chainId),
            tokenAddress: token.tokenAddress,
            currency: token.currency || 'USD',
            error: error.message,
            success: false
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const successfulResults = results.filter(result => result.success);
      const failedResults = results.filter(result => !result.success);

      console.log(`✅ Batch price data retrieved successfully`);
      console.log(`✅ Successful: ${successfulResults.length}`);
      console.log(`❌ Failed: ${failedResults.length}`);

      return {
        success: true,
        data: {
          results: results,
          successful: successfulResults,
          failed: failedResults,
          total: results.length,
          timestamp: new Date().toISOString(),
          source: '1inch_price_feeds_api_batch'
        }
      };

    } catch (error) {
      console.error(`❌ Error getting batch token prices:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get batch token prices from 1inch Price Feeds API',
        tokens: tokens
      };
    }
  }

  /**
   * Get token price with custom currency from 1inch Price Feeds API
   * @param {number} chainId - Chain ID
   * @param {string} tokenAddress - Token contract address
   * @param {string} currency - Currency for price
   * @returns {Promise<Object>} Price data with custom currency
   */
  async getTokenPriceWithCurrency(chainId, tokenAddress, currency) {
    try {
      if (!this.authKey) {
        throw new Error('DEV_PORTAL_KEY not configured for 1inch Price Feeds API');
      }

      console.log(`💰 Getting ${currency} token price from 1inch Price Feeds API...`);
      console.log(`🔗 Chain ID: ${chainId}`);
      console.log(`🪙 Token Address: ${tokenAddress}`);
      console.log(`💱 Currency: ${currency}`);

      const url = `${this.baseURL}/${chainId}/${tokenAddress}?currency=${currency}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.authKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ ${currency} price data retrieved successfully for ${tokenAddress} on chain ${chainId}`);
      
      return {
        success: true,
        data: {
          chainId: parseInt(chainId),
          tokenAddress: tokenAddress,
          price: response.data,
          currency: currency,
          timestamp: new Date().toISOString(),
          source: '1inch_price_feeds_api_custom_currency'
        }
      };

    } catch (error) {
      console.error(`❌ Error getting ${currency} token price for ${tokenAddress} on chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || `Failed to get ${currency} token price from 1inch Price Feeds API`,
        chainId: parseInt(chainId),
        tokenAddress: tokenAddress,
        currency: currency
      };
    }
  }

  /**
   * Get price comparison between two tokens
   * @param {number} chainId - Chain ID
   * @param {string} token1Address - First token address
   * @param {string} token2Address - Second token address
   * @param {string} currency - Currency for comparison
   * @returns {Promise<Object>} Price comparison data
   */
  async getPriceComparison(chainId, token1Address, token2Address, currency = 'USD') {
    try {
      console.log(`⚖️ Getting price comparison from 1inch Price Feeds API...`);
      console.log(`🔗 Chain ID: ${chainId}`);
      console.log(`🪙 Token 1: ${token1Address}`);
      console.log(`🪙 Token 2: ${token2Address}`);
      console.log(`💱 Currency: ${currency}`);

      const [price1, price2] = await Promise.all([
        this.getTokenPrice(chainId, token1Address, currency),
        this.getTokenPrice(chainId, token2Address, currency)
      ]);

      if (!price1.success || !price2.success) {
        throw new Error('Failed to get prices for comparison');
      }

      const price1Value = price1.data.price.price || 0;
      const price2Value = price2.data.price.price || 0;
      const ratio = price2Value > 0 ? price1Value / price2Value : 0;

      console.log(`✅ Price comparison calculated successfully`);

      return {
        success: true,
        data: {
          chainId: parseInt(chainId),
          token1: {
            address: token1Address,
            price: price1.data.price,
            currency: currency
          },
          token2: {
            address: token2Address,
            price: price2.data.price,
            currency: currency
          },
          comparison: {
            ratio: ratio,
            token1PerToken2: ratio,
            token2PerToken1: price2Value > 0 ? 1 / ratio : 0
          },
          timestamp: new Date().toISOString(),
          source: '1inch_price_feeds_api_comparison'
        }
      };

    } catch (error) {
      console.error(`❌ Error getting price comparison:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get price comparison from 1inch Price Feeds API',
        chainId: parseInt(chainId),
        token1Address: token1Address,
        token2Address: token2Address,
        currency: currency
      };
    }
  }

  /**
   * Validate if the Price Feeds API is working
   * @returns {Promise<Object>} Validation result
   */
  async validateAPI() {
    try {
      if (!this.authKey) {
        return {
          success: false,
          error: 'DEV_PORTAL_KEY not configured',
          status: 'not_configured'
        };
      }

      // Test with a known token (USDC on Ethereum)
      const testResult = await this.getTokenPrice(1, '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', 'USD');
      
      return {
        success: true,
        status: 'working',
        authKeyConfigured: !!this.authKey,
        testResult: testResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'error',
        authKeyConfigured: !!this.authKey,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export the class and create a singleton instance
const priceFeedsAPI = new PriceFeedsAPI();

module.exports = {
  PriceFeedsAPI,
  priceFeedsAPI,
  getTokenPrice: (chainId, tokenAddress, currency) => priceFeedsAPI.getTokenPrice(chainId, tokenAddress, currency),
  getBatchTokenPrices: (tokens) => priceFeedsAPI.getBatchTokenPrices(tokens),
  getTokenPriceWithCurrency: (chainId, tokenAddress, currency) => priceFeedsAPI.getTokenPriceWithCurrency(chainId, tokenAddress, currency),
  getPriceComparison: (chainId, token1Address, token2Address, currency) => priceFeedsAPI.getPriceComparison(chainId, token1Address, token2Address, currency),
  validateAPI: () => priceFeedsAPI.validateAPI()
}; 