const { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } = require("@1inch/cross-chain-sdk");
const { Web3 } = require('web3');
const { solidityPackedKeccak256, randomBytes, Contract, Wallet, JsonRpcProvider } = require('ethers');
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
    USDC: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Use WETH for ETH swaps (API requirement)
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    ETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Use WETH for ETH swaps (API requirement)
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    WETH: '0x4200000000000000000000000000000000000006',
    ETH: '0x4200000000000000000000000000000000000006', // Use WETH for ETH swaps (API requirement)
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  },
  polygon: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    MATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // Use WMATIC for MATIC swaps
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  bsc: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0a6c8c8c8c8',
    BNB: '0xbb4CdB9CBd36B01bD1cBaEF2aF378a0a6c8c8c8c8', // Use WBNB for BNB swaps
    DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3'
  },
  avalanche: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    AVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // Use WAVAX for AVAX swaps
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
  },
  optimism: {
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    WETH: '0x4200000000000000000000000000000000000006',
    OP: '0x4200000000000000000000000000000000000006', // Use WETH for OP swaps (OP uses WETH)
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  fantom: {
    USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    USDT: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
    WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    FTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // Use WFTM for FTM swaps
    DAI: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'
  }
};

// ABI for token operations
const TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class CrossChainSwapper {
  constructor() {
    this.makerPrivateKey = process?.WALLET_KEY;
    this.makerAddress = process?.WALLET_ADDRESS;
    this.devPortalApiKey = process?.DEV_PORTAL_KEY;

    if (!this.makerPrivateKey || !this.makerAddress || !this.devPortalApiKey) {
      throw new Error("Missing required environment variables: WALLET_KEY, WALLET_ADDRESS, DEV_PORTAL_KEY");
    }

    this.sdk = null;
    this.web3Instances = {};
  }

  // Initialize SDK for a specific network
  async initializeSDK(networkName) {
    const network = NETWORKS[networkName];
    if (!network) {
      throw new Error(`Unsupported network: ${networkName}`);
    }

    console.log(`🔧 Initializing SDK for ${network.name}...`);
    
    const web3Instance = new Web3(network.rpc);
    this.web3Instances[networkName] = web3Instance;
    
    const blockchainProvider = new PrivateKeyProviderConnector(this.makerPrivateKey, web3Instance);
    
    this.sdk = new SDK({
      url: 'https://api.1inch.dev/fusion-plus',
      authKey: this.devPortalApiKey,
      blockchainProvider
    });

    console.log(`✅ SDK initialized for ${network.name}`);
    return this.sdk;
  }

  // Check wallet balance on a specific network
  async checkBalance(networkName, tokenSymbol = 'USDC') {
    const network = NETWORKS[networkName];
    const web3Instance = this.web3Instances[networkName];
    
    if (!web3Instance) {
      throw new Error(`Web3 instance not initialized for ${networkName}`);
    }

    console.log(`🔍 Checking ${tokenSymbol} balance on ${network.name}...`);
    
    // Check native token balance
    const nativeBalance = await web3Instance.eth.getBalance(this.makerAddress);
    console.log(`💰 ${network.name} Native Balance:`, web3Instance.utils.fromWei(nativeBalance, 'ether'));
    
    // Handle native tokens (ETH, MATIC, BNB, etc.)
    const nativeTokens = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];
    if (nativeTokens.includes(tokenSymbol)) {
      console.log(`💵 ${tokenSymbol} Balance: ${nativeBalance} wei`);
      console.log(`💵 ${tokenSymbol} Balance: ${web3Instance.utils.fromWei(nativeBalance, 'ether')} ${tokenSymbol}`);
      return { nativeBalance, tokenBalance: nativeBalance, formattedBalance: web3Instance.utils.fromWei(nativeBalance, 'ether') };
    }
    
    // Check ERC-20 token balance
    const tokenAddress = TOKENS[networkName][tokenSymbol];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not supported on ${networkName}`);
    }

    try {
      const tokenContract = new web3Instance.eth.Contract(TOKEN_ABI, tokenAddress);
      const tokenBalance = await tokenContract.methods.balanceOf(this.makerAddress).call();
      
      // Get token decimals
      const decimals = tokenSymbol === 'USDC' || tokenSymbol === 'USDT' ? 6 : 18;
      const formattedBalance = Number(tokenBalance) / Math.pow(10, decimals);
      
      console.log(`💵 ${tokenSymbol} Balance: ${tokenBalance} wei`);
      console.log(`💵 ${tokenSymbol} Balance: ${formattedBalance.toFixed(6)} ${tokenSymbol}`);
      
      return { nativeBalance, tokenBalance, formattedBalance };
    } catch (error) {
      console.error(`❌ Error checking ${tokenSymbol} balance: ${error.message}`);
      throw new Error(`Failed to check ${tokenSymbol} balance: ${error.message}`);
    }
  }

  // Approve token spending
  async approveToken(networkName, tokenSymbol, spenderAddress) {
    const network = NETWORKS[networkName];
    
    // Handle native tokens (ETH, MATIC, BNB, etc.) - need to approve wrapped version
    const nativeTokens = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];
    if (nativeTokens.includes(tokenSymbol)) {
      console.log(`🔐 Native ${tokenSymbol} detected - approving wrapped token spending`);
      
      // Get the wrapped token address (WETH, WMATIC, etc.)
      const wrappedTokenSymbol = `W${tokenSymbol}`;
      const tokenAddress = TOKENS[networkName][wrappedTokenSymbol];
      
      if (!tokenAddress) {
        throw new Error(`Wrapped token address not found for ${wrappedTokenSymbol} on ${networkName}`);
      }
      
      console.log(`🔐 Approving ${wrappedTokenSymbol} on ${network.name}...`);
      
      const provider = new JsonRpcProvider(network.rpc);
      const tokenContract = new Contract(tokenAddress, TOKEN_ABI, new Wallet(this.makerPrivateKey, provider));
      
      const approvalTx = await tokenContract.approve(
        spenderAddress,
        (2n**256n - 1n) // unlimited allowance
      );
      
      console.log(`⏳ Waiting for approval transaction...`);
      await approvalTx.wait();
      console.log(`✅ ${wrappedTokenSymbol} approval successful on ${network.name}`);
      
      return approvalTx.hash;
    }
    
    // Handle regular ERC-20 tokens
    console.log(`🔐 Approving ${tokenSymbol} on ${network.name}...`);
    
    const tokenAddress = TOKENS[networkName][tokenSymbol];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not supported on ${networkName}`);
    }
    
    const provider = new JsonRpcProvider(network.rpc);
    const tokenContract = new Contract(tokenAddress, TOKEN_ABI, new Wallet(this.makerPrivateKey, provider));
    
    const approvalTx = await tokenContract.approve(
      spenderAddress,
      (2n**256n - 1n) // unlimited allowance
    );
    
    console.log(`⏳ Waiting for approval transaction...`);
    await approvalTx.wait();
    console.log(`✅ ${tokenSymbol} approval successful on ${network.name}`);
    
    return approvalTx.hash;
  }

  // Generate random bytes for hash lock
  getRandomBytes32() {
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
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

  // Execute cross-chain swap
  async executeCrossChainSwap(fromNetwork, toNetwork, fromToken, toToken, humanAmount) {
    console.log(`🚀 Starting cross-chain swap...`);
    console.log(`📤 From: ${NETWORKS[fromNetwork].name} (${fromToken})`);
    console.log(`📥 To: ${NETWORKS[toNetwork].name} (${toToken})`);
    console.log(`💰 Human Amount: ${humanAmount} ${fromToken}`);
    console.log(`📍 Wallet: ${this.makerAddress}`);
    console.log('---');

    // Convert human amount to wei
    const weiAmount = this.convertHumanAmountToWei(humanAmount, fromToken);
    console.log(`💰 Wei Amount: ${weiAmount}`);

    // Initialize SDK for source network
    await this.initializeSDK(fromNetwork);
    
    // Check balances
    await this.checkBalance(fromNetwork, fromToken);
    
    // Get token addresses
    const srcTokenAddress = TOKENS[fromNetwork][fromToken];
    const dstTokenAddress = TOKENS[toNetwork][toToken];
    
    if (!srcTokenAddress || !dstTokenAddress) {
      throw new Error(`Token not supported for this network pair`);
    }

    // Handle native token wrapping if needed
    const nativeTokens = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];
    if (nativeTokens.includes(fromToken)) {
      console.log(`🔧 Native ${fromToken} detected - checking WETH balance`);
      
      // For native tokens, we need to check WETH balance since 1inch API uses WETH addresses
      const wethAddress = TOKENS[fromNetwork][fromToken];
      const wethContract = new this.web3Instances[fromNetwork].eth.Contract([
        {
          "constant": true,
          "inputs": [{"name": "_owner", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "balance", "type": "uint256"}],
          "type": "function"
        }
      ], wethAddress);
      
      const wethBalance = await wethContract.methods.balanceOf(this.makerAddress).call();
      const requiredAmount = BigInt(weiAmount);
      const currentWethBalance = BigInt(wethBalance);
      
      if (currentWethBalance < requiredAmount) {
        console.log(`⚠️  Insufficient WETH balance. Need ${weiAmount} wei, have ${wethBalance} wei`);
        console.log(`💡 You need to wrap ${fromToken} to W${fromToken} first using the wrap-eth.js script`);
        throw new Error(`Insufficient WETH balance. Required: ${weiAmount} wei, Available: ${wethBalance} wei. Please wrap ETH to WETH first.`);
      }
      console.log(`✅ Sufficient WETH balance confirmed: ${wethBalance} wei`);
      
      // For native tokens, we still need to approve WETH spending
      console.log(`🔐 Approving WETH spending for 1inch contract...`);
      await this.approveToken(fromNetwork, fromToken, '0x111111125421ca6dc452d289314280a0f8842a65');
    } else {
      // Approve ERC-20 token spending
      await this.approveToken(fromNetwork, fromToken, '0x111111125421ca6dc452d289314280a0f8842a65');
    }

    // Prepare swap parameters
    const params = {
      srcChainId: NETWORKS[fromNetwork].id,
      dstChainId: NETWORKS[toNetwork].id,
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: weiAmount,
      enableEstimate: true,
      walletAddress: this.makerAddress
    };

    console.log(`📋 Swap Parameters:`, this.safeStringify(params));

    // Get quote
    console.log(`🔍 Getting quote from 1inch Fusion+...`);
    let quote;
    try {
      quote = await this.sdk.getQuote(params);
      console.log(`✅ Quote received successfully`);
      console.log(`📊 Quote Details:`, this.safeStringify(quote));
      
      // Validate quote
      if (!quote) {
        throw new Error('No quote received from 1inch API');
      }
      
      // Check if quote has required properties
      if (!quote.getPreset) {
        throw new Error('Invalid quote format received from 1inch API');
      }
    } catch (error) {
      console.error(`❌ Error getting quote: ${error.message}`);
      throw new Error(`Failed to get quote: ${error.message}`);
    }

    // Generate secrets for hash lock
    const secretsCount = quote.getPreset().secretsCount;
    console.log(`🔐 Generating ${secretsCount} secrets for hash lock...`);
    
    const secrets = Array.from({ length: secretsCount }).map(() => this.getRandomBytes32());
    const secretHashes = secrets.map(x => HashLock.hashSecret(x));
    
    console.log(`🔑 Secrets generated:`, secrets);
    console.log(`🔒 Secret hashes:`, secretHashes);

    // Create hash lock
    const hashLock = secretsCount === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(
          secretHashes.map((secretHash, i) =>
            solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
          )
        );

    console.log(`🔐 Hash lock created:`, hashLock);

    // Place order
    console.log(`📝 Placing cross-chain order...`);
    try {
      // Add more detailed order parameters
      const orderParams = {
        walletAddress: this.makerAddress,
        hashLock,
        secretHashes,
        // Add additional parameters that might be required
        permit: null, // No permit for native tokens
        signature: null // Will be generated by SDK
      };

      console.log(`📋 Order Parameters:`, this.safeStringify(orderParams));
      
      const orderResponse = await this.sdk.placeOrder(quote, orderParams);

      // Validate order response
      if (!orderResponse || !orderResponse.orderHash) {
        throw new Error('Invalid order response received from 1inch API');
      }

      const orderHash = orderResponse.orderHash;
      console.log(`✅ Order placed successfully!`);
      console.log(`🆔 Order Hash: ${orderHash}`);
      console.log(`📊 Order Response:`, this.safeStringify(orderResponse));
      
      return { orderHash, orderResponse };
    } catch (error) {
      console.error(`❌ Error placing order: ${error.message}`);
      console.error(`❌ Full error:`, this.safeStringify(error));
      
      // Try to get more details about the error
      if (error.response) {
        console.error(`❌ Response status: ${error.response.status}`);
        console.error(`❌ Response data:`, this.safeStringify(error.response.data));
      }
      
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  // Get supported networks
  getSupportedNetworks() {
    return Object.keys(NETWORKS);
  }

  // Get supported tokens for a network
  getSupportedTokens(networkName) {
    return Object.keys(TOKENS[networkName] || {});
  }

  // Test function to verify setup
  async testSetup() {
    console.log(`🧪 Testing setup...`);
    console.log(`📍 Wallet Address: ${this.makerAddress}`);
    console.log(`🔑 API Key: ${this.devPortalApiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`🌐 Supported Networks:`, this.getSupportedNetworks());
    
    for (const network of this.getSupportedNetworks()) {
      console.log(`📋 ${network.toUpperCase()} Tokens:`, this.getSupportedTokens(network));
    }
    
    console.log(`✅ Setup test completed`);
  }
}

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
🚀 Cross-Chain Swapper CLI

Usage:
  node Swapper.js test-setup
  node Swapper.js check-balance <network> [token]
  node Swapper.js swap <fromNetwork> <toNetwork> <fromToken> <toToken> <amount>

Examples:
  node Swapper.js test-setup
  node Swapper.js check-balance arbitrum USDC
  node Swapper.js swap arbitrum base USDC USDC 1000000
  node Swapper.js swap ethereum polygon WETH USDC 1000000000000000000

Supported Networks: ${Object.keys(NETWORKS).join(', ')}
    `);
    return;
  }

  const command = args[0];
  const swapper = new CrossChainSwapper();

  try {
    switch (command) {
      case 'test-setup':
        await swapper.testSetup();
        break;
        
      case 'check-balance':
        const network = args[1];
        const token = args[2] || 'USDC';
        if (!network) {
          console.error('❌ Network parameter required for check-balance');
          return;
        }
        await swapper.initializeSDK(network);
        await swapper.checkBalance(network, token);
        break;
        
      case 'swap':
        const fromNetwork = args[1];
        const toNetwork = args[2];
        const fromToken = args[3];
        const toToken = args[4];
        const amount = args[5];
        
        if (!fromNetwork || !toNetwork || !fromToken || !toToken || !amount) {
          console.error('❌ Missing parameters for swap command');
          console.error('Usage: node Swapper.js swap <fromNetwork> <toNetwork> <fromToken> <toToken> <amount>');
          return;
        }
        
        console.log(`🔄 Starting cross-chain swap...`);
        console.log(`📤 From: ${fromNetwork} ${fromToken}`);
        console.log(`📥 To: ${toNetwork} ${toToken}`);
        console.log(`💰 Amount: ${amount}`);
        
        const result = await swapper.executeCrossChainSwap(fromNetwork, toNetwork, fromToken, toToken, amount);
        console.log(`🎉 Swap initiated successfully!`);
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
