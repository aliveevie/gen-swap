export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  swapData?: {
    quoteData: any;
    swapData: any;
  };
}

export interface SwapRequest {
  type: 'swap_request' | 'other';
  amount?: number;
  token?: string;
  fromChain?: string;
  toChain?: string;
  isValid: boolean;
}

export interface ChatSwapResult {
  success: boolean;
  message: string;
  quoteData?: any;
  swapData?: any;
  orderHash?: string;
}

export interface ChatState {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
}

export interface QuickActionParams {
  swapData?: {
    fromToken: string;
    toToken: string;
    fromNetwork: string;
    toNetwork: string;
    amount: string;
    fromChainId: string;
    toChainId: string;
  };
  tokens?: string[];
  priceData?: any;
  chainId?: string;
  tokenAddress?: string;
  currency?: string;
  walletAddress?: string;
  srcChainId?: number;
  dstChainId?: number;
  srcTokenAddress?: string;
  dstTokenAddress?: string;
  amount?: string;
  swapRequest?: {
    fromToken: string;
    toToken: string;
    fromNetwork: string;
    toNetwork: string;
    amount: string;
    fromChainId: string;
    toChainId: string;
  };
  topic?: string;
}