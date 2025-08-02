import React from 'react';
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onQuickAction: (action: string) => Promise<void>;
  isLoading: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onQuickAction,
  isLoading
}) => {
  const quickActions = [
    { id: 'analyze-swap', label: '🔍 Analyze Swap' },
    { id: 'market-insights', label: '📊 Market Insights' },
    { id: 'token-price', label: '💰 Token Price' },
    { id: 'gas-price', label: '⛽ Gas Price' },
    { id: 'wallet-balance', label: '💰 Wallet Balance' },
    { id: 'token-list', label: '📋 Token List' },
    { id: 'fusion-intent-quote', label: '🔥 Fusion Intent' },
    { id: 'optimize-swap', label: '⚡ Optimize' },
    { id: 'educational', label: '📚 Learn' }
  ];

  return (
    <div className="px-4 py-3 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => onQuickAction(action.id)}
            disabled={isLoading}
            className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};