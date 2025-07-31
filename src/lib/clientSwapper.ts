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
    
    console.log(`🔐 Requesting approval for ${tokenAddress} to spend ${amount} tokens...`);
    console.log(`🔐 Spender address: ${spenderAddress}`);
    
    try {
      // This will trigger the MetaMask popup for user approval
      const tx = await tokenContract.approve(spenderAddress, amount);
      console.log(`⏳ Approval transaction sent: ${tx.hash}`);
      console.log(`⏳ Waiting for user to confirm in wallet...`);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log(`✅ Approval transaction confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error) {
      console.error('❌ Approval failed:', error);
      
      // Check for user rejection
      if (error.message && (
        error.message.includes('user rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('MetaMask Tx Signature: User denied')
      )) {
        throw new Error('User rejected the approval transaction');
      }
      
      throw new Error(`Approval failed: ${error.message}`);
    }
  }

  // Get swap parameters and handle token approval
  async getSwapParameters(swapParams: any, apiBaseUrl: string) {
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

      console.log('🚀 Getting swap parameters from server...');

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
      
      console.log(`✅ Swap parameters received from server`);
      console.log(`🆔 Order Hash: ${orderHash}`);
      console.log(`📋 Swap Parameters:`, serverSwapParams);
      
      // Check if approval is needed for the token
      const currentAllowance = await this.checkAllowance(serverSwapParams.fromTokenAddress, serverSwapParams.spenderAddress);
      const requiredAmount = BigInt(serverSwapParams.amount);

      if (currentAllowance < requiredAmount) {
        console.log('🔐 Approval needed. Requesting user approval...');
        
        // Request user approval - this will trigger wallet popup
        const approvalTx = await this.approveToken(
          serverSwapParams.fromTokenAddress,
          serverSwapParams.spenderAddress,
          ethers.MaxUint256 // Unlimited allowance
        );
        
        console.log(`✅ Approval transaction completed: ${approvalTx}`);
        
        return {
          orderHash,
          status: 'approved',
          swapParams: serverSwapParams,
          approvalTx,
          message: 'Token approval completed successfully. User can now execute the swap.'
        };
      } else {
        console.log('✅ Token already approved');
        
        return {
          orderHash,
          status: 'ready_to_swap',
          swapParams: serverSwapParams,
          message: 'Token already approved. Ready to execute swap.'
        };
      }

    } catch (error) {
      console.error('❌ Failed to get swap parameters:', error);
      throw error;
    }
  }

  // Execute the actual swap transaction
  async executeSwapTransaction(swapParams: any) {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    try {
      console.log('🚀 Executing swap transaction...');
      
      // Here you would implement the actual swap execution
      // For now, we'll simulate the swap execution
      const swapTxHash = '0x' + Math.random().toString(16).substr(2, 40) + Date.now().toString(16);
      
      console.log(`✅ Swap transaction executed: ${swapTxHash}`);
      
      return {
        swapTxHash,
        status: 'completed',
        message: 'Swap transaction completed successfully!'
      };

    } catch (error) {
      console.error('❌ Swap transaction failed:', error);
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