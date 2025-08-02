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
   * Get gas price information from 1inch API (v1.6)
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Gas price data
   */
  async getGasPrice(chainId) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`⛽ Getting gas price for chain ${chainId} using 1inch API v1.6...`);

      const url = `https://api.1inch.dev/gas-price/v1.6/${chainId}`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
        timeout: 10000
      };

      const response = await axios.get(url, config);

      console.log(`✅ Gas price retrieved for chain ${chainId}:`, response.data);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        timestamp: new Date().toISOString(),
        source: '1inch_gas_price_api_v1.6'
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
   * Get token list for a network from 1inch API (v1.2)
   * @param {number} chainId - Chain ID
   * @returns {Promise<Object>} Token list
   */
  async getTokenList(chainId) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`📋 Getting token list for chain ${chainId} using 1inch API v1.2...`);

      const url = `https://api.1inch.dev/token/v1.2/${chainId}/custom`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
        timeout: 15000
      };

      const response = await axios.get(url, config);

      console.log(`✅ Token list retrieved for chain ${chainId}:`, response.data);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        tokenCount: response.data?.tokens?.length || 0,
        timestamp: new Date().toISOString(),
        source: '1inch_token_list_api_v1.2'
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
   * Get wallet balances from 1inch API (v1.2)
   * @param {number} chainId - Chain ID
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Wallet balances
   */
  async getWalletBalances(chainId, walletAddress) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`💰 Getting wallet balances for ${walletAddress} on chain ${chainId} using 1inch API v1.2...`);

      const url = `https://api.1inch.dev/balance/v1.2/${chainId}/balances/${walletAddress}`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
        timeout: 10000
      };

      const response = await axios.get(url, config);

      console.log(`✅ Wallet balances retrieved for ${walletAddress}:`, response.data);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        walletAddress: walletAddress,
        balanceCount: response.data?.balances?.length || 0,
        timestamp: new Date().toISOString(),
        source: '1inch_wallet_balances_api_v1.2'
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
   * Get token price from 1inch Price Feeds API
   * @param {number} chainId - Chain ID
   * @param {string} tokenAddress - Token contract address
   * @param {string} currency - Currency for price (optional, defaults to USD)
   * @returns {Promise<Object>} Token price data
   */
  async getTokenPrice(chainId, tokenAddress, currency = 'USD') {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`💰 Getting token price for ${tokenAddress} on chain ${chainId}...`);

      const url = currency === 'USD' 
        ? `https://api.1inch.dev/price/v1.1/${chainId}/${tokenAddress}?currency=USD`
        : `https://api.1inch.dev/price/v1.1/${chainId}/${tokenAddress}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Token price retrieved for ${tokenAddress}:`, response.data);

      return {
        success: true,
        data: response.data,
        chainId: chainId,
        tokenAddress: tokenAddress,
        currency: currency,
        timestamp: new Date().toISOString(),
        source: '1inch_price_feeds_api'
      };

    } catch (error) {
      console.error(`❌ Token price retrieval failed for ${tokenAddress}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token price',
        chainId: chainId,
        tokenAddress: tokenAddress,
        currency: currency,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive price analysis for multiple tokens
   * @param {Array} tokens - Array of {chainId, tokenAddress, currency} objects
   * @returns {Promise<Object>} Comprehensive price data
   */
  async getBatchTokenPrices(tokens) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        throw new Error('Tokens array is required and must not be empty');
      }

      console.log(`💰 Getting batch token prices for ${tokens.length} tokens...`);

      const pricePromises = tokens.map(async (token) => {
        try {
          const currency = token.currency || 'USD';
          const url = currency === 'USD' 
            ? `https://api.1inch.dev/price/v1.1/${token.chainId}/${token.tokenAddress}?currency=USD`
            : `https://api.1inch.dev/price/v1.1/${token.chainId}/${token.tokenAddress}`;

          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${this.devPortalKey}`,
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

      console.log(`✅ Batch price data retrieved: ${successfulResults.length} successful, ${failedResults.length} failed`);

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
      console.error(`❌ Batch token price retrieval failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get batch token prices',
        tokens: tokens,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get classic swap quote from 1inch API (v6.1)
   * @param {Object} swapParams - Swap parameters
   * @returns {Promise<Object>} Swap quote
   */
  async getClassicSwapQuote(swapParams) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { src, dst, amount, from, slippage, chainId } = swapParams;

      console.log(`🔄 Getting classic swap quote for ${src} -> ${dst} on chain ${chainId}...`);

      const url = `https://api.1inch.dev/swap/v6.1/${chainId}/quote`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {
          src,
          dst,
          amount,
          from,
          slippage: slippage || '1',
          disableEstimate: 'false',
          allowPartialFill: 'false'
        },
        timeout: 15000
      };

      console.log('📋 Classic swap quote request:', {
        url,
        params: config.params,
        headers: { Authorization: 'Bearer ***' }
      });

      const response = await axios.get(url, config);
      console.log(`✅ Classic swap quote retrieved:`, response.data);

      return {
        success: true,
        data: response.data,
        swapParams: swapParams,
        timestamp: new Date().toISOString(),
        source: '1inch_classic_swap_api_v6.1'
      };

    } catch (error) {
      console.error(`❌ Classic swap quote failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get classic swap quote',
        swapParams: swapParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get token allowance for classic swap
   * @param {Object} allowanceParams - Allowance parameters
   * @returns {Promise<Object>} Token allowance
   */
  async getTokenAllowance(allowanceParams) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { tokenAddress, walletAddress, chainId } = allowanceParams;

      console.log(`🔐 Getting token allowance for ${tokenAddress} on chain ${chainId}...`);

      const url = `https://api.1inch.dev/swap/v6.1/${chainId}/approve/allowance`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {
          tokenAddress,
          walletAddress
        },
        timeout: 10000
      };

      const response = await axios.get(url, config);
      console.log(`✅ Token allowance retrieved:`, response.data);

      return {
        success: true,
        data: response.data,
        allowanceParams: allowanceParams,
        timestamp: new Date().toISOString(),
        source: '1inch_classic_swap_api_v6.1'
      };

    } catch (error) {
      console.error(`❌ Token allowance retrieval failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get token allowance',
        allowanceParams: allowanceParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get approval transaction for classic swap
   * @param {Object} approvalParams - Approval parameters
   * @returns {Promise<Object>} Approval transaction
   */
  async getApprovalTransaction(approvalParams) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { tokenAddress, amount, chainId } = approvalParams;

      console.log(`✅ Getting approval transaction for ${tokenAddress} on chain ${chainId}...`);

      const url = `https://api.1inch.dev/swap/v6.1/${chainId}/approve/transaction`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {
          tokenAddress,
          amount
        },
        timeout: 10000
      };

      const response = await axios.get(url, config);
      console.log(`✅ Approval transaction retrieved:`, response.data);

      return {
        success: true,
        data: response.data,
        approvalParams: approvalParams,
        timestamp: new Date().toISOString(),
        source: '1inch_classic_swap_api_v6.1'
      };

    } catch (error) {
      console.error(`❌ Approval transaction retrieval failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get approval transaction',
        approvalParams: approvalParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get swap transaction for classic swap
   * @param {Object} swapParams - Swap parameters
   * @returns {Promise<Object>} Swap transaction
   */
  async getSwapTransaction(swapParams) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { src, dst, amount, from, slippage, chainId } = swapParams;

      console.log(`🔄 Getting swap transaction for ${src} -> ${dst} on chain ${chainId}...`);

      const url = `https://api.1inch.dev/swap/v6.1/${chainId}/swap`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {
          src,
          dst,
          amount,
          from,
          slippage: slippage || '1',
          disableEstimate: 'false',
          allowPartialFill: 'false'
        },
        timeout: 15000
      };

      const response = await axios.get(url, config);
      console.log(`✅ Swap transaction retrieved:`, response.data);

      return {
        success: true,
        data: response.data,
        swapParams: swapParams,
        timestamp: new Date().toISOString(),
        source: '1inch_classic_swap_api_v6.1'
      };

    } catch (error) {
      console.error(`❌ Swap transaction retrieval failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get swap transaction',
        swapParams: swapParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute classic swap with signed transaction
   * @param {Object} swapData - Complete swap data with signed transaction
   * @returns {Promise<Object>} Swap execution result
   */
  async executeClassicSwap(swapData) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { chainId, signedTx, swapParams, userRpcUrl } = swapData;

      console.log(`🚀 Executing classic swap on chain ${chainId}...`);

      if (!signedTx) {
        throw new Error('Signed transaction is required for swap execution');
      }

      // Use user's RPC URL if provided, otherwise use default
      const rpcUrl = userRpcUrl || process.env.RPC_URL;
      if (!rpcUrl) {
        throw new Error('RPC URL is required for transaction execution');
      }

      // Create Web3 instance with user's RPC
      const { Web3 } = require('web3');
      const web3 = new Web3(rpcUrl);

      // Send the signed transaction
      console.log('📡 Sending signed transaction...');
      const receipt = await web3.eth.sendSignedTransaction(signedTx);
      
      console.log(`✅ Classic swap executed successfully!`);
      console.log(`📋 Transaction hash: ${receipt.transactionHash}`);
      console.log(`📋 Block number: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        swapParams: swapParams,
        chainId: chainId,
        timestamp: new Date().toISOString(),
        source: '1inch_classic_swap_execution'
      };

    } catch (error) {
      console.error(`❌ Classic swap execution failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to execute classic swap',
        swapData: swapData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive classic swap analysis
   * @param {Object} swapParams - Swap parameters
   * @returns {Promise<Object>} Comprehensive swap analysis
   */
  async getClassicSwapAnalysis(swapParams) {
    try {
      console.log(`🔍 Getting comprehensive classic swap analysis...`);

      const { src, dst, amount, from, slippage, chainId } = swapParams;

      // Get quote, allowance, and gas price in parallel
      const [quoteResult, allowanceResult, gasResult] = await Promise.all([
        this.getClassicSwapQuote(swapParams),
        this.getTokenAllowance({ tokenAddress: src, walletAddress: from, chainId }),
        this.getGasPrice(chainId)
      ]);

      const analysis = {
        swapParams: swapParams,
        quote: quoteResult.success ? quoteResult.data : null,
        allowance: allowanceResult.success ? allowanceResult.data : null,
        gasPrice: gasResult.success ? gasResult.data : null,
        needsApproval: false,
        estimatedGas: null,
        estimatedCost: null,
        timestamp: new Date().toISOString()
      };

      // Check if approval is needed
      if (allowanceResult.success && quoteResult.success) {
        const currentAllowance = BigInt(allowanceResult.data.allowance);
        const requiredAmount = BigInt(amount);
        analysis.needsApproval = currentAllowance < requiredAmount;
      }

      // Calculate estimated gas and cost
      if (gasResult.success && quoteResult.success) {
        const gasData = gasResult.data;
        const standardGasPrice = gasData.standard || gasData.fast;
        
        // Estimate gas (approximate values)
        const estimatedGasForSwap = 200000; // Approximate gas for swap
        const estimatedGasForApproval = 50000; // Approximate gas for approval
        
        analysis.estimatedGas = {
          swap: estimatedGasForSwap,
          approval: analysis.needsApproval ? estimatedGasForApproval : 0,
          total: analysis.needsApproval ? estimatedGasForSwap + estimatedGasForApproval : estimatedGasForSwap
        };

        analysis.estimatedCost = {
          swap: (BigInt(estimatedGasForSwap) * BigInt(standardGasPrice)).toString(),
          approval: analysis.needsApproval ? (BigInt(estimatedGasForApproval) * BigInt(standardGasPrice)).toString() : '0',
          total: (BigInt(analysis.estimatedGas.total) * BigInt(standardGasPrice)).toString()
        };
      }

      console.log(`✅ Classic swap analysis completed`);

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Classic swap analysis failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get classic swap analysis',
        swapParams: swapParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Submit Fusion Intent order directly to 1inch API
   * @param {number} chainId - Chain ID
   * @param {Object} orderData - Order data with signature
   * @returns {Promise<Object>} Order submission result
   */
  async submitFusionIntentOrder(chainId, orderData) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      console.log(`🚀 Submitting Fusion Intent order for chain ${chainId}...`);

      const url = `https://api.1inch.dev/fusion/relayer/v2.0/${chainId}/order/submit`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      };

      // Validate required fields
      const requiredFields = ['order', 'signature', 'extension', 'quoteId'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate order structure
      const orderRequiredFields = ['salt', 'makerAsset', 'takerAsset', 'maker', 'receiver', 'makingAmount', 'takingAmount', 'makerTraits'];
      for (const field of orderRequiredFields) {
        if (!orderData.order[field]) {
          throw new Error(`Missing required order field: ${field}`);
        }
      }

      console.log('📋 Order data being submitted:', JSON.stringify(orderData, null, 2));

      try {
        const response = await axios.post(url, orderData, config);
        console.log(`✅ Fusion Intent order submitted successfully:`, response.data);

        return {
          success: true,
          data: response.data,
          chainId: chainId,
          orderHash: response.data?.orderHash || null,
          timestamp: new Date().toISOString(),
          source: '1inch_fusion_intent_api_v2.0'
        };
      } catch (error) {
        console.error(`❌ Fusion Intent order submission failed:`, error.message);
        
        return {
          success: false,
          error: error.message || 'Failed to submit Fusion Intent order',
          chainId: chainId,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`❌ Fusion Intent order submission failed for chain ${chainId}:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to submit Fusion Intent order',
        chainId: chainId,
        orderData: orderData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Fusion Intent quote from 1inch API
   * @param {Object} quoteParams - Quote parameters
   * @returns {Promise<Object>} Quote result
   */
  async getFusionIntentQuote(quoteParams) {
    try {
      if (!this.devPortalKey) {
        throw new Error('DEV_PORTAL_KEY not configured');
      }

      const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress } = quoteParams;

      console.log(`🔍 Getting Fusion Intent quote for ${srcChainId} -> ${dstChainId}...`);

      // Use the correct Fusion Intent quote endpoint
      const url = `https://api.1inch.dev/fusion/relayer/v2.0/${srcChainId}/quote`;

      const config = {
        headers: {
          'Authorization': `Bearer ${this.devPortalKey}`,
          'Accept': 'application/json'
        },
        params: {
          srcTokenAddress,
          dstTokenAddress,
          amount,
          walletAddress,
          dstChainId
        },
        timeout: 15000
      };

      console.log('📋 Fusion Intent quote request:', {
        url,
        params: config.params,
        headers: { Authorization: 'Bearer ***' }
      });

      try {
        const response = await axios.get(url, config);
        console.log(`✅ Fusion Intent quote retrieved:`, response.data);
        
        return {
          success: true,
          data: response.data,
          srcChainId,
          dstChainId,
          timestamp: new Date().toISOString(),
          source: '1inch_fusion_intent_api_v2.0'
        };
      } catch (error) {
        console.error(`❌ Fusion Intent quote failed:`, error.message);
        
        return {
          success: false,
          error: error.message || 'Failed to get Fusion Intent quote',
          srcChainId,
          dstChainId,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`❌ Fusion Intent quote failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Failed to get Fusion Intent quote',
        srcChainId,
        dstChainId,
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
  getTokenPrice: (chainId, tokenAddress, currency) => deFiTools.getTokenPrice(chainId, tokenAddress, currency),
  getBatchTokenPrices: (tokens) => deFiTools.getBatchTokenPrices(tokens),
  getTokenMetadata: (chainId, tokenAddress) => deFiTools.getTokenMetadata(chainId, tokenAddress),
  getTokenList: (chainId) => deFiTools.getTokenList(chainId),
  getWalletBalances: (chainId, walletAddress) => deFiTools.getWalletBalances(chainId, walletAddress),
  getTransactionHistory: (chainId, walletAddress, options) => deFiTools.getTransactionHistory(chainId, walletAddress, options),
  getProtocolInfo: (chainId) => deFiTools.getProtocolInfo(chainId),
  calculateOptimalGas: (chainId, priority) => deFiTools.calculateOptimalGas(chainId, priority),
  getWalletAnalysis: (chainId, walletAddress) => deFiTools.getWalletAnalysis(chainId, walletAddress),
  getNetworkStats: (chainId) => deFiTools.getNetworkStats(chainId),
  submitFusionIntentOrder: (chainId, orderData) => deFiTools.submitFusionIntentOrder(chainId, orderData),
  getFusionIntentQuote: (quoteParams) => deFiTools.getFusionIntentQuote(quoteParams),
  getClassicSwapQuote: (swapParams) => deFiTools.getClassicSwapQuote(swapParams),
  getTokenAllowance: (allowanceParams) => deFiTools.getTokenAllowance(allowanceParams),
  getApprovalTransaction: (approvalParams) => deFiTools.getApprovalTransaction(approvalParams),
  getSwapTransaction: (swapParams) => deFiTools.getSwapTransaction(swapParams),
  executeClassicSwap: (swapData) => deFiTools.executeClassicSwap(swapData),
  getClassicSwapAnalysis: (swapParams) => deFiTools.getClassicSwapAnalysis(swapParams),
  validateConfiguration: () => deFiTools.validateConfiguration()
}; 