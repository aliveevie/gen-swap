import { ethers } from 'ethers';

// Token ABI for approvals
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

export class ClientSwapper {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor() {}

  // Initialize with user's wallet
  async initialize(walletProvider: any) {
    try {
      this.provider = new ethers.BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();
      
      console.log('✅ Client swapper initialized with user wallet');
    } catch (error) {
      console.error('❌ Failed to initialize client swapper:', error);
      throw error;
    }
  }

  // Check if user has approved token spending
  async checkAllowance(tokenAddress: string, spenderAddress: string): Promise<bigint> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
    const userAddress = await this.signer.getAddress();
    
    return await tokenContract.allowance(userAddress, spenderAddress);
  }

  // Approve token spending (user will sign this transaction)
  async approveToken(tokenAddress: string, spenderAddress: string, amount: bigint) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
    
    console.log(`🔐 Approving ${tokenAddress} for ${spenderAddress}...`);
    
    const tx = await tokenContract.approve(spenderAddress, amount);
    console.log(`⏳ Waiting for approval transaction: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Approval successful: ${receipt.hash}`);
    
    return receipt.hash;
  }

  // Execute the swap using server API
  async executeSwap(swapParams: any, apiBaseUrl: string) {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    try {
      const {
        fromChainId,
        toChainId,
        fromToken,
        toToken,
        amount,
        walletAddress
      } = swapParams;

      console.log('🚀 Executing swap via server API...');

      // Get swap parameters from server
      const response = await fetch(`${apiBaseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromChainId,
          toChainId,
          fromToken,
          toToken,
          amount,
          walletAddress
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get swap parameters from server');
      }

      const { swapParams: serverSwapParams, orderHash } = data.data;
      
      // Check if approval is needed for the token
      const oneInchSpender = '0x111111125421ca6dc452d289314280a0f8842a65'; // 1inch spender address
      const currentAllowance = await this.checkAllowance(serverSwapParams.fromTokenAddress, oneInchSpender);
      const requiredAmount = BigInt(serverSwapParams.amount);

      if (currentAllowance < requiredAmount) {
        console.log('🔐 Approval needed. Requesting user approval...');
        
        // Request user approval
        const approvalTx = await this.approveToken(
          serverSwapParams.fromTokenAddress,
          oneInchSpender,
          ethers.MaxUint256 // Unlimited allowance
        );
        
        console.log(`✅ Approval transaction: ${approvalTx}`);
      }

      console.log(`✅ Swap parameters received from server`);
      console.log(`🆔 Order Hash: ${orderHash}`);
      console.log(`📋 Swap Parameters:`, serverSwapParams);
      
      return {
        orderHash,
        status: 'pending',
        swapParams: serverSwapParams,
        message: 'Swap parameters generated successfully. User approval completed.'
      };

    } catch (error) {
      console.error('❌ Swap execution failed:', error);
      throw error;
    }
  }

  // Get user's balance for a token
  async getBalance(tokenAddress: string): Promise<bigint> {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const userAddress = await this.signer.getAddress();
    
    if (tokenAddress === ethers.ZeroAddress) {
      // Native token balance
      return await this.provider!.getBalance(userAddress);
    } else {
      // ERC-20 token balance
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
      return await tokenContract.balanceOf(userAddress);
    }
  }

  // Get user's address
  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    return await this.signer.getAddress();
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.signer !== null;
  }
}

// Helper function to get wallet provider
export async function getWalletProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  
  // Check for other wallet providers
  if (typeof window !== 'undefined' && (window as any).walletConnect) {
    return (window as any).walletConnect;
  }
  
  throw new Error('No wallet provider found. Please install MetaMask or another wallet.');
}

// Helper function to connect wallet
export async function connectWallet() {
  const provider = await getWalletProvider();
  
  // Request account access
  await provider.request({ method: 'eth_requestAccounts' });
  
  return provider;
} 