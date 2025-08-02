import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWriteContract } from 'wagmi';
import { ClassicSwapState, ClassicSwapData } from '@/types/swap';
import { API_BASE_URL } from '@/lib/constants/networks';
import { getTokenAddress, convertToWei } from '@/lib/swap/tokenHelpers';
import { getCurrentChain } from '@/lib/swap/chainHelpers';

interface UseClassicSwapProps {
  fromChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  address: string | undefined;
  isConnected: boolean;
}

export const useClassicSwap = ({
  fromChain,
  fromToken,
  toToken,
  fromAmount,
  address,
  isConnected
}: UseClassicSwapProps) => {
  const [state, setState] = useState<ClassicSwapState>({
    classicSwapLoading: false,
    classicQuote: null,
    classicAnalysis: null,
    classicApprovalTx: null,
    classicSwapTx: null,
    classicExecutionResult: null
  });

  const { toast } = useToast();
  const { writeContract } = useWriteContract();

  const updateState = (updates: Partial<ClassicSwapState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const getClassicSwapQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and connect wallet first",
        variant: "destructive"
      });
      return;
    }

    updateState({ classicSwapLoading: true });
    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      if (!srcTokenAddress || !dstTokenAddress) {
        throw new Error("Token addresses not found for selected network");
      }

      if (srcTokenAddress === dstTokenAddress) {
        throw new Error("Cannot swap the same token. Please select different tokens for classic swap.");
      }

      const weiAmount = convertToWei(fromAmount, fromToken);
      if (weiAmount === '0') {
        throw new Error("Amount is too small to get a quote");
      }

      const quoteParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: weiAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      const response = await fetch(`${API_BASE_URL}/classic-swap/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        updateState({ classicQuote: data.data });
        
        toast({
          title: "Classic Swap Quote",
          description: `Quote received successfully`,
        });
        
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get classic swap quote');
      }
    } catch (error: any) {
      console.error('❌ Classic swap quote failed:', error);
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get classic swap quote. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      updateState({ classicSwapLoading: false });
    }
  };

  const getClassicSwapAnalysis = async () => {
    if (!state.classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      const analysisParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: state.classicQuote.fromTokenAmount || fromAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      const response = await fetch(`${API_BASE_URL}/classic-swap/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        updateState({ classicAnalysis: data.data });
        
        toast({
          title: "Analysis Complete",
          description: "Classic swap analysis ready",
        });
        
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get classic swap analysis');
      }
    } catch (error: any) {
      console.error('❌ Classic swap analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to get classic swap analysis",
        variant: "destructive"
      });
    }
  };

  const getClassicApprovalTransaction = async () => {
    if (!state.classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      
      const approvalParams = {
        tokenAddress: srcTokenAddress,
        amount: state.classicQuote.fromTokenAmount || fromAmount,
        chainId: parseInt(fromChain)
      };

      const response = await fetch(`${API_BASE_URL}/classic-swap/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        updateState({ classicApprovalTx: data.data });
        
        toast({
          title: "Approval Ready",
          description: "Approval transaction prepared for signing",
        });
        
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get approval transaction');
      }
    } catch (error: any) {
      console.error('❌ Classic approval transaction failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to get approval transaction",
        variant: "destructive"
      });
    }
  };

  const getClassicSwapTransaction = async () => {
    if (!state.classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      const swapParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: state.classicQuote.fromTokenAmount || fromAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      const response = await fetch(`${API_BASE_URL}/classic-swap/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        updateState({ classicSwapTx: data.data });
        
        toast({
          title: "Swap Ready",
          description: "Swap transaction prepared for signing",
        });
        
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get swap transaction');
      }
    } catch (error: any) {
      console.error('❌ Classic swap transaction failed:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to get swap transaction",
        variant: "destructive"
      });
    }
  };

  const handleClassicApproval = async () => {
    if (!state.classicApprovalTx) {
      toast({
        title: "Error",
        description: "No approval transaction available",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await writeContract({
        address: state.classicApprovalTx.to as `0x${string}`,
        abi: [{
          name: 'approve',
          type: 'function',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable'
        }],
        functionName: 'approve',
        args: [
          state.classicApprovalTx.data.slice(10, 50) as `0x${string}`, 
          BigInt(state.classicApprovalTx.data.slice(50))
        ],
        account: address,
        chain: getCurrentChain(fromChain)
      });

      toast({
        title: "Approval Sent",
        description: "Approval transaction submitted successfully",
      });

      // Get swap transaction after approval
      await getClassicSwapTransaction();
      
    } catch (error: any) {
      console.error('❌ Classic approval failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve tokens",
        variant: "destructive"
      });
    }
  };

  const handleClassicSwap = async () => {
    if (!state.classicSwapTx) {
      toast({
        title: "Error",
        description: "No swap transaction available",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await writeContract({
        address: state.classicSwapTx.to as `0x${string}`,
        abi: [{
          name: 'swap',
          type: 'function',
          inputs: [],
          outputs: [],
          stateMutability: 'payable'
        }],
        functionName: 'swap',
        args: [],
        value: BigInt(state.classicSwapTx.value || '0'),
        account: address,
        chain: getCurrentChain(fromChain)
      });

      toast({
        title: "Swap Transaction Sent",
        description: "Your swap transaction has been submitted to the network.",
      });
      
    } catch (error: any) {
      console.error('❌ Classic swap failed:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap",
        variant: "destructive"
      });
    }
  };

  const resetClassicSwapState = () => {
    setState({
      classicSwapLoading: false,
      classicQuote: null,
      classicAnalysis: null,
      classicApprovalTx: null,
      classicSwapTx: null,
      classicExecutionResult: null
    });
  };

  return {
    ...state,
    updateState,
    getClassicSwapQuote,
    getClassicSwapAnalysis,
    getClassicApprovalTransaction,
    getClassicSwapTransaction,
    handleClassicApproval,
    handleClassicSwap,
    resetClassicSwapState
  };
};