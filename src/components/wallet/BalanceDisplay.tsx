import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface BalanceDisplayProps {
  isConnected: boolean;
  isBalanceLoading: boolean;
  formattedBalance: string;
  tokenSymbol: string;
  fromAmount: string;
  hasSufficientBalance: boolean;
  onRefreshBalance: () => void;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  isConnected,
  isBalanceLoading,
  formattedBalance,
  tokenSymbol,
  fromAmount,
  hasSufficientBalance,
  onRefreshBalance
}) => {
  return (
    <>
      <div className="flex items-center justify-between mt-2">
        {isBalanceLoading ? (
          <div className="text-sm text-muted-foreground">
            <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
            Loading balance...
          </div>
        ) : isConnected ? (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Balance:</span> {formattedBalance} {tokenSymbol}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Balance:</span> Connect wallet to see balance
          </div>
        )}
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshBalance}
            className="h-6 px-2 hover:bg-primary/20"
            disabled={isBalanceLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isBalanceLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
      
      {!isConnected && (
        <div className="text-sm text-muted-foreground mt-2">
          <AlertTriangle className="inline mr-2 h-4 w-4 text-warning" />
          Please connect your wallet to see balance.
        </div>
      )}
      
      {isConnected && !isBalanceLoading && !hasSufficientBalance && fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="text-sm text-destructive mt-2">
          <AlertTriangle className="inline mr-2 h-4 w-4" />
          Insufficient balance. You need {fromAmount} {tokenSymbol} but have {formattedBalance} {tokenSymbol}.
        </div>
      )}
    </>
  );
};