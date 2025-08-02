import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading
}) => {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-gray-200/50 bg-white">
      <div className="flex items-center space-x-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Try: 'swap 1.2 USDC on arbitrum to polygon' or ask about DeFi..."
          className="flex-1 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-xl text-gray-800 placeholder-gray-500"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!value.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 h-10 w-10 rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};