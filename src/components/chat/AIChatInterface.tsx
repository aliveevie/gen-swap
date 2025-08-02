import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot, X, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatSwapResult } from '@/types/chat';

interface AIChatInterfaceProps {
  swapContext: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    isConnected: boolean;
    address: string | undefined;
    currentQuote: any;
  };
  onSwapRequest?: (swapData: any) => Promise<ChatSwapResult>;
  onExecuteSwap?: (quoteData: any, swapData: any) => Promise<ChatSwapResult>;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  swapContext,
  onSwapRequest,
  onExecuteSwap
}) => {
  const { toast } = useToast();
  
  const {
    isChatOpen,
    isChatMinimized,
    chatMessages,
    chatInput,
    isChatLoading,
    chatEndRef,
    chatContainerRef,
    updateState,
    handleChatSubmit,
    handleQuickAction,
    toggleChat,
    minimizeChat
  } = useAIChat({
    swapContext,
    onSwapRequest,
    onExecuteSwap
  });

  const openChatWithToast = () => {
    updateState({ isChatOpen: true, isChatMinimized: false });
    toast({
      title: "AI Chat Opened",
      description: "AI DeFi Assistant is now available!",
    });
  };

  return (
    <div className="fixed bottom-32 md:bottom-40 right-4 md:right-6 z-[9999]">
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <Button
          onClick={toggleChat}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group relative"
        >
          <MessageCircle className="h-7 w-7 text-white" />
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-xs text-white font-bold">AI</span>
          </div>
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
        </Button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className={`bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl transition-all duration-300 ${
          isChatMinimized ? 'h-20 w-80' : 'h-[500px] w-96'
        }`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800">AI DeFi Assistant</h3>
                <p className="text-xs text-gray-600">Powered by GenSwap</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={minimizeChat}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                {isChatMinimized ? (
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-gray-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isChatMinimized && (
            <>
              <ChatMessages
                messages={chatMessages}
                chatContainerRef={chatContainerRef}
                chatEndRef={chatEndRef}
                onExecuteSwap={onExecuteSwap}
              />

              <QuickActions
                onQuickAction={handleQuickAction}
                isLoading={isChatLoading}
              />

              <ChatInput
                value={chatInput}
                onChange={(value) => updateState({ chatInput: value })}
                onSubmit={handleChatSubmit}
                isLoading={isChatLoading}
              />
            </>
          )}
        </div>
      )}

      {/* Debug Chat Button - Can be removed in production */}
      {!isChatOpen && (
        <div className="absolute -top-20 right-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openChatWithToast}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            🤖 Open AI Chat
          </Button>
        </div>
      )}
    </div>
  );
};