import { useState, useEffect, useRef } from 'react';
import { ChatState, ChatMessage, SwapRequest, ChatSwapResult } from '@/types/chat';
import { parseSwapRequest } from '@/lib/chat/chatHelpers';
import { API_BASE_URL, NETWORKS } from '@/lib/constants/networks';

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'ai',
    content: 'Hello! I\'m your AI DeFi assistant. I can help you with cross-chain swaps, explain token prices, check balances, and answer any questions about the GenSwap platform.\n\n💡 **Try natural language swaps:**\n"swap 1.2 USDC on arbitrum to polygon"\n"swap 0.5 ETH from ethereum to base"\n\nHow can I help you today?',
    timestamp: new Date()
  }
];

interface UseAIChatProps {
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

export const useAIChat = ({ swapContext, onSwapRequest, onExecuteSwap }: UseAIChatProps) => {
  const [state, setState] = useState<ChatState>({
    isChatOpen: false,
    isChatMinimized: false,
    chatMessages: initialMessages,
    chatInput: '',
    isChatLoading: false
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  const updateState = (updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage]
    }));
    return newMessage;
  };

  const removeLoadingMessages = () => {
    setState(prev => ({
      ...prev,
      chatMessages: prev.chatMessages.filter(msg => !msg.isLoading)
    }));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.chatInput.trim() || state.isChatLoading) return;

    const userMessage = addMessage({
      type: 'user',
      content: state.chatInput.trim()
    });

    setState(prev => ({ ...prev, chatInput: '', isChatLoading: true }));

    // Add loading message
    addMessage({
      type: 'ai',
      content: '',
      isLoading: true
    });

    try {
      // Check if this is a swap request
      const swapRequest = parseSwapRequest(state.chatInput.trim());
      
      if (swapRequest.type === 'swap_request' && swapRequest.isValid && onSwapRequest) {
        console.log('🔄 Detected swap request in chat:', swapRequest);
        
        // Add debug message about wallet status
        const walletStatus = `🔍 **Wallet Status:**\n- Connected: ${swapContext.isConnected ? '✅ Yes' : '❌ No'}\n- Address: ${swapContext.address ? `${swapContext.address.slice(0, 6)}...${swapContext.address.slice(-4)}` : 'Not available'}`;
        
        removeLoadingMessages();
        addMessage({
          type: 'ai',
          content: walletStatus
        });
        
        // Handle the swap request
        const swapResult = await onSwapRequest(swapRequest);
        
        // Add the swap result
        addMessage({
          type: 'ai',
          content: swapResult.message,
          swapData: swapResult.success && swapResult.quoteData ? { 
            quoteData: swapResult.quoteData, 
            swapData: swapResult.swapData 
          } : undefined
        });
        
        return;
      }

      // Call real AI API for other messages
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: state.chatInput.trim(),
          context: swapContext
        })
      });

      const result = await response.json();
      
      let aiResponse;
      if (result.success && result.data.success) {
        aiResponse = result.data.response || result.data.fallback;
      } else {
        aiResponse = 'Sorry, I encountered an error. Please try again.';
      }
      
      // Remove loading message and add AI response
      removeLoadingMessages();
      addMessage({
        type: 'ai',
        content: aiResponse
      });

    } catch (error) {
      console.error('AI chat error:', error);
      removeLoadingMessages();
      addMessage({
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      setState(prev => ({ ...prev, isChatLoading: false }));
    }
  };

  const handleQuickAction = async (action: string) => {
    if (state.isChatLoading) return;

    setState(prev => ({ ...prev, isChatLoading: true }));
    
    // Add loading message
    addMessage({
      type: 'ai',
      content: '',
      isLoading: true
    });

    try {
      let endpoint = '';
      let requestBody = {};

      // Handle different quick actions based on the action type
      switch (action) {
        case 'analyze-swap':
          if (!swapContext.fromToken || !swapContext.toToken || !swapContext.fromAmount) {
            throw new Error('Please set up a swap first to analyze');
          }
          endpoint = '/ai/analyze-swap';
          requestBody = {
            swapData: {
              fromToken: swapContext.fromToken,
              toToken: swapContext.toToken,
              fromNetwork: Object.keys(NETWORKS).find(key => 
                NETWORKS[key].id.toString() === swapContext.fromChain),
              toNetwork: Object.keys(NETWORKS).find(key => 
                NETWORKS[key].id.toString() === swapContext.toChain),
              amount: swapContext.fromAmount,
              fromChainId: swapContext.fromChain,
              toChainId: swapContext.toChain
            }
          };
          break;

        case 'market-insights':
          endpoint = '/ai/market-insights';
          requestBody = { context: swapContext };
          break;

        case 'token-price':
          endpoint = '/ai/token-price';
          requestBody = { 
            tokenSymbol: swapContext.fromToken || 'ETH',
            chainId: parseInt(swapContext.fromChain || '1')
          };
          break;

        case 'gas-price':
          endpoint = '/ai/gas-price';
          requestBody = { chainId: parseInt(swapContext.fromChain || '1') };
          break;

        case 'wallet-balance':
          endpoint = '/ai/wallet-balance';
          requestBody = { 
            walletAddress: swapContext.address,
            chainId: parseInt(swapContext.fromChain || '1')
          };
          break;

        case 'token-list':
          endpoint = '/ai/token-list';
          requestBody = { chainId: parseInt(swapContext.fromChain || '1') };
          break;

        case 'fusion-intent-quote':
          endpoint = '/ai/fusion-intent-quote';
          requestBody = { 
            fromToken: swapContext.fromToken,
            toToken: swapContext.toToken,
            amount: swapContext.fromAmount,
            fromChain: parseInt(swapContext.fromChain || '1'),
            toChain: parseInt(swapContext.toChain || '1')
          };
          break;

        case 'optimize-swap':
          endpoint = '/ai/optimize-swap';
          requestBody = { 
            fromToken: swapContext.fromToken,
            toToken: swapContext.toToken,
            amount: swapContext.fromAmount,
            fromChain: parseInt(swapContext.fromChain || '1'),
            toChain: parseInt(swapContext.toChain || '1'),
            walletAddress: swapContext.address
          };
          break;

        case 'educational':
          endpoint = '/ai/educational-content';
          requestBody = { 
            topic: 'defi-basics',
            userLevel: 'beginner'
          };
          break;

        default:
          // Handle unknown actions gracefully
          removeLoadingMessages();
          addMessage({
            type: 'ai',
            content: `I don't recognize the "${action}" action yet. Try asking me directly about what you need help with!`
          });
          setState(prev => ({ ...prev, isChatLoading: false }));
          return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      let aiResponse;
      if (result.success && result.data.success) {
        aiResponse = result.data.analysis || 
                    result.data.insights || 
                    result.data.recommendations || 
                    result.data.content || 
                    result.data.aiAnalysis || 
                    result.data.response || 
                    result.data.fallback;
      } else {
        aiResponse = result.error || 'Sorry, I encountered an error. Please try again.';
      }
      
      // Fallback if no AI response was found
      if (!aiResponse || aiResponse.trim() === '') {
        aiResponse = `I've retrieved the data for your ${action} request, but I'm having trouble generating the analysis. Please try asking me about the ${action} again or check the console for more details.`;
      }
      
      // Remove loading message and add AI response
      removeLoadingMessages();
      addMessage({
        type: 'ai',
        content: aiResponse
      });

    } catch (error) {
      console.error('Quick action error:', error);
      removeLoadingMessages();
      
      // Handle specific API errors
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = `This feature (${action}) is not yet available on the backend. Try asking me directly!`;
        } else if (error.message.includes('400')) {
          errorMessage = `I had trouble processing your ${action} request. Try rephrasing your question!`;
        } else {
          errorMessage = error.message;
        }
      }
      
      addMessage({
        type: 'ai',
        content: errorMessage
      });
    } finally {
      setState(prev => ({ ...prev, isChatLoading: false }));
    }
  };

  const toggleChat = () => {
    setState(prev => ({
      ...prev,
      isChatOpen: !prev.isChatOpen,
      isChatMinimized: false
    }));
  };

  const minimizeChat = () => {
    setState(prev => ({
      ...prev,
      isChatMinimized: !prev.isChatMinimized
    }));
  };

  return {
    ...state,
    chatEndRef,
    chatContainerRef,
    updateState,
    addMessage,
    handleChatSubmit,
    handleQuickAction,
    toggleChat,
    minimizeChat
  };
};