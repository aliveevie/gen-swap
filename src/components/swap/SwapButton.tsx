import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { SwapMode } from '@/types/swap';

interface SwapButtonProps {
  swapMode: SwapMode;
  isConnected: boolean;
  fromAmount: string;
  toAmount: string;
  orderLoading: boolean;
  classicSwapLoading: boolean;
  hasSufficientBalance: boolean;
  sdkInitialized: boolean;
  classicQuote: any;
  fromToken: string;
  toToken: string;
  onClick: () => void;
}

export const SwapButton: React.FC<SwapButtonProps> = ({
  swapMode,
  isConnected,
  fromAmount,
  toAmount,
  orderLoading,
  classicSwapLoading,
  hasSufficientBalance,
  sdkInitialized,
  classicQuote,
  fromToken,
  toToken,
  onClick
}) => {
  const isLoading = orderLoading || classicSwapLoading;
  const isDisabled = !isConnected || 
    !fromAmount || 
    !toAmount || 
    isLoading || 
    !hasSufficientBalance || 
    (swapMode === 'fusion' && !sdkInitialized);

  const getButtonText = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {swapMode === 'fusion' ? 'Creating Order...' : 'Processing...'}
        </>
      );
    }
    
    if (!isConnected) {
      return "Connect Wallet to Swap";
    }
    
    if (!fromAmount) {
      return "Enter Amount to Get Quote";
    }
    
    if (!toAmount) {
      return "Getting Quote...";
    }
    
    if (!hasSufficientBalance) {
      return (
        <>
          <AlertTriangle className="mr-2 h-5 w-5" />
          Insufficient Balance
        </>
      );
    }
    
    if (swapMode === 'fusion' && !sdkInitialized) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting SDK...
        </>
      );
    }
    
    if (classicQuote) {
      return `Execute ${swapMode === 'fusion' ? 'Fusion Intent' : 'Classic'} Swap: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`;
    }
    
    return `Get ${swapMode === 'fusion' ? 'Fusion Intent' : 'Classic'} Quote: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`;
  };

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:shadow-none"
    >
      {getButtonText()}
    </Button>
  );
};