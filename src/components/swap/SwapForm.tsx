import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { NETWORKS } from '@/lib/constants/networks';
import { getFromTokens, getToTokens } from '@/lib/swap/tokenHelpers';
import { SwapMode, TokenInfo } from '@/types/swap';

interface SwapFormProps {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  swapMode: SwapMode;
  quoteLoading: boolean;
  isConnected: boolean;
  formattedBalance: string;
  isBalanceLoading: boolean;
  hasSufficientBalance: boolean;
  sdkInitialized: boolean;
  onFromChainChange: (chainId: string) => void;
  onToChainChange: (chainId: string) => void;
  onFromTokenChange: (token: string) => void;
  onToTokenChange: (token: string) => void;
  onFromAmountChange: (amount: string) => void;
  onFlipTokens: () => void;
  onRefreshQuote: () => void;
  onRefreshBalance: () => void;
  onSwapModeChange: (mode: SwapMode) => void;
}

export const SwapForm: React.FC<SwapFormProps> = ({
  fromChain,
  toChain,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  swapMode,
  quoteLoading,
  isConnected,
  formattedBalance,
  isBalanceLoading,
  hasSufficientBalance,
  sdkInitialized,
  onFromChainChange,
  onToChainChange,
  onFromTokenChange,
  onToTokenChange,
  onFromAmountChange,
  onFlipTokens,
  onRefreshQuote,
  onRefreshBalance,
  onSwapModeChange
}) => {
  const fromTokens = getFromTokens(fromChain);
  const toTokens = getToTokens(toChain);

  return (
    <div className="space-y-6">
      {/* Swap Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={swapMode === 'fusion' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSwapModeChange('fusion')}
            className="h-7 px-3 text-xs"
          >
            🔄 Fusion Intent
          </Button>
          <Button
            variant={swapMode === 'classic' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSwapModeChange('classic')}
            className="h-7 px-3 text-xs"
          >
            ⚡ Classic Swap
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefreshQuote}
          className="h-8 w-8 p-0 hover:bg-primary/20"
        >
          <RefreshCw className={`h-4 w-4 ${quoteLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Swap Mode Indicator */}
      {swapMode === 'classic' && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">⚡</span>
            <span className="text-sm font-medium text-blue-800">Classic Swap Mode</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Single-chain swap. Both tokens must be on the same network.
          </p>
        </div>
      )}

      {/* From Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">From</Label>
        <div className="grid grid-cols-2 gap-4">
          <Select value={fromChain} onValueChange={onFromChainChange}>
            <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
              {Object.entries(NETWORKS).map(([key, network]) => (
                <SelectItem key={network.id} value={network.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{network.logo}</span>
                    <span>{network.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fromToken} onValueChange={onFromTokenChange}>
            <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
              {fromTokens.map((token: TokenInfo) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{token.logo}</span>
                    <span>{token.symbol}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="number"
          placeholder="0.0"
          value={fromAmount}
          onChange={(e) => onFromAmountChange(e.target.value)}
          className="text-2xl h-14 bg-background/50 border-border/50 hover:border-primary/50 focus:border-primary transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          {isBalanceLoading ? (
            <div className="text-sm text-muted-foreground">
              <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
              Loading balance...
            </div>
          ) : isConnected ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Balance:</span> {formattedBalance} {fromToken}
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
            Insufficient balance. You need {fromAmount} {fromToken} but have {formattedBalance} {fromToken}.
          </div>
        )}
      </div>

      {/* Flip Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onFlipTokens}
          className="h-10 w-10 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* To Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">To</Label>
        <div className="grid grid-cols-2 gap-4">
          <Select value={toChain} onValueChange={onToChainChange}>
            <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
              {Object.entries(NETWORKS).map(([key, network]) => (
                <SelectItem key={network.id} value={network.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{network.logo}</span>
                    <span>{network.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toToken} onValueChange={onToTokenChange}>
            <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
              {toTokens.map((token: TokenInfo) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{token.logo}</span>
                    <span>{token.symbol}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className="text-2xl h-14 bg-background/30 border-border/50"
          />
          {quoteLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        {/* Quote Status */}
        {quoteLoading && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
            Getting quote automatically...
          </div>
        )}
      </div>
    </div>
  );
};