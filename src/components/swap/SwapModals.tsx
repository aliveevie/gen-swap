import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Copy, RefreshCw, CheckCircle, Loader2, Clock } from "lucide-react";
import { NETWORKS } from '@/lib/constants/networks';
import { OrderData } from '@/types/swap';

interface SwapModalsProps {
  // Order Modal
  showOrderModal: boolean;
  orderData: OrderData | null;
  isProcessing: boolean;
  approvalLoading: boolean;
  submissionLoading: boolean;
  isApproved: boolean;
  orderStatus: any;
  statusLoading: boolean;
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  onOrderModalClose: () => void;
  onApproveTokens: () => void;
  onCheckOrderStatus: (orderHash: string) => void;
  onCopyToClipboard: (text: string) => void;
  
  // Completion Modal
  swapCompleted: boolean;
  onSwapCompletedClose: () => void;
  onStartNewSwap: () => void;
  
  // Transaction Modal
  showConfirmModal: boolean;
  txHash: string;
  onConfirmModalClose: () => void;
}

export const SwapModals: React.FC<SwapModalsProps> = ({
  showOrderModal,
  orderData,
  isProcessing,
  approvalLoading,
  submissionLoading,
  isApproved,
  orderStatus,
  statusLoading,
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  fromChain,
  toChain,
  onOrderModalClose,
  onApproveTokens,
  onCheckOrderStatus,
  onCopyToClipboard,
  swapCompleted,
  onSwapCompletedClose,
  onStartNewSwap,
  showConfirmModal,
  txHash,
  onConfirmModalClose
}) => {
  const getNetworkName = (chainId: string) => {
    const network = Object.values(NETWORKS).find(n => n.id.toString() === chainId);
    return network?.name || 'Unknown';
  };

  return (
    <>
      {/* Order Confirmation Modal */}
      <Dialog open={showOrderModal} onOpenChange={onOrderModalClose}>
        <DialogContent className="bg-gradient-card backdrop-blur-sm border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Confirm Cross-Chain Swap Order</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            {orderData && (
              <>
                {/* Order Details */}
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Order Details</span>
                      <Badge className="bg-warning/20 text-warning border-warning/30">
                        {isProcessing ? (
                          <>
                            <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
                            Processing
                          </>
                        ) : (
                          'Processing...'
                        )}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">From:</span>
                        <span>{fromAmount} {fromToken} on {getNetworkName(fromChain)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">To:</span>
                        <span>{toAmount} {toToken} on {getNetworkName(toChain)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Hash:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs">{orderData.orderHash.slice(0, 10)}...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyToClipboard(orderData.orderHash)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCheckOrderStatus(orderData.orderHash)}
                            className="h-6 w-6 p-0"
                            disabled={statusLoading}
                          >
                            <RefreshCw className={`h-3 w-3 ${statusLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      {orderStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {orderStatus.status?.status || 'Unknown'}
                          </Badge>
                        </div>
                      )}
                      {orderData?.status === 'swap_in_progress' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Swap Status:</span>
                          <Badge className="bg-warning/20 text-warning border-warning/30">
                            <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
                            Processing...
                          </Badge>
                        </div>
                      )}
                      {isApproved && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approval Status:</span>
                          <Badge className="bg-success/20 text-success border-success/30">
                            <CheckCircle className="inline mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="bg-background/30 p-4 rounded-lg border border-border/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lock className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Security Features</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Order created with your wallet provider</div>
                      <div>• No private keys stored on server</div>
                      <div>• Hash lock protection enabled</div>
                      <div>• TRUE DeFi architecture</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={onApproveTokens}
                    disabled={approvalLoading || submissionLoading || orderData?.status === 'swap_in_progress' || isProcessing}
                    className="flex-1 bg-gradient-primary hover:opacity-90 disabled:opacity-50"
                  >
                    {approvalLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : submissionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : orderData?.status === 'swap_in_progress' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Swap in Progress...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Approve Tokens
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      onOrderModalClose();
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={approvalLoading || submissionLoading}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Order Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Order will expire in 30 minutes</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Completion Modal */}
      <Dialog open={swapCompleted} onOpenChange={onSwapCompletedClose}>
        <DialogContent className="bg-gradient-card backdrop-blur-sm border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>Swap Completed Successfully!</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg mb-4">Your cross-chain swap has been executed!</p>
            <div className="bg-background/50 p-4 rounded-lg border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">From:</span>
                <span className="text-sm font-medium">{fromAmount} {fromToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To:</span>
                <span className="text-sm font-medium">{toAmount} {toToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className="bg-success/20 text-success border-success/30">
                  Completed
                </Badge>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={onStartNewSwap}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                Start New Swap
              </Button>
              <Button
                onClick={onSwapCompletedClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={onConfirmModalClose}>
        <DialogContent className="bg-gradient-card backdrop-blur-sm border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>
              Swap Completed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg mb-4">Your cross-chain swap is complete!</p>
            <div className="bg-background/50 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Transaction Hash:
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{txHash}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyToClipboard(txHash)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};