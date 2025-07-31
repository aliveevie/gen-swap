import { ethers } from 'ethers';
import { SDK, HashLock } from '@1inch/cross-chain-sdk';

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
  private sdk: SDK | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(private apiKey: string) {}

  // Initialize with user's wallet
  async initialize(walletProvider: any) {
    try {
      this.provider = new ethers.BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();
      
      // Initialize 1inch SDK with user's wallet
      this.sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: this.apiKey,
        blockchainProvider: {
          // Use the user's wallet as the blockchain provider
          async sendTransaction(transaction: any) {
            return await this.signer!.sendTransaction(transaction);
          },
          async signMessage(message: string) {
            return await this.signer!.signMessage(message);
          },
          async getAddress() {
            return await this.signer!.getAddress();
          }
        }
      });

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

  // Execute the swap using user's wallet
  async executeSwap(swapParams: any) {
    if (!this.sdk || !this.signer) {
      throw new Error('SDK not initialized. Please connect wallet first.');
    }

    try {
      const {
        quote,
        hashLock,
        secretHashes,
        secrets,
        srcTokenAddress,
        dstTokenAddress,
        weiAmount,
        walletAddress
      } = swapParams;

      console.log('🚀 Executing swap with user wallet...');

      // Check if approval is needed
      const oneInchSpender = '0x111111125421ca6dc452d289314280a0f8842a65'; // 1inch spender address
      const currentAllowance = await this.checkAllowance(srcTokenAddress, oneInchSpender);
      const requiredAmount = BigInt(weiAmount);

      if (currentAllowance < requiredAmount) {
        console.log('🔐 Approval needed. Requesting user approval...');
        
        // Request user approval
        const approvalTx = await this.approveToken(
          srcTokenAddress,
          oneInchSpender,
          ethers.MaxUint256 // Unlimited allowance
        );
        
        console.log(`✅ Approval transaction: ${approvalTx}`);
      }

      // Place the order using user's wallet
      const orderParams = {
        walletAddress,
        hashLock,
        secretHashes,
        permit: null,
        signature: null
      };

      console.log('📝 Placing order with user wallet...');
      
      const orderResponse = await this.sdk.placeOrder(quote, orderParams);
      
      if (!orderResponse || !orderResponse.orderHash) {
        throw new Error('Failed to place order');
      }

      console.log(`✅ Order placed successfully: ${orderResponse.orderHash}`);
      
      return {
        orderHash: orderResponse.orderHash,
        orderResponse,
        status: 'pending'
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