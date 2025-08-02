import { useState, useEffect } from 'react';
import { SwapState, SwapMode } from '@/types/swap';

const initialState: SwapState = {
  fromChain: "1", // Ethereum default
  toChain: "137", // Polygon default
  fromToken: "USDC",
  toToken: "USDC",
  fromAmount: "",
  toAmount: "",
  swapMode: 'fusion',
  isLoading: false,
  quoteLoading: false,
  orderLoading: false,
  approvalLoading: false,
  submissionLoading: false,
  isProcessing: false,
  isApproved: false,
  sdkInitialized: false,
  sdkLoading: false,
  currentQuote: null,
  orderData: null,
  orderStatus: null,
  statusLoading: false,
  swapCompleted: false,
  showOrderModal: false,
  showConfirmModal: false,
  txHash: ""
};

export const useSwapState = () => {
  const [state, setState] = useState<SwapState>(initialState);

  const updateState = (updates: Partial<SwapState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetSwapState = () => {
    setState(prev => ({
      ...prev,
      fromAmount: '',
      toAmount: '',
      orderData: null,
      orderStatus: null,
      currentQuote: null,
      isApproved: false,
      isProcessing: false,
      swapCompleted: false,
      showOrderModal: false,
      showConfirmModal: false,
      txHash: ''
    }));
  };

  const handleFlipTokens = () => {
    setState(prev => ({
      ...prev,
      fromChain: prev.toChain,
      toChain: prev.fromChain,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      isApproved: false
    }));
  };

  const setSwapMode = (mode: SwapMode) => {
    setState(prev => ({
      ...prev,
      swapMode: mode,
      // For classic swap, set both chains to the same
      ...(mode === 'classic' && { toChain: prev.fromChain })
    }));
  };

  // Reset approval state when amount changes
  useEffect(() => {
    if (state.fromAmount && state.isApproved) {
      setState(prev => ({ ...prev, isApproved: false }));
    }
  }, [state.fromAmount, state.isApproved]);

  return {
    ...state,
    updateState,
    resetSwapState,
    handleFlipTokens,
    setSwapMode
  };
};