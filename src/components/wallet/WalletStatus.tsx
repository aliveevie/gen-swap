import React from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface WalletStatusProps {
  sdkLoading: boolean;
  sdkInitialized: boolean;
  isConnected: boolean;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({
  sdkLoading,
  sdkInitialized,
  isConnected
}) => {
  if (sdkLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Connecting SDK...</span>
      </div>
    );
  }

  if (sdkInitialized) {
    return (
      <div className="flex items-center space-x-2 text-sm text-success">
        <CheckCircle className="h-4 w-4" />
        <span>SDK Connected</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-warning">
        <AlertTriangle className="h-4 w-4" />
        <span>SDK Disconnected</span>
      </div>
    );
  }

  return null;
};