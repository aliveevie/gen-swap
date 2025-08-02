import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Lock, ArrowUpDown } from "lucide-react";
import { ClassicSwapData } from '@/types/swap';

interface ClassicSwapStatusProps {
  classicQuote: ClassicSwapData | null;
  classicAnalysis: ClassicSwapData | null;
  classicApprovalTx: ClassicSwapData | null;
  classicSwapTx: ClassicSwapData | null;
  classicExecutionResult: ClassicSwapData | null;
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
  onGetAnalysis: () => void;
  onGetApproval: () => void;
  onApproveTokens: () => void;
  onExecuteSwap: () => void;
  onCancelApproval: () => void;
  onCancelSwap: () => void;
  onClearResult: () => void;
}

export const ClassicSwapStatus: React.FC<ClassicSwapStatusProps> = ({
  classicQuote,
  classicAnalysis,
  classicApprovalTx,
  classicSwapTx,
  classicExecutionResult,
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  onGetAnalysis,
  onGetApproval,
  onApproveTokens,
  onExecuteSwap,
  onCancelApproval,
  onCancelSwap,
  onClearResult
}) => {
  return (
    <div className="mt-4 space-y-3">
      {/* Classic Quote Status */}
      {classicQuote && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-800">⚡ Classic Swap Quote Ready</h4>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm text-green-700 mb-3">
            Quote received for {fromAmount} {fromToken} → {toAmount} {toToken}
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onGetAnalysis}
              className="text-xs"
            >
              📊 Get Analysis
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onGetApproval}
              className="text-xs"
            >
              ✅ Get Approval
            </Button>
          </div>
        </div>
      )}

      {/* Classic Analysis Status */}
      {classicAnalysis && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-800">🔍 Classic Swap Analysis</h4>
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Needs Approval: {classicAnalysis.needsApproval ? 'Yes' : 'No'}</p>
            <p>Estimated Gas: {classicAnalysis.estimatedGas?.total || 'N/A'}</p>
            <p>Estimated Cost: {classicAnalysis.estimatedCost?.total || 'N/A'} wei</p>
          </div>
        </div>
      )}

      {/* Classic Approval Status */}
      {classicApprovalTx && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-yellow-800">🔐 Approval Transaction Ready</h4>
            <Lock className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Approval transaction prepared. Sign in your wallet to continue.
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={onApproveTokens}
              className="text-xs bg-yellow-600 hover:bg-yellow-700"
            >
              🔐 Approve Tokens
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelApproval}
              className="text-xs"
            >
              ❌ Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Classic Swap Transaction Status */}
      {classicSwapTx && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-purple-800">🔄 Swap Transaction Ready</h4>
            <ArrowUpDown className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 mb-3">
            Swap transaction prepared. Sign in your wallet to execute.
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={onExecuteSwap}
              className="text-xs bg-purple-600 hover:bg-purple-700"
            >
              🚀 Execute Swap
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelSwap}
              className="text-xs"
            >
              ❌ Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Classic Execution Result */}
      {classicExecutionResult && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-800">🎉 Classic Swap Executed!</h4>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>Transaction Hash: {classicExecutionResult.transactionHash}</p>
            <p>Block Number: {classicExecutionResult.blockNumber}</p>
            <p>Gas Used: {classicExecutionResult.gasUsed}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearResult}
            className="text-xs mt-2"
          >
            ✅ Done
          </Button>
        </div>
      )}
    </div>
  );
};