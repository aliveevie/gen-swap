import React from 'react';
import { Button } from "@/components/ui/button";
import { formatMessageContent } from '@/lib/chat/chatHelpers';
import { ChatMessage, ChatSwapResult } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  chatContainerRef: React.RefObject<HTMLDivElement>;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onExecuteSwap?: (quoteData: any, swapData: any) => Promise<ChatSwapResult>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  chatContainerRef,
  chatEndRef,
  onExecuteSwap
}) => {
  const handleExecuteSwap = async (swapData: any) => {
    if (!onExecuteSwap) return;

    try {
      const result = await onExecuteSwap(swapData.quoteData, swapData.swapData);
      // Note: The parent component should handle adding the result message
      // This is just to trigger the execution
    } catch (error) {
      console.error('Execute swap error:', error);
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              message.type === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white border border-gray-300 text-gray-800 shadow-md'
            }`}
          >
            {message.isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-700 font-medium">AI is thinking...</span>
              </div>
                                    ) : (
                          <div className="text-sm leading-relaxed text-gray-800 font-medium prose prose-sm max-w-none">
                            {formatMessageContent(message.content).map((item) => {
                              switch (item.type) {
                                case 'h3':
                                  return <h3 key={item.id} className="text-lg font-bold text-blue-600 mt-4 mb-2">{item.content.replace('## ', '')}</h3>;
                                case 'h4':
                                  return <h4 key={item.id} className="text-base font-semibold text-gray-700 mt-3 mb-1">{item.content.replace('### ', '')}</h4>;
                                case 'bold-item':
                                  return (
                                    <div key={item.id} className="flex items-start space-x-2 my-1">
                                      <span className="font-semibold text-blue-600">{item.parts?.[0]}:</span>
                                      <span>{item.parts?.[1] || ''}</span>
                                    </div>
                                  );
                                case 'list-item':
                                  return <div key={item.id} className="ml-4 my-1">• {item.content.replace('- ', '')}</div>;
                                case 'spacer':
                                  return <div key={item.id} className="h-2"></div>;
                                default:
                                  return <div key={item.id} className="my-1">{item.content}</div>;
                              }
                            })}
                          </div>
                        )}
            
            {/* Confirmation Button for Swap */}
            {message.swapData && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  onClick={() => handleExecuteSwap(message.swapData)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  🚀 Confirm & Execute Swap
                </Button>
              </div>
            )}
            
            <div className={`text-xs mt-2 ${
              message.type === 'user' ? 'text-blue-100' : 'text-gray-600 font-medium'
            }`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};