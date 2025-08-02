export interface SwapParams {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
  approve?: boolean;
  approvalTxHash?: string;
  eip712Signature?: string;
  userRpcUrl?: string;
  quote?: {
    quoteReferenceId: string;
  };
}

export interface QuoteData {
  quoteReferenceId: string;
  dstTokenAmount: string;
  dstTokenAddress: string;
  salt?: string;
  makerTraits?: string;
  exactValues?: {
    salt: string;
    dstTokenAmount: string;
    dstTokenAddress: string;
    makerTraits: string;
  };
  getPreset?: () => any;
}

export interface OrderData {
  orderHash: string;
  status: 'pending_approval' | 'swap_in_progress' | 'completed' | 'failed';
  approvalTxHash?: string;
  swapResult?: any;
  quote?: QuoteData;
}

export interface ClassicSwapData {
  fromTokenAmount?: string;
  toAmount?: string;
  to?: string;
  data?: string;
  value?: string;
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  needsApproval?: boolean;
  estimatedGas?: {
    total?: string;
  };
  estimatedCost?: {
    total?: string;
  };
}

export interface TokenInfo {
  symbol: string;
  name: string;
  logo: string;
  address: string;
}

export interface NetworkInfo {
  id: number;
  name: string;
  symbol: string;
  logo: string;
}

export type SwapMode = 'fusion' | 'classic';

export interface SwapState {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  swapMode: SwapMode;
  isLoading: boolean;
  quoteLoading: boolean;
  orderLoading: boolean;
  approvalLoading: boolean;
  submissionLoading: boolean;
  isProcessing: boolean;
  isApproved: boolean;
  sdkInitialized: boolean;
  sdkLoading: boolean;
  currentQuote: QuoteData | null;
  orderData: OrderData | null;
  orderStatus: any;
  statusLoading: boolean;
  swapCompleted: boolean;
  showOrderModal: boolean;
  showConfirmModal: boolean;
  txHash: string;
}

export interface FusionSwapState extends Pick<SwapState, 
  'currentQuote' | 'orderData' | 'orderStatus' | 'statusLoading' | 
  'approvalLoading' | 'submissionLoading' | 'isProcessing' | 'isApproved'
> {}

export interface ClassicSwapState {
  classicSwapLoading: boolean;
  classicQuote: ClassicSwapData | null;
  classicAnalysis: ClassicSwapData | null;
  classicApprovalTx: ClassicSwapData | null;
  classicSwapTx: ClassicSwapData | null;
  classicExecutionResult: ClassicSwapData | null;
}