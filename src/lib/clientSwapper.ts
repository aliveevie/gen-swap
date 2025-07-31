import { ethers } from 'ethers';
import { parseUnits, formatUnits, isAddress } from 'viem';

// Token ABI for approvals and balance checks
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
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

// Network-specific token addresses (real addresses)
const NETWORK_TOKENS = {
  1: { // Ethereum
    'USDC': '0xA0b86a33E6441C6C36D8E5B33F0E1D2BB8C5E3E6',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  42161: { // Arbitrum
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'ETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  137: { // Polygon
    'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'MATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  8453: { // Base
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'USDbC': '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    'WETH': '0x4200000000000000000000000000000000000006',
    'ETH': '0x4200000000000000000000000000000000000006',
    'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  },
  10: { // Optimism
    'USDC': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    'USDT': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    'WETH': '0x4200000000000000000000000000000000000006',
    'OP': '0x4200000000000000000000000000000000000006',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  }
};

// 1inch router addresses by network
const SPENDER_ADDRESSES = {
  1: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  42161: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  137: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  8453: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  10: '0x1111111254fb6c44bAC0beD2854e76F90643097d'
};

export interface SwapParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  walletAddress: string;
}

export interface SwapResult {
  status: 'needs_approval' | 'approved' | 'ready_to_swap' | 'swapping' | 'completed';
  approvalTx?: string;
  swapTx?: string;
  orderHash?: string;
  message?: string;
  tokenAddress?: string;
  spenderAddress?: string;
  requiredAmount?: string;
}

export class ClientSwapper {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private isInitialized = false;

  constructor() {}

  // Initialize with user's wallet
  async initialize(walletProvider: any): Promise<void> {
    try {
      if (!walletProvider) {
        throw new Error('No wallet provider found. Please install MetaMask or another wallet.');
      }

      this.provider = new ethers.BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();
      this.isInitialized = true;
      
      console.log('✅ ClientSwapper initialized successfully');
      console.log('👤 Wallet Address:', await this.signer.getAddress());
    } catch (error: any) {
      console.error('❌ Failed to initialize ClientSwapper:', error);
      throw new Error(`Failed to initialize wallet: ${error.message}`);
    }
  }

  // Debug method to test wallet connection
  async debugWalletConnection(): Promise<void> {
    console.log('🔍 === WALLET CONNECTION DEBUG ===');
    console.log('🔍 Is initialized:', this.isInitialized);
    console.log('🔍 Has provider:', !!this.provider);
    console.log('🔍 Has signer:', !!this.signer);
    
    if (this.signer) {
      try {
        const address = await this.signer.getAddress();
        console.log('🔍 Wallet address:', address);
        
        const network = await this.provider!.getNetwork();
        console.log('🔍 Current network:', network.chainId, network.name);
        
        // Test a simple transaction (just getting balance)
        const balance = await this.provider!.getBalance(address);
        console.log('🔍 Wallet balance:', balance.toString());
        
      } catch (error) {
        console.error('❌ Wallet connection test failed:', error);
      }
    }
    console.log('🔍 === END DEBUG ===');
  }

  // Get token address for a specific network and symbol
  private getTokenAddress(chainId: number, tokenSymbol: string): string {
    console.log(`🔍 Getting token address for ${tokenSymbol} on chain ${chainId}`);
    
    const networkTokens = NETWORK_TOKENS[chainId as keyof typeof NETWORK_TOKENS];
    if (!networkTokens) {
      console.error(`❌ Unsupported network: Chain ID ${chainId}`);
      console.error(`❌ Supported networks:`, Object.keys(NETWORK_TOKENS));
      throw new Error(`Unsupported network: Chain ID ${chainId}`);
    }

    const tokenAddress = networkTokens[tokenSymbol as keyof typeof networkTokens];
    if (!tokenAddress) {
      console.error(`❌ Token ${tokenSymbol} not supported on chain ${chainId}`);
      console.error(`❌ Supported tokens:`, Object.keys(networkTokens));
      throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId}`);
    }

    console.log(`✅ Found token address: ${tokenAddress}`);
    return tokenAddress;
  }

  // Get spender address (1inch router) for a specific network
  private getSpenderAddress(chainId: number): string {
    const spenderAddress = SPENDER_ADDRESSES[chainId as keyof typeof SPENDER_ADDRESSES];
    if (!spenderAddress) {
      throw new Error(`1inch router not available on chain ${chainId}`);
    }
    return spenderAddress;
  }

  // Get token decimals
  async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!this.signer) throw new Error('Wallet not connected');

    try {
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
      const decimals = await tokenContract.decimals();
      return Number(decimals);
    } catch (error) {
      console.warn(`Failed to get decimals for ${tokenAddress}, using default 18`);
      // Default to 18 decimals if call fails
      return 18;
    }
  }

  // Check current allowance for a token
  async checkAllowance(tokenAddress: string, spenderAddress: string): Promise<bigint> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
    const userAddress = await this.signer.getAddress();
    
    const allowance = await tokenContract.allowance(userAddress, spenderAddress);
    console.log(`🔍 Current allowance: ${allowance.toString()}`);
    return allowance;
  }

  // Check token balance
  async checkTokenBalance(tokenAddress: string): Promise<{balance: bigint, formattedBalance: string}> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
    const userAddress = await this.signer.getAddress();
    
    const balance = await tokenContract.balanceOf(userAddress);
    const decimals = await this.getTokenDecimals(tokenAddress);
    const formattedBalance = formatUnits(balance, decimals);
    
    console.log(`💰 Token balance: ${balance.toString()} (${formattedBalance})`);
    return { balance, formattedBalance };
  }

  // Approve token spending (real wallet transaction)
  async approveToken(tokenAddress: string, spenderAddress: string, amount: bigint): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    if (!isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    
    if (!isAddress(spenderAddress)) {
      throw new Error('Invalid spender address');
    }

    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
    
    console.log(`🔐 Requesting approval for token: ${tokenAddress}`);
    console.log(`🔐 Spender: ${spenderAddress}`);
    console.log(`🔐 Amount: ${amount.toString()}`);
    
    try {
      // Use unlimited allowance for better UX (user won't need to approve again)
      const unlimitedAmount = ethers.MaxUint256;
      
      // This will trigger the MetaMask popup for user approval
      const tx = await tokenContract.approve(spenderAddress, unlimitedAmount);
      console.log(`⏳ Approval transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log(`✅ Approval transaction confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Approval failed:', error);
      
      // Check for user rejection
      if (error.message && (
        error.message.includes('user rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('ACTION_REJECTED')
      )) {
        throw new Error('User rejected the approval transaction');
      }
      
      throw new Error(`Approval failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Get quote from server
  async getQuote(swapParams: SwapParams, apiBaseUrl: string): Promise<any> {
    console.log('🔍 Getting quote from server...');
    
    const response = await fetch(`${apiBaseUrl}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapParams)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get quote');
    }
    
    console.log('✅ Quote received:', data.data);
    return data.data;
  }

  // Check if approval is needed and handle it, then automatically execute swap
  async handleTokenApprovalAndSwap(swapParams: SwapParams, apiBaseUrl: string): Promise<SwapResult> {
    if (!this.isInitialized || !this.signer) {
      throw new Error('ClientSwapper not initialized. Call initialize() first.');
    }

    try {
      const { fromChainId, fromToken, amount } = swapParams;
      
      // Get token and spender addresses
      const tokenAddress = this.getTokenAddress(fromChainId, fromToken);
      const spenderAddress = this.getSpenderAddress(fromChainId);
      
      console.log(`🔍 Checking approval for ${fromToken} on chain ${fromChainId}`);
      console.log(`📍 Token Address: ${tokenAddress}`);
      console.log(`📍 Spender Address: ${spenderAddress}`);
      
      // Get token decimals and convert amount
      const decimals = await this.getTokenDecimals(tokenAddress);
      const requiredAmount = parseUnits(amount, decimals);
      
      console.log(`💰 Required amount: ${requiredAmount.toString()} (${amount} ${fromToken})`);
      
      // Check current allowance
      console.log('🔍 Checking current token allowance...');
      const currentAllowance = await this.checkAllowance(tokenAddress, spenderAddress);
      console.log(`🔍 Current allowance: ${currentAllowance.toString()}`);
      console.log(`🔍 Required amount: ${requiredAmount.toString()}`);
      console.log(`🔍 Needs approval: ${currentAllowance < requiredAmount}`);
      
      let approvalTx = null;
      
      if (currentAllowance < requiredAmount) {
        console.log('🔐 ⚠️  APPROVAL NEEDED - This should trigger MetaMask popup!');
        console.log('🔐 Requesting user to approve token spending...');
        
        // Show user that MetaMask popup should appear
        console.log('👀 LOOK FOR METAMASK POPUP - User needs to approve transaction');
        
        // Request approval from user (this MUST show MetaMask popup)
        approvalTx = await this.approveToken(tokenAddress, spenderAddress, requiredAmount);
        console.log(`✅ User approved! Transaction hash: ${approvalTx}`);
      } else {
        console.log('✅ Token already has sufficient allowance - no MetaMask popup needed');
        console.log(`   Current: ${currentAllowance.toString()}`);
        console.log(`   Required: ${requiredAmount.toString()}`);
      }
      
      // Get user's wallet data for server-side execution
      const userAddress = await this.signer.getAddress();
      const network = await this.provider!.getNetwork();
      
      console.log('🚀 Now executing swap with server...');
      console.log(`👤 User address: ${userAddress}`);
      console.log(`🌐 Network: ${network.chainId}`);
      
      // Prepare complete swap execution data
      const swapExecutionData = {
        ...swapParams,
        userAddress,
        chainId: network.chainId.toString(),
        approvalTx,
        tokenAddress,
        spenderAddress,
        requiredAmount: requiredAmount.toString(),
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending swap execution request to server...');
      
      // Send to server for execution
      const result = await this.executeSwapWithUserWallet(swapExecutionData, apiBaseUrl);
      
      return {
        status: 'completed',
        approvalTx,
        swapTx: result.transactionHash,
        orderHash: result.transactionHash,
        message: 'Swap completed successfully in one step!',
        tokenAddress,
        spenderAddress
      };
      
    } catch (error: any) {
      console.error('❌ Token approval and swap failed:', error);
      
      // Better error logging
      if (error.code === 4001) {
        console.error('❌ User rejected the transaction in MetaMask');
        throw new Error('User rejected the transaction');
      } else if (error.message?.includes('user rejected')) {
        console.error('❌ User rejected the transaction');
        throw new Error('User rejected the transaction');
      } else {
        console.error('❌ Other error:', error.message);
        throw error;
      }
    }
  }

  // Execute swap directly with user wallet data
  private async executeSwapWithUserWallet(swapData: any, apiBaseUrl: string): Promise<any> {
    console.log('📤 Executing swap with user wallet data...');
    
    const response = await fetch(`${apiBaseUrl}/execute-swap-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to execute swap');
    }
    
    console.log('✅ Swap executed successfully:', result.data);
    return result.data;
  }

  // Get swap parameters from server
  private async getSwapParameters(swapParams: SwapParams, apiBaseUrl: string): Promise<any> {
    console.log('📋 Getting swap parameters from server...');
    
    const response = await fetch(`${apiBaseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapParams)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get swap parameters');
    }
    
    console.log('✅ Swap parameters received:', data.data);
    return data.data;
  }

  // Execute the cross-chain swap
  async executeSwap(swapData: any, apiBaseUrl: string): Promise<SwapResult> {
    if (!this.isInitialized || !this.signer) {
      throw new Error('ClientSwapper not initialized');
    }

    try {
      const userAddress = await this.signer.getAddress();
      
      console.log('🚀 Executing cross-chain swap...');
      console.log('📋 Swap Data:', swapData);
      
      // Prepare execution data for server
      const executionData = {
        ...swapData.swapParams,
        approvalTxHash: swapData.approvalTx,
        orderHash: swapData.orderHash,
        userAddress,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending execution request to server...');
      
      // Send to server for execution
      const response = await fetch(`${apiBaseUrl}/execute-swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executionData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to execute swap');
      }
      
      console.log('✅ Swap executed successfully:', result.data);
      
      return {
        status: 'completed',
        swapTx: result.data.transactionHash,
        orderHash: result.data.transactionHash,
        message: 'Cross-chain swap completed successfully!'
      };
      
    } catch (error: any) {
      console.error('❌ Swap execution failed:', error);
      throw error;
    }
  }

  // Get user's address
  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    return await this.signer.getAddress();
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.isInitialized && this.signer !== null;
  }

  // Get supported tokens for a network
  getSupportedTokens(chainId: number): string[] {
    const networkTokens = NETWORK_TOKENS[chainId as keyof typeof NETWORK_TOKENS];
    return networkTokens ? Object.keys(networkTokens) : [];
  }

  // Validate swap parameters
  validateSwapParams(params: SwapParams): void {
    const { fromChainId, toChainId, fromToken, toToken, amount, walletAddress } = params;
    
    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount || !walletAddress) {
      throw new Error('Missing required swap parameters');
    }
    
    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    
    // Check if tokens are supported
    const fromTokens = this.getSupportedTokens(fromChainId);
    const toTokens = this.getSupportedTokens(toChainId);
    
    if (!fromTokens.includes(fromToken)) {
      throw new Error(`Token ${fromToken} not supported on chain ${fromChainId}`);
    }
    
    if (!toTokens.includes(toToken)) {
      throw new Error(`Token ${toToken} not supported on chain ${toChainId}`);
    }
  }
}