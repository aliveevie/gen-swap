import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import WalletConnector from "./WalletConnector";
import WalletSDKConnector from "./WalletSDKConnector";

// Import custom hooks
import { useSwapState } from '@/hooks/useSwapState';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useFusionSwap } from '@/hooks/useFusionSwap';
import { useClassicSwap } from '@/hooks/useClassicSwap';

// Import components
import { SwapForm } from './swap/SwapForm';
import { SwapButton } from './swap/SwapButton';
import { SwapModals } from './swap/SwapModals';
import { ClassicSwapStatus } from './swap/ClassicSwapStatus';
import { SwapHistory } from './swap/SwapHistory';
import { WalletStatus } from './wallet/WalletStatus';
import { AIChatInterface } from './chat/AIChatInterface';

// Import helpers
import { convertToWei, getTokenAddress, convertFromWei } from '@/lib/swap/tokenHelpers';
import { getCurrentChain, getRpcUrl } from '@/lib/swap/chainHelpers';
import { API_BASE_URL, INCH_SPENDER_ADDRESS } from '@/lib/constants/networks';

// Import types
import { ChatSwapResult } from '@/types/chat';

const SwapInterface = () => {
  const {
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    swapMode,
    isLoading,
    quoteLoading,
    orderLoading,
    approvalLoading,
    submissionLoading,
    isProcessing,
    isApproved,
    sdkInitialized,
    sdkLoading,
    currentQuote,
    orderData,
    orderStatus,
    statusLoading,
    swapCompleted,
    showOrderModal,
    showConfirmModal,
    txHash,
    updateState,
    resetSwapState,
    handleFlipTokens,
    setSwapMode
  } = useSwapState();

  const { toast } = useToast();

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Custom hooks
  const {
    getCurrentBalance,
    hasSufficientBalance,
    isBalanceLoading,
    getFormattedBalance,
    refetchBalance
  } = useTokenBalance({ address, fromChain, fromToken });

  const fusionSwap = useFusionSwap({
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    address,
    isConnected
  });

  const classicSwap = useClassicSwap({
    fromChain,
    fromToken,
    toToken,
    fromAmount,
    address,
    isConnected
  });

  // Initialize SDK when wallet connects
  const initializeSDK = async () => {
    if (!isConnected || !address) return;
    
    updateState({ sdkLoading: true });
    try {
      console.log('🔧 Initializing 1inch SDK with user wallet...');
      
      const response = await fetch(`${API_BASE_URL}/test-sdk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          web3Provider: { chainId: parseInt(fromChain), address: address },
          nodeUrl: 'user_wallet_provider'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ SDK initialized successfully with user wallet');
        updateState({ sdkInitialized: true });
        toast({
          title: "SDK Connected",
          description: "1inch SDK initialized with your wallet",
        });
      } else {
        throw new Error(data.error || 'Failed to initialize SDK');
      }
      
    } catch (error: any) {
      console.error('❌ SDK initialization failed:', error);
      updateState({ sdkInitialized: false });
      toast({
        title: "SDK Connection Failed",
        description: error.message || "Failed to connect 1inch SDK",
        variant: "destructive"
      });
    } finally {
      updateState({ sdkLoading: false });
    }
  };

  // Handle wallet connection status changes
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      initializeSDK();
    } else {
      updateState({ sdkInitialized: false });
    }
  }, [isConnected, address, fromChain]);

  // Sync selected chain with connected wallet
  useEffect(() => {
    if (chainId && isConnected) {
      updateState({ fromChain: chainId.toString() });
    }
  }, [chainId, isConnected]);

  // Automatic quote fetching
  useEffect(() => {
    const getQuoteAutomatically = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
        updateState({ toAmount: '' });
        return;
      }

      const timeoutId = setTimeout(async () => {
        updateState({ quoteLoading: true });
        
        try {
          const srcTokenAddress = getTokenAddress(fromChain, fromToken);
          const dstTokenAddress = getTokenAddress(toChain, toToken);
          
          if (!srcTokenAddress || !dstTokenAddress) {
            console.error('Token addresses not found');
            updateState({ toAmount: '0' });
            return;
          }

          const weiAmount = convertToWei(fromAmount, fromToken);
          if (weiAmount === '0') {
            console.error('Wei amount is 0, cannot get quote');
            updateState({ toAmount: '0' });
            return;
          }

          const quoteParams = {
            srcChainId: parseInt(fromChain),
            dstChainId: parseInt(toChain),
            srcTokenAddress,
            dstTokenAddress,
            amount: weiAmount,
            walletAddress: address
          };

          const response = await fetch(`${API_BASE_URL}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteParams)
          });
          
          const data = await response.json();
          
          if (data.success && data.data.quote && data.data.quote.dstTokenAmount) {
            const humanAmount = convertFromWei(data.data.quote.dstTokenAmount, toToken);
            updateState({ toAmount: humanAmount });
          } else if (data.success && data.data.toAmount) {
            const humanAmount = convertFromWei(data.data.toAmount, toToken);
            updateState({ toAmount: humanAmount });
          } else {
            console.error('Quote error:', data.error || 'No quote data received');
            updateState({ toAmount: '0' });
          }
          
        } catch (error) {
          console.error('Failed to get quote:', error);
          updateState({ toAmount: '0' });
        } finally {
          updateState({ quoteLoading: false });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    };

    getQuoteAutomatically();
  }, [fromAmount, fromToken, toToken, fromChain, toChain, isConnected, address]);

  // Handle main swap action
  const handleSwap = async () => {
    console.log('🚀 HANDLE SWAP FUNCTION CALLED');
    
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (!hasSufficientBalance(fromAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${fromAmount} ${fromToken}`,
        variant: "destructive"
      });
      return;
    }

    if (!sdkInitialized) {
      toast({
        title: "SDK Not Connected",
        description: "Please wait for SDK connection to complete",
        variant: "destructive"
      });
      return;
    }

    updateState({ orderLoading: true });
    
    try {
      const quote = await fusionSwap.getQuote();
      if (quote) {
        updateState({
          currentQuote: quote,
          orderData: {
            orderHash: 'pending_approval',
            status: 'pending_approval'
          },
          showOrderModal: true
        });
      }
    } catch (error: any) {
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get quote",
        variant: "destructive"
      });
    } finally {
      updateState({ orderLoading: false });
    }
  };

  // Handle classic swap button click
  const handleClassicSwapClick = () => {
    if (classicSwap.classicQuote) {
      classicSwap.getClassicApprovalTransaction();
    } else {
      classicSwap.getClassicSwapQuote();
    }
  };

  // Handle chain switch
  const handleChainSwitch = (newChainId: string) => {
    if (switchChain) {
      switchChain({ chainId: parseInt(newChainId) });
    }
  };

  // Copy to clipboard utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  // Handle chat swap request
  const handleChatSwapRequest = async (swapData: any): Promise<ChatSwapResult> => {
    try {
      if (!isConnected || !address) {
        return {
          success: false,
          message: '❌ **Wallet Not Connected**\n\nPlease connect your wallet first to execute this swap.'
        };
      }

      const quote = await fusionSwap.getQuote();
      if (quote) {
        return {
          success: true,
          message: `🎯 **Quote Ready!**\n\n**Swap Details:**\n• From: ${swapData.amount} ${swapData.token}\n• Ready to execute?`,
          quoteData: { quote },
          swapData
        };
      } else {
        throw new Error('Failed to get quote');
      }
    } catch (error: any) {
      return {
        success: false,
        message: `❌ **Swap Failed**\n\nError: ${error.message}`
      };
    }
  };

  // Handle chat swap execution
  const handleChatSwapExecution = async (quoteData: any, swapData: any): Promise<ChatSwapResult> => {
    try {
      // This would trigger the same approval flow as the main interface
      updateState({
        currentQuote: quoteData.quote,
        orderData: {
          orderHash: 'pending_approval',
          status: 'pending_approval'
        },
        showOrderModal: true
      });

      return {
        success: true,
        message: "🚀 **Swap Initiated!**\n\nPlease complete the approval process in the modal."
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ **Execution Failed**\n\nError: ${error.message}`
      };
    }
  };

  const swapContext = {
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    isConnected,
    address,
    currentQuote
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-30" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-glow/20 rounded-full blur-3xl animate-pulse-glow" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/1e18f896-8c0d-4c93-9d21-0aa11cf4aa76.png" 
              alt="genSwaps Logo" 
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                genSwaps TRUE DeFi
              </h1>
              <p className="text-muted-foreground">True decentralized cross-chain swaps</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <WalletConnector />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span>TRUE DeFi Swap Tokens</span>
                    <WalletStatus
                      sdkLoading={sdkLoading}
                      sdkInitialized={sdkInitialized}
                      isConnected={isConnected}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SwapForm
                  fromChain={fromChain}
                  toChain={toChain}
                  fromToken={fromToken}
                  toToken={toToken}
                  fromAmount={fromAmount}
                  toAmount={toAmount}
                  swapMode={swapMode}
                  quoteLoading={quoteLoading}
                  isConnected={isConnected}
                  formattedBalance={getFormattedBalance()}
                  isBalanceLoading={isBalanceLoading()}
                  hasSufficientBalance={hasSufficientBalance(fromAmount)}
                  sdkInitialized={sdkInitialized}
                  onFromChainChange={(chainId) => {
                    updateState({ fromChain: chainId });
                    handleChainSwitch(chainId);
                  }}
                  onToChainChange={(chainId) => updateState({ toChain: chainId })}
                  onFromTokenChange={(token) => updateState({ fromToken: token })}
                  onToTokenChange={(token) => updateState({ toToken: token })}
                  onFromAmountChange={(amount) => updateState({ fromAmount: amount })}
                  onFlipTokens={handleFlipTokens}
                  onRefreshQuote={() => fusionSwap.getQuote()}
                  onRefreshBalance={refetchBalance}
                  onSwapModeChange={setSwapMode}
                />

                <SwapButton
                  swapMode={swapMode}
                  isConnected={isConnected}
                  fromAmount={fromAmount}
                  toAmount={toAmount}
                  orderLoading={orderLoading}
                  classicSwapLoading={classicSwap.classicSwapLoading}
                  hasSufficientBalance={hasSufficientBalance(fromAmount)}
                  sdkInitialized={sdkInitialized}
                  classicQuote={classicSwap.classicQuote}
                  fromToken={fromToken}
                  toToken={toToken}
                  onClick={swapMode === 'fusion' ? handleSwap : handleClassicSwapClick}
                />

                {/* Classic Swap Status Section */}
                {swapMode === 'classic' && (
                  <ClassicSwapStatus
                    classicQuote={classicSwap.classicQuote}
                    classicAnalysis={classicSwap.classicAnalysis}
                    classicApprovalTx={classicSwap.classicApprovalTx}
                    classicSwapTx={classicSwap.classicSwapTx}
                    classicExecutionResult={classicSwap.classicExecutionResult}
                    fromAmount={fromAmount}
                    toAmount={toAmount}
                    fromToken={fromToken}
                    toToken={toToken}
                    onGetAnalysis={classicSwap.getClassicSwapAnalysis}
                    onGetApproval={classicSwap.getClassicApprovalTransaction}
                    onApproveTokens={classicSwap.handleClassicApproval}
                    onExecuteSwap={classicSwap.handleClassicSwap}
                    onCancelApproval={() => classicSwap.updateState({ classicApprovalTx: null })}
                    onCancelSwap={() => classicSwap.updateState({ classicSwapTx: null })}
                    onClearResult={() => classicSwap.updateState({ classicExecutionResult: null })}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wallet SDK Connection & Swap History */}
          <div className="lg:col-span-1 space-y-4">
            <WalletSDKConnector />
            <SwapHistory onCopyToClipboard={copyToClipboard} />
          </div>
        </div>
      </div>

      {/* Swap Modals */}
      <SwapModals
        showOrderModal={showOrderModal}
        orderData={orderData}
        isProcessing={isProcessing}
        approvalLoading={approvalLoading}
        submissionLoading={submissionLoading}
        isApproved={isApproved}
        orderStatus={orderStatus}
        statusLoading={statusLoading}
        fromAmount={fromAmount}
        toAmount={toAmount}
        fromToken={fromToken}
        toToken={toToken}
        fromChain={fromChain}
        toChain={toChain}
        onOrderModalClose={() => {
          updateState({ showOrderModal: false, isProcessing: false });
        }}
        onApproveTokens={fusionSwap.approveTokens}
        onCheckOrderStatus={fusionSwap.checkOrderStatus}
        onCopyToClipboard={copyToClipboard}
        swapCompleted={swapCompleted}
        onSwapCompletedClose={() => updateState({ swapCompleted: false })}
        onStartNewSwap={() => {
          updateState({ swapCompleted: false });
          resetSwapState();
        }}
        showConfirmModal={showConfirmModal}
        txHash={txHash}
        onConfirmModalClose={() => updateState({ showConfirmModal: false })}
      />

      {/* AI Chat Interface */}
      <AIChatInterface
        swapContext={swapContext}
        onSwapRequest={handleChatSwapRequest}
        onExecuteSwap={handleChatSwapExecution}
      />
    </div>
  );
};

export default SwapInterface;