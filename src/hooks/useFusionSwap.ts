import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePublicClient, useWriteContract } from 'wagmi';
import { FusionSwapState, QuoteData } from '@/types/swap';
import { API_BASE_URL, INCH_SPENDER_ADDRESS } from '@/lib/constants/networks';
import { getTokenAddress, getTokenDecimals, convertToWei } from '@/lib/swap/tokenHelpers';
import { getRpcUrl } from '@/lib/swap/chainHelpers';

interface UseFusionSwapProps {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  address: string | undefined;
  isConnected: boolean;
}

export const useFusionSwap = ({
  fromChain,
  toChain,
  fromToken,
  toToken,
  fromAmount,
  address,
  isConnected
}: UseFusionSwapProps) => {
  const [state, setState] = useState<FusionSwapState>({
    currentQuote: null,
    orderData: null,
    orderStatus: null,
    statusLoading: false,
    approvalLoading: false,
    submissionLoading: false,
    isProcessing: false,
    isApproved: false
  });

  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: parseInt(fromChain) });
  const { writeContract } = useWriteContract();

  const updateState = (updates: Partial<FusionSwapState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
      return null;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(toChain, toToken);
      
      if (!srcTokenAddress || !dstTokenAddress) {
        throw new Error('Token addresses not found');
      }

      const weiAmount = convertToWei(fromAmount, fromToken);
      if (weiAmount === '0') {
        throw new Error('Amount is too small to get a quote');
      }

      const quoteParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: weiAmount,
        walletAddress: address,
        approve: false
      };

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteParams)
      });

      const data = await response.json();

      if (data.success && data.data.quote && data.data.quote.quoteReferenceId) {
        updateState({ currentQuote: data.data.quote });
        return data.data.quote;
      } else {
        throw new Error(data.error || 'Failed to get quote');
      }
    } catch (error: any) {
      console.error('Failed to get quote:', error);
      throw error;
    }
  };

  const approveTokens = async () => {
    // Set loading state immediately to make button inactive
    updateState({ approvalLoading: true, isProcessing: true });
    
    console.log('🚀 APPROVE TOKENS FUNCTION CALLED');
    console.log('📋 Current state:', {
      hasOrderData: !!state.orderData,
      hasCurrentQuote: !!state.currentQuote,
      isConnected,
      address,
      fromChain,
      fromToken,
      fromAmount,
      orderData: state.orderData,
      currentQuote: state.currentQuote
    });

    // Only check essential wallet connection - removed orderData and currentQuote checks
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const tokenAddress = getTokenAddress(fromChain, fromToken);
      const weiAmount = convertToWei(fromAmount, fromToken);

      if (!tokenAddress) {
        throw new Error(`Token address not found for ${fromToken} on chain ${fromChain}`);
      }

      const approvalParams = {
        tokenAddress: tokenAddress,
        spenderAddress: INCH_SPENDER_ADDRESS,
        amount: weiAmount,
        walletAddress: address,
        chainId: parseInt(fromChain)
      };

      console.log('📡 Sending approval request with params:', approvalParams);

      const response = await fetch(`${API_BASE_URL}/prepare-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalParams)
      });

      const data = await response.json();
      console.log('📡 Approval response:', data);

      if (data.success) {
        const approvalTx = data.data.approvalTransaction;
        
        const spenderAddress = '0x' + approvalTx.data.slice(34, 74);
        const amount = BigInt('0x' + approvalTx.data.slice(74));
        
        console.log('🔐 About to call writeContract - this should trigger wallet popup...');
        console.log('🔐 Approval params:', {
          tokenAddress: approvalTx.to,
          spenderAddress,
          amount: amount.toString(),
          userAddress: address
        });

        toast({
          title: "Wallet Action Required",
          description: "Please check your wallet to approve the transaction.",
        });

        // Check if wallet provider is available
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('No wallet provider found. Please make sure your wallet is connected.');
        }

        // Check if user is on the correct chain
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const expectedChainId = parseInt(fromChain);
        
        if (parseInt(currentChainId, 16) !== expectedChainId) {
          toast({
            title: "Wrong Network",
            description: `Please switch to the correct network in your wallet.`,
            variant: "destructive"
          });
          throw new Error(`Please switch to chain ${expectedChainId} in your wallet`);
        }

        // Use writeContract which will trigger wallet popup
        try {
          const txHash = await writeContract({
            address: approvalTx.to as `0x${string}`,
            abi: [{
              "constant": false,
              "inputs": [
                { "name": "spender", "type": "address" },
                { "name": "amount", "type": "uint256" }
              ],
              "name": "approve",
              "outputs": [{ "name": "", "type": "bool" }],
              "type": "function"
            }] as const,
            functionName: 'approve',
            args: [spenderAddress as `0x${string}`, amount]
          });

          console.log('✅ Approval transaction submitted with hash:', txHash);
        } catch (writeContractError: any) {
          console.error('❌ writeContract failed:', writeContractError);
          
          // Fallback: Try direct wallet call
          console.log('🔄 Trying direct wallet call as fallback...');
          
          const txParams = {
            from: address,
            to: approvalTx.to,
            data: approvalTx.data,
            gas: approvalTx.gas || '0x15f90', // Default gas limit
            gasPrice: approvalTx.gasPrice || '0x9184e72a000' // Default gas price
          };
          
          console.log('📡 Direct wallet call params:', txParams);
          
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams]
          });
          
          console.log('✅ Direct wallet call successful with hash:', txHash);
        }

        // Wait for transaction confirmation
        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!confirmed && attempts < maxAttempts) {
          try {
            const allowance = await publicClient.readContract({
              address: approvalTx.to as `0x${string}`,
              abi: [{
                "constant": true,
                "inputs": [
                  { "name": "_owner", "type": "address" },
                  { "name": "_spender", "type": "address" }
                ],
                "name": "allowance",
                "outputs": [{ "name": "", "type": "uint256" }],
                "type": "function"
              }] as const,
              functionName: 'allowance',
              args: [address as `0x${string}`, spenderAddress as `0x${string}`]
            });
            
            if (BigInt(allowance as string) >= amount) {
              confirmed = true;
              break;
            }
          } catch (error) {
            console.log('⚠️ Error checking allowance:', error);
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!confirmed) {
          throw new Error('Transaction confirmation timeout');
        }
        
        updateState({ isApproved: true });
        
        toast({
          title: "✅ Tokens Approved!",
          description: "Token approval confirmed. Now signing order data...",
        });

        // Request EIP-712 signature
        await requestEIP712Signature('confirmed_approval');

      } else {
        throw new Error(data.error || 'Failed to prepare approval');
      }
    } catch (error: any) {
      console.error('❌ Token approval failed:', error);
      updateState({ isProcessing: false });
      
      // Handle specific wallet errors
      if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        toast({
          title: "Transaction Rejected",
          description: "You rejected the transaction in your wallet.",
          variant: "destructive"
        });
      } else if (error.message?.includes('No wallet provider')) {
        toast({
          title: "Wallet Not Found",
          description: "Please make sure your wallet extension is installed and connected.",
          variant: "destructive"
        });
      } else if (error.message?.includes('chain')) {
        toast({
          title: "Wrong Network",
          description: "Please switch to the correct network in your wallet.",
          variant: "destructive"
        });
      } else {
        console.error('❌ Full error details:', error);
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve tokens. Please try again.",
          variant: "destructive"
        });
      }
      throw error;
    } finally {
      updateState({ approvalLoading: false });
    }
  };

  const requestEIP712Signature = async (approvalTxResult: any) => {
    if (!state.currentQuote || !address) {
      throw new Error('Missing required data for EIP-712 signing');
    }

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet provider available');
      }

      const domain = {
        name: '1inch Aggregation Router',
        version: '6',
        chainId: parseInt(fromChain),
        verifyingContract: INCH_SPENDER_ADDRESS
      };

      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Order: [
          { name: 'salt', type: 'uint256' },
          { name: 'maker', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'makerAsset', type: 'address' },
          { name: 'takerAsset', type: 'address' },
          { name: 'makingAmount', type: 'uint256' },
          { name: 'takingAmount', type: 'uint256' },
          { name: 'makerTraits', type: 'uint256' }
        ]
      };

      const exactValues = state.currentQuote?.exactValues;
      if (!exactValues) {
        throw new Error('No exact values found in quote object');
      }

      const message = {
        salt: exactValues.salt,
        maker: address,
        receiver: '0x0000000000000000000000000000000000000000',
        makerAsset: getTokenAddress(fromChain, fromToken),
        takerAsset: exactValues.dstTokenAddress,
        makingAmount: convertToWei(fromAmount, fromToken),
        takingAmount: exactValues.dstTokenAmount,
        makerTraits: exactValues.makerTraits
      };

      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify({ domain, types, primaryType: 'Order', message })]
      });

      toast({
        title: "✅ Order Signed!",
        description: "Order data signed successfully. Submitting to backend...",
      });

      await processApprovedSwap(approvalTxResult, signature);

    } catch (error: any) {
      console.error('❌ EIP-712 signing failed:', error);
      throw error;
    }
  };

  const processApprovedSwap = async (approvalTxResult: any, eip712Signature?: string) => {
    if (!state.currentQuote || !address) {
      throw new Error('Missing required data for swap processing');
    }

    if (!state.currentQuote.quoteReferenceId) {
      throw new Error('Quote object missing reference ID');
    }

    updateState({ submissionLoading: true, isProcessing: true });

    try {
      const userRpcUrl = getRpcUrl(fromChain);

      const swapParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: getTokenAddress(fromChain, fromToken),
        dstTokenAddress: getTokenAddress(toChain, toToken),
        amount: convertToWei(fromAmount, fromToken),
        walletAddress: address,
        approve: true,
        approvalTxHash: approvalTxResult,
        eip712Signature: eip712Signature,
        userRpcUrl: userRpcUrl,
        quote: {
          quoteReferenceId: state.currentQuote.quoteReferenceId
        }
      };

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapParams)
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          orderData: {
            ...state.orderData,
            status: 'swap_in_progress',
            approvalTxHash: approvalTxResult,
            swapResult: data.data.submitOrderResult
          }
        });

        toast({
          title: "🔄 Swap in Progress",
          description: "Your cross-chain swap is being processed. This may take a few minutes.",
        });

        // Simulate completion after 3 seconds
        setTimeout(() => {
          updateState({
            orderData: null,
            orderStatus: null,
            currentQuote: null,
            isApproved: false,
            isProcessing: false
          });
          
          toast({
            title: "🎉 Swap Completed!",
            description: "Your cross-chain swap has been executed successfully!",
          });
        }, 3000);

      } else {
        console.error('❌ Backend processing failed:', data.error);
      }
    } catch (error: any) {
      console.error('❌ Approved swap processing failed:', error);
      throw error;
    } finally {
      updateState({ submissionLoading: false });
    }
  };

  const checkOrderStatus = async (orderHash: string) => {
    if (!orderHash) return;
    
    updateState({ statusLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/order-status/${orderHash}`);
      const data = await response.json();
      
      if (data.success) {
        updateState({ orderStatus: data.data });
        toast({
          title: "Order Status Updated",
          description: "Order status has been refreshed",
        });
      } else {
        throw new Error(data.error || 'Failed to get order status');
      }
    } catch (error: any) {
      console.error('❌ Order status check failed:', error);
      toast({
        title: "Status Check Failed",
        description: error.message || "Failed to check order status",
        variant: "destructive"
      });
    } finally {
      updateState({ statusLoading: false });
    }
  };

  return {
    ...state,
    updateState,
    getQuote,
    approveTokens,
    checkOrderStatus
  };
};