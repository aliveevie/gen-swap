const axios = require('axios');

/**
 * DeFi Tools for GenSwap Platform
 * Utility functions and integrations using 1inch APIs and AI capabilities
 */

class DeFiTools {
  constructor() {
    this.devPortalKey = process.env.DEV_PORTAL_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.1inch.dev';
    
    if (!this.devPortalKey) {
      console.warn('⚠️  DEV_PORTAL_KEY not configured - 1inch API features will be limited');
    }
    
    if (!this.openaiApiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured - AI features will be limited');
    }
  }

  /**
   * Validate tools configuration
   * @returns {Object} Configuration status
   */
  validateConfiguration() {
    return {
      devPortalConfigured: !!this.devPortalKey,
      openaiConfigured: !!this.openaiApiKey,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get gas price information from 1inch API
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Gas price data
   */
  async getGasPrice(chainId) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`⛽ Getting gas price for chain ${chainId}...`);

      const response = await axios.get(`${this.baseURL}/gas-price/v1.1/${chainId}`, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Gas price retrieved for chain ${chainId}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Gas price retrieval failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get gas price',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get token metadata from 1inch API
   * @param {number} chainId - Chain ID
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<Object>} Token metadata
   */
  async getTokenMetadata(chainId, tokenAddress) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`🪙 Getting token metadata for ${tokenAddress} on chain ${chainId}...`);

      const response = await axios.get(`${this.baseURL}/token/v1.1/${chainId}/${tokenAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Token metadata retrieved for ${tokenAddress}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        tokenAddress: tokenAddress,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Token metadata retrieval failed for ${tokenAddress}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token metadata',
        chainId: chainId,
        tokenAddress: tokenAddress,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get token list for a network from 1inch API
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Token list
   */
  async getTokenList(chainId) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`📋 Getting token list for chain ${chainId}...`);

      const response = await axios.get(`${this.baseURL}/token/v1.1/${chainId}`, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log(`✅ Token list retrieved for chain ${chainId}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        tokenCount: response.data?.tokens?.length || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Token list retrieval failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token list',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get wallet balances from 1inch API
   * @param {number} chainId - Chain ID
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Wallet balances
   */
  async getWalletBalances(chainId, walletAddress) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`💰 Getting wallet balances for ${walletAddress} on chain ${chainId}...`);

      const response = await axios.get(`${this.baseURL}/balance/v1.1/${chainId}/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Wallet balances retrieved for ${walletAddress}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        walletAddress: walletAddress,
        balanceCount: response.data?.balances?.length || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Wallet balance retrieval failed for ${walletAddress}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get wallet balances',
        chainId: chainId,
        walletAddress: walletAddress,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get transaction history from 1inch API
   * @param {number} chainId - Chain ID
   * @param {string} walletAddress - Wallet address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Transaction history
   */
  async getTransactionHistory(chainId, walletAddress, options = {}) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`📜 Getting transaction history for ${walletAddress} on chain ${chainId}...`);

      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      if (options.from) queryParams.append('from', options.from);
      if (options.to) queryParams.append('to', options.to);

      const url = `${this.baseURL}/history/v1.1/${chainId}/${walletAddress}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log(`✅ Transaction history retrieved for ${walletAddress}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        walletAddress: walletAddress,
        transactionCount: response.data?.transactions?.length || 0,
        options: options,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Transaction history retrieval failed for ${walletAddress}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get transaction history',
        chainId: chainId,
        walletAddress: walletAddress,
        options: options,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get protocol information from 1inch API
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Protocol information
   */
  async getProtocolInfo(chainId) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`🔗 Getting protocol information for chain ${chainId}...`);

      const response = await axios.get(`${this.baseURL}/protocol/v1.1/${chainId}`, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Protocol information retrieved for chain ${chainId}`);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        protocolCount: response.data?.protocols?.length || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Protocol information retrieval failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get protocol information',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate optimal gas settings
   * @param {number} chainId - Chain ID
   * @param {string} priority - Gas priority (low, medium, high)
   * @returns {Promise<Object>} Optimal gas settings
   */
  async calculateOptimalGas(chainId, priority = 'medium') {
    try {
      const gasPriceResult = await this.getGasPrice(chainId);
      
      if (!gasPriceResult.success) {
        throw new Error('Failed to get gas price data');
      }

      const gasData = gasPriceResult.data;
      let optimalGasPrice;

      switch (priority) {
        case 'low':
          optimalGasPrice = gasData.slow || gasData.standard;
          break;
        case 'medium':
          optimalGasPrice = gasData.standard || gasData.fast;
          break;
        case 'high':
          optimalGasPrice = gasData.fast || gasData.instant;
          break;
        default:
          optimalGasPrice = gasData.standard;
      }

      console.log(`✅ Optimal gas calculated for chain ${chainId} with ${priority} priority`);

      return {
        success: true,
        chainId: chainId,
        priority: priority,
        optimalGasPrice: optimalGasPrice,
        allGasPrices: gasData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Optimal gas calculation failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to calculate optimal gas',
        chainId: chainId,
        priority: priority,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive wallet analysis
   * @param {number} chainId - Chain ID
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Wallet analysis
   */
  async getWalletAnalysis(chainId, walletAddress) {
    try {
      console.log(`🔍 Getting comprehensive wallet analysis for ${walletAddress} on chain ${chainId}...`);

      const [balancesResult, historyResult] = await Promise.all([
        this.getWalletBalances(chainId, walletAddress),
        this.getTransactionHistory(chainId, walletAddress, { limit: 50 })
      ]);

      const analysis = {
        walletAddress: walletAddress,
        chainId: chainId,
        balances: balancesResult.success ? balancesResult.data : null,
        transactions: historyResult.success ? historyResult.data : null,
        totalTokens: balancesResult.success ? balancesResult.balanceCount : 0,
        totalTransactions: historyResult.success ? historyResult.transactionCount : 0,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Wallet analysis completed for ${walletAddress}`);

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Wallet analysis failed for ${walletAddress}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get wallet analysis',
        walletAddress: walletAddress,
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get network statistics
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Network statistics
   */
  async getNetworkStats(chainId) {
    try {
      console.log(`📊 Getting network statistics for chain ${chainId}...`);

      const [gasResult, protocolsResult, tokensResult] = await Promise.all([
        this.getGasPrice(chainId),
        this.getProtocolInfo(chainId),
        this.getTokenList(chainId)
      ]);

      const stats = {
        chainId: chainId,
        gasPrices: gasResult.success ? gasResult.data : null,
        protocols: protocolsResult.success ? protocolsResult.data : null,
        tokens: tokensResult.success ? tokensResult.data : null,
        protocolCount: protocolsResult.success ? protocolsResult.protocolCount : 0,
        tokenCount: tokensResult.success ? tokensResult.tokenCount : 0,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Network statistics retrieved for chain ${chainId}`);

      return {
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Network statistics failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get network statistics',
        chainId: chainId,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export the class and create a singleton instance
const deFiTools = new DeFiTools();

module.exports = {
  DeFiTools,
  deFiTools,
  getGasPrice: (chainId) => deFiTools.getGasPrice(chainId),
  getTokenMetadata: (chainId, tokenAddress) => deFiTools.getTokenMetadata(chainId, tokenAddress),
  getTokenList: (chainId) => deFiTools.getTokenList(chainId),
  getWalletBalances: (chainId, walletAddress) => deFiTools.getWalletBalances(chainId, walletAddress),
  getTransactionHistory: (chainId, walletAddress, options) => deFiTools.getTransactionHistory(chainId, walletAddress, options),
  getProtocolInfo: (chainId) => deFiTools.getProtocolInfo(chainId),
  calculateOptimalGas: (chainId, priority) => deFiTools.calculateOptimalGas(chainId, priority),
  getWalletAnalysis: (chainId, walletAddress) => deFiTools.getWalletAnalysis(chainId, walletAddress),
  getNetworkStats: (chainId) => deFiTools.getNetworkStats(chainId),
  validateConfiguration: () => deFiTools.validateConfiguration()
}; 