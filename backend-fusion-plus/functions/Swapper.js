const { SDK, HashLock, NetworkEnum } = require("@1inch/cross-chain-sdk");
const { Web3 } = require('web3');
const { solidityPackedKeccak256, randomBytes } = require('ethers');
const env = require('dotenv');
const process = env.config().parsed;

// Network configurations with RPC URLs
const NETWORKS = {
  ethereum: {
    id: NetworkEnum.ETHEREUM,
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    chainId: 1
  },
  arbitrum: {
    id: NetworkEnum.ARBITRUM,
    name: 'Arbitrum',
    rpc: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161
  },
  base: {
    id: NetworkEnum.COINBASE,
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    chainId: 8453
  },
  polygon: {
    id: NetworkEnum.POLYGON,
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    chainId: 137
  },
  bsc: {
    id: NetworkEnum.BSC,
    name: 'BSC',
    rpc: 'https://bsc-dataseed1.binance.org',
    chainId: 56
  },
  avalanche: {
    id: NetworkEnum.AVALANCHE,
    name: 'Avalanche',
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114
  },
  optimism: {
    id: NetworkEnum.OPTIMISM,
    name: 'Optimism',
    rpc: 'https://mainnet.optimism.io',
    chainId: 10
  },
  fantom: {
    id: NetworkEnum.FANTOM,
    name: 'Fantom',
    rpc: 'https://rpc.ftm.tools',
    chainId: 250
  }
};

// Token addresses for each network
const TOKENS = {
  ethereum: {
    USDC: '0xA0b86a33E6441C6C36D8E5B33F0E1D2BB8C5E3E6',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    ETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    WETH: '0x4200000000000000000000000000000000000006',
    ETH: '0x4200000000000000000000000000000000000006',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  },
  polygon: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    MATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  bsc: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0a6c8c8c8c8',
    BNB: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0a6c8c8c8c8',
    DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3'
  },
  avalanche: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    AVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
  },
  optimism: {
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    WETH: '0x4200000000000000000000000000000000000006',
    OP: '0x4200000000000000000000000000000000000006',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  fantom: {
    USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    USDT: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
    WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    FTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    DAI: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'
  }
};

// Minimal blockchain provider for API calls only (no signing)
class ReadOnlyProvider {
  constructor(rpcUrl) {
    this.web3 = new Web3(rpcUrl);
  }

  eth = {
    call: async (transactionConfig) => {
      return await this.web3.eth.call(transactionConfig);
    }
  };

  extend() {
    // No-op for compatibility
  }
}

class CrossChainSwapper {
  constructor() {
    this.devPortalApiKey = process?.DEV_PORTAL_KEY;
    
    if (!this.devPortalApiKey) {
      throw new Error("Missing required environment variable: DEV_PORTAL_KEY - Get your API key from https://portal.1inch.dev/");
    }

    console.log(`🔧 Setting up TRUE DeFi swapper`);
    console.log(`🔧 Server uses DEV_PORTAL_KEY for API access ONLY`);
    console.log(`🔧 ALL signing done by user in their wallet`);
    console.log(`🔧 NO private keys on server`);
  }

  // Get quote using only DEV_PORTAL_KEY - no signing required
  async getQuote(fromNetwork, toNetwork, fromToken, toToken, amount, userAddress) {
    console.log(`🔍 Getting quote for TRUE DeFi swap...`);
    console.log(`👤 User: ${userAddress}`);
    console.log(`💰 Amount: ${amount} ${fromToken}`);
    console.log(`📤 From: ${fromNetwork} → 📥 To: ${toNetwork}`);

    // Convert amount to wei
    const weiAmount = this.convertHumanAmountToWei(amount, fromToken);

    // Get token addresses
    const srcTokenAddress = TOKENS[fromNetwork][fromToken];
    const dstTokenAddress = TOKENS[toNetwork][toToken];
    
    if (!srcTokenAddress || !dstTokenAddress) {
      throw new Error(`Token not supported for this network pair`);
    }

    // Prepare quote parameters
    const params = {
      srcChainId: NETWORKS[fromNetwork].id,
      dstChainId: NETWORKS[toNetwork].id,
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: weiAmount,
      enableEstimate: true,
      walletAddress: userAddress
    };

    console.log(`📋 Quote Parameters:`, this.safeStringify(params));

    try {
      // Make direct API call to 1inch for quote (no SDK needed for quotes)
      const response = await fetch('https://api.1inch.dev/fusion-plus/quoter/v1.0/quote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.devPortalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Quote API failed: ${response.status} ${response.statusText}`);
      }

      const quote = await response.json();
      console.log(`✅ Quote received from 1inch API`);
      console.log(`📊 Quote:`, this.safeStringify(quote));

      return quote;
    } catch (error) {
      console.error(`❌ Error getting quote: ${error.message}`);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  // Process user's signed order data
  async processUserSignedOrder(userSignedData) {
    console.log(`📝 Processing user's signed order data...`);
    console.log(`👤 User signed everything in their wallet`);
    console.log(`🔧 Server submitting to 1inch API using DEV_PORTAL_KEY only`);

    try {
      // Submit the user's signed order to 1inch API
      const response = await fetch('https://api.1inch.dev/fusion-plus/relayer/v1.0/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.devPortalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userSignedData)
      });

      if (!response.ok) {
        throw new Error(`Submit API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ User's signed order submitted successfully!`);
      console.log(`🆔 Result:`, this.safeStringify(result));

      return result;
    } catch (error) {
      console.error(`❌ Error submitting user's signed order: ${error.message}`);
      throw new Error(`Failed to submit order: ${error.message}`);
    }
  }

  // Convert human-readable amount to proper decimal format
  convertHumanAmountToWei(amount, tokenSymbol) {
    const tokenDecimals = {
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
      'WETH': 18,
      'WBTC': 8,
      'ETH': 18,
      'MATIC': 18,
      'BNB': 18,
      'AVAX': 18,
      'OP': 18,
      'FTM': 18
    };

    const decimals = tokenDecimals[tokenSymbol] || 18;
    const multiplier = Math.pow(10, decimals);
    const weiAmount = Math.floor(parseFloat(amount) * multiplier);
    
    console.log(`🔄 Converting ${amount} ${tokenSymbol} to ${weiAmount} wei (${decimals} decimals)`);
    return weiAmount.toString();
  }

  // Safe JSON serialization that handles BigInt
  safeStringify(obj, space = 2) {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, space);
  }

  // Get supported networks
  getSupportedNetworks() {
    return Object.keys(NETWORKS);
  }

  // Get supported tokens for a network
  getSupportedTokens(networkName) {
    return Object.keys(TOKENS[networkName] || {});
  }
}

// ABI for token operations - Removed since users handle all approvals in their wallets

// CLI interface
async function main() {
  // Get arguments from global scope or process.argv
  let args = [];
  if (typeof process !== 'undefined' && process.argv) {
    args = process.argv.slice(2);
  } else if (typeof global !== 'undefined' && global.process && global.process.argv) {
    args = global.process.argv.slice(2);
  } else {
    // Try to get from require.main
    try {
      const mainModule = require.main;
      if (mainModule && mainModule.argv) {
        args = mainModule.argv.slice(2);
      }
    } catch (e) {
      console.log('🔍 Debug: Could not get arguments from main module');
    }
  }
  
  // Debug logging
  console.log('🔍 Debug: process =', typeof process);
  console.log('🔍 Debug: global.process =', typeof global !== 'undefined' ? typeof global.process : 'undefined');
  console.log('🔍 Debug: args =', args);
  console.log('🔍 Debug: args.length =', args.length);
  
  if (args.length === 0) {
    console.log(`
🚀 DeFi Cross-Chain Swapper CLI

Usage:
  node Swapper.js test-setup <userAddress>
  node Swapper.js swap <userAddress> <fromNetwork> <toNetwork> <fromToken> <toToken> <amount>

Examples:
  node Swapper.js test-setup 0x1234567890123456789012345678901234567890
  node Swapper.js swap 0x1234... arbitrum base USDC USDC 100

Note: 
  - Users must approve tokens in their own wallet (MetaMask, etc.)
  - Server only uses DEV_PORTAL_KEY for API access
  - This is a true DeFi architecture where users control their tokens

Supported Networks: ${Object.keys(NETWORKS).join(', ')}
    `);
    return;
  }

  const command = args[0];
  const userAddress = args[1]; // Get user address for the command
  
  if (!userAddress) {
    console.error('❌ User wallet address is required');
    return;
  }
  
  const swapper = new CrossChainSwapper();

  try {
    switch (command) {
      case 'test-setup':
        await swapper.testSetup();
        break;
        
      case 'swap':
        const fromNetwork = args[2];
        const toNetwork = args[3];
        const fromToken = args[4];
        const toToken = args[5];
        const amount = args[6];
        
        if (!fromNetwork || !toNetwork || !fromToken || !toToken || !amount) {
          console.error('❌ Missing parameters for swap command');
          console.error('Usage: node Swapper.js swap <userAddress> <fromNetwork> <toNetwork> <fromToken> <toToken> <amount>');
          return;
        }
        
        console.log(`🔄 Starting DeFi cross-chain swap...`);
        console.log(`📤 From: ${fromNetwork} ${fromToken}`);
        console.log(`📥 To: ${toNetwork} ${toToken}`);
        console.log(`💰 Amount: ${amount}`);
        console.log(`👤 User: ${userAddress}`);
        console.log(`🔧 User must have already approved tokens in their wallet`);
        
        const result = await swapper.executeCrossChainSwapForUser(fromNetwork, toNetwork, fromToken, toToken, amount, userAddress);
        console.log(`🎉 DeFi swap initiated successfully!`);
        console.log(`🆔 Order Hash: ${result.orderHash}`);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack trace: ${error.stack}`);
    // Don't use process.exit in this context, let the error bubble up
    throw error;
  }
}

// Export for use as module
module.exports = { CrossChainSwapper, NETWORKS, TOKENS };

// Run CLI if called directly
if (require.main === module) {
  main();
}
