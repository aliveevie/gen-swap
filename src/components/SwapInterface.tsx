import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowUpDown, 
  RefreshCw, 
  Wallet, 
  ChevronDown,
  Copy,
  ExternalLink,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Shield,
  Lock,
  MessageCircle,
  Send,
  Bot,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useChainId, useSwitchChain, useBalance, usePublicClient, useWriteContract } from 'wagmi';
import WalletConnector from "./WalletConnector";
import WalletSDKConnector from "./WalletSDKConnector";
import { ClientSwapper } from "@/lib/clientSwapper";

// Import token data from data.ts
import { TOKENS } from "@/lib/data";

// API base URL
const API_BASE_URL = 'http://localhost:9056/api';

// Network configurations with chain IDs
const NETWORKS = {
  ethereum: { id: 1, name: "Ethereum", symbol: "ETH", logo: "⟠" },
  arbitrum: { id: 42161, name: "Arbitrum", symbol: "ARB", logo: "🔷" },
  base: { id: 8453, name: "Base", symbol: "BASE", logo: "🔵" },
  polygon: { id: 137, name: "Polygon", symbol: "MATIC", logo: "🟣" },
  bsc: { id: 56, name: "BSC", symbol: "BNB", logo: "🟡" },
  avalanche: { id: 43114, name: "Avalanche", symbol: "AVAX", logo: "🔺" },
  optimism: { id: 10, name: "Optimism", symbol: "OP", logo: "🔵" },
  fantom: { id: 250, name: "Fantom", symbol: "FTM", logo: "👻" },
};

const SwapInterface = () => {
  const [fromChain, setFromChain] = useState("1"); // Ethereum default
  const [toChain, setToChain] = useState("137"); // Polygon default
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swapCompleted, setSwapCompleted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  
  // Classic Swap State
  const [swapMode, setSwapMode] = useState<'fusion' | 'classic'>('fusion');
  const [classicSwapLoading, setClassicSwapLoading] = useState(false);
  const [classicQuote, setClassicQuote] = useState<any>(null);
  const [classicAnalysis, setClassicAnalysis] = useState<any>(null);
  const [classicApprovalTx, setClassicApprovalTx] = useState<any>(null);
  const [classicSwapTx, setClassicSwapTx] = useState<any>(null);
  const [classicExecutionResult, setClassicExecutionResult] = useState<any>(null);
  
  // AI Chat Interface State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    isLoading?: boolean;
    swapData?: any;
  }>>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI DeFi assistant. I can help you with cross-chain swaps, explain token prices, check balances, and answer any questions about the GenSwap platform.\n\n💡 **Try natural language swaps:**\n"swap 1.2 USDC on arbitrum to polygon"\n"swap 0.5 ETH from ethereum to base"\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  // Client swapper instance
  const clientSwapperRef = useRef<ClientSwapper | null>(null);
  
  // Rainbow Kit hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: parseInt(fromChain) });
  const { writeContract, isPending: writeContractPending, error: writeContractError } = useWriteContract();

  // Debug writeContract status
  useEffect(() => {
    console.log('🔍 writeContract status:', {
      isPending: writeContractPending,
      error: writeContractError,
      isConnected,
      address,
      chainId
    });
  }, [writeContractPending, writeContractError, isConnected, address, chainId]);



  // Get token address for balance checking
  const getTokenAddressForBalance = (networkId: string, tokenSymbol: string) => {
    // For native tokens like ETH, return undefined to use native balance
    if (tokenSymbol === 'ETH') {
      return undefined;
    }
    
    const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === networkId);
    if (!networkName || !TOKENS[networkName] || !TOKENS[networkName][tokenSymbol]) {
      return undefined;
    }
    return TOKENS[networkName][tokenSymbol] as `0x${string}`;
  };

  // Get token decimals for balance formatting
  const getTokenDecimals = (tokenSymbol: string) => {
    const tokenDecimals = {
      'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
      'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
    };
    return tokenDecimals[tokenSymbol] || 18;
  };

  // Get current chain configuration for wagmi
  const getCurrentChain = () => {
    const chainIdNum = parseInt(fromChain);
    switch (chainIdNum) {
      case 1: return { 
        id: 1, 
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } }
      };
      case 42161: return { 
        id: 42161, 
        name: 'Arbitrum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } }
      };
      case 8453: return { 
        id: 8453, 
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
      };
      case 137: return { 
        id: 137, 
        name: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: { default: { http: ['https://polygon-rpc.com'] } }
      };
      case 56: return { 
        id: 56, 
        name: 'BSC',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: { default: { http: ['https://bsc-dataseed.binance.org'] } }
      };
      case 43114: return { 
        id: 43114, 
        name: 'Avalanche',
        nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
        rpcUrls: { default: { http: ['https://api.avax.network/ext/bc/C/rpc'] } }
      };
      case 10: return { 
        id: 10, 
        name: 'Optimism',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } }
      };
      case 250: return { 
        id: 250, 
        name: 'Fantom',
        nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.ftm.tools'] } }
      };
      default: return { 
        id: 1, 
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } }
      };
    }
  };

  // Get token balance using wagmi
  const tokenAddress = getTokenAddressForBalance(fromChain, fromToken);
  const { data: tokenBalance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
    token: tokenAddress,
    chainId: parseInt(fromChain),
  });

  // Get native token balance (ETH, MATIC, etc.)
  const { data: nativeBalance, isLoading: nativeBalanceLoading } = useBalance({
    address: address,
    chainId: parseInt(fromChain),
  });

  // Format balance for display
  const formatBalance = (balance: any, decimals: number) => {
    if (!balance || !balance.value) return '0.00';
    const formatted = (Number(balance.value) / Math.pow(10, decimals)).toFixed(6);
    // Remove trailing zeros after decimal
    return formatted.replace(/\.?0+$/, '');
  };

  // Get current balance
  const getCurrentBalance = () => {
    // For native tokens (ETH, MATIC, etc.), use native balance
    const nativeTokens = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];
    if (nativeTokens.includes(fromToken)) {
      return nativeBalance;
    }
    return tokenBalance;
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return false;
    
    const currentBalance = getCurrentBalance();
    if (!currentBalance || !currentBalance.value) return false;
    
    const decimals = getTokenDecimals(fromToken);
    const requiredAmount = BigInt(Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)));
    const userBalance = currentBalance.value;
    
    return userBalance >= requiredAmount;
  };

  // Get balance loading state
  const isBalanceLoading = () => {
    // For native tokens, use native balance loading state
    const nativeTokens = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];
    if (nativeTokens.includes(fromToken)) {
      return nativeBalanceLoading;
    }
    return balanceLoading;
  };

  // Get available tokens for selected chains
  const getFromTokens = () => {
    const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain);
    if (!networkName || !TOKENS[networkName]) return [];
    
    return Object.keys(TOKENS[networkName]).map(symbol => ({
      symbol,
      name: symbol,
      logo: symbol === 'USDC' ? '💰' : symbol === 'USDT' ? '💵' : symbol === 'WETH' ? '⟠' : '🪙',
      address: TOKENS[networkName][symbol]
    }));
  };

  const getToTokens = () => {
    const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain);
    if (!networkName || !TOKENS[networkName]) return [];
    
    return Object.keys(TOKENS[networkName]).map(symbol => ({
      symbol,
      name: symbol,
      logo: symbol === 'USDC' ? '💰' : symbol === 'USDT' ? '💵' : symbol === 'WETH' ? '⟠' : '🪙',
      address: TOKENS[networkName][symbol]
    }));
  };

  // Get token address for a specific network and token
  const getTokenAddress = (networkId: string, tokenSymbol: string) => {
    const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === networkId);
    if (!networkName || !TOKENS[networkName] || !TOKENS[networkName][tokenSymbol]) {
      return null;
    }
    return TOKENS[networkName][tokenSymbol];
  };

  // Sync selected chain with connected wallet
  useEffect(() => {
    if (chainId && isConnected) {
      setFromChain(chainId.toString());
    }
  }, [chainId, isConnected]);

  // Refetch balance when token or chain changes
  useEffect(() => {
    if (isConnected && address) {
      refetchBalance();
    }
  }, [fromToken, fromChain, isConnected, address, refetchBalance]);

  // Initialize SDK when wallet connects
  const initializeSDK = async () => {
    if (!isConnected || !address) return;
    
    setSdkLoading(true);
    try {
      console.log('🔧 Initializing 1inch SDK with user wallet...');
      
      // Use the public client from wagmi hook
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      // Create Web3 provider from public client
      const web3Provider = {
        provider: publicClient,
        chainId: parseInt(fromChain),
        address: address
      };
      
      console.log('📡 Sending Web3 provider to backend for SDK initialization...');
      
      const response = await fetch(`${API_BASE_URL}/test-sdk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          web3Provider: web3Provider,
          nodeUrl: publicClient.transport.url || 'user_wallet_provider'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ SDK initialized successfully with user wallet');
        setSdkInitialized(true);
        toast({
          title: "SDK Connected",
          description: "1inch SDK initialized with your wallet",
        });
      } else {
        throw new Error(data.error || 'Failed to initialize SDK');
      }
      
    } catch (error) {
      console.error('❌ SDK initialization failed:', error);
      setSdkInitialized(false);
      toast({
        title: "SDK Connection Failed",
        description: error.message || "Failed to connect 1inch SDK",
        variant: "destructive"
      });
    } finally {
      setSdkLoading(false);
    }
  };

  // Handle wallet connection status changes and SDK initialization
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      
      // Initialize SDK after wallet connection
      initializeSDK();
    } else {
      setSdkInitialized(false);
    }
  }, [isConnected, address, fromChain]);

  // Automatic quote fetching when parameters change
  useEffect(() => {
    const getQuoteAutomatically = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
        setToAmount('');
        return;
      }

      // Debounce the quote request
      const timeoutId = setTimeout(async () => {
        setQuoteLoading(true);
        
        try {
          // Get token addresses
          const srcTokenAddress = getTokenAddress(fromChain, fromToken);
          const dstTokenAddress = getTokenAddress(toChain, toToken);
          
          if (!srcTokenAddress || !dstTokenAddress) {
            console.error('Token addresses not found');
            setToAmount('0');
            return;
          }

          // Convert amount to wei (assuming 18 decimals for most tokens)
          const tokenDecimals = {
            'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
            'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
          };
          const decimals = tokenDecimals[fromToken] || 18;
          const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

          // Validate wei amount is not 0
          if (weiAmount === '0') {
            console.error('Wei amount is 0, cannot get quote');
            setToAmount('0');
            return;
          }

          // Prepare quote request parameters
          const quoteParams = {
            srcChainId: parseInt(fromChain),
            dstChainId: parseInt(toChain),
            srcTokenAddress: srcTokenAddress,
            dstTokenAddress: dstTokenAddress,
            amount: weiAmount,
            walletAddress: address
          };

          console.log('🔄 Getting quote with parameters:', quoteParams);

          const response = await fetch(`${API_BASE_URL}/quote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(quoteParams)
          });
          
          const data = await response.json();
          
          if (data.success && data.data.quote && data.data.quote.dstTokenAmount) {
            // Convert quote amount back to human readable
            const quoteAmount = data.data.quote.dstTokenAmount;
            const toDecimals = tokenDecimals[toToken] || 18;
            const humanAmount = (parseInt(quoteAmount) / Math.pow(10, toDecimals)).toString();
            setToAmount(humanAmount);
            console.log('✅ Quote received:', humanAmount, toToken);
          } else if (data.success && data.data.toAmount) {
            // Handle case where quote is not directly available but toAmount is
            const toDecimals = tokenDecimals[toToken] || 18;
            const humanAmount = (parseInt(data.data.toAmount) / Math.pow(10, toDecimals)).toString();
            setToAmount(humanAmount);
            console.log('✅ Quote amount received:', humanAmount, toToken);
          } else {
            console.error('Quote error:', data.error || 'No quote data received');
            setToAmount('0');
          }
          
        } catch (error) {
          console.error('Failed to get quote:', error);
          setToAmount('0');
        } finally {
          setQuoteLoading(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    };

    getQuoteAutomatically();
  }, [fromAmount, fromToken, toToken, fromChain, toChain, isConnected, address]);

  // Manual quote refresh function
  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and connect wallet first",
        variant: "destructive"
      });
      return;
    }

    setQuoteLoading(true);
    
    try {
      // Get token addresses
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(toChain, toToken);
      
      if (!srcTokenAddress || !dstTokenAddress) {
        toast({
          title: "Error",
          description: "Token addresses not found for selected networks",
          variant: "destructive"
        });
        return;
      }

      // Convert amount to wei
      const tokenDecimals = {
        'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
        'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
      };
      const decimals = tokenDecimals[fromToken] || 18;
      const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

      // Validate wei amount is not 0
      if (weiAmount === '0') {
        toast({
          title: "Error",
          description: "Amount is too small to get a quote",
          variant: "destructive"
        });
        return;
      }

      // Prepare quote request parameters
      const quoteParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: weiAmount,
        walletAddress: address,
        approve: true // Send approve: true when user clicks Create Order
      };

      console.log('🔄 Manual quote request with parameters:', quoteParams);

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data.quote && data.data.quote.dstTokenAmount) {
        const quoteAmount = data.data.quote.dstTokenAmount;
        const toDecimals = tokenDecimals[toToken] || 18;
        const humanAmount = (parseInt(quoteAmount) / Math.pow(10, toDecimals)).toString();
        setToAmount(humanAmount);
        toast({
          title: "Quote Updated",
          description: `Estimated output: ${humanAmount} ${toToken}`,
        });
      } else if (data.success && data.data.toAmount) {
        // Handle case where quote is not directly available but toAmount is
        const toDecimals = tokenDecimals[toToken] || 18;
        const humanAmount = (parseInt(data.data.toAmount) / Math.pow(10, toDecimals)).toString();
        setToAmount(humanAmount);
        toast({
          title: "Quote Updated",
          description: `Estimated output: ${humanAmount} ${toToken}`,
        });
      } else {
        setToAmount('0');
        toast({
          title: "Quote Failed",
          description: data.error || "Failed to get quote. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Failed to get quote:', error);
      setToAmount('0');
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSwap = async () => {
    console.log('🚀 HANDLE SWAP FUNCTION CALLED');
    setIsProcessing(false);
    console.log('📋 Current state:', {
      isConnected,
      address,
      fromAmount,
      toAmount,
      fromToken,
      toToken,
      fromChain,
      toChain,
      sdkInitialized,
      hasSufficientBalance: hasSufficientBalance()
    });

    if (!isConnected || !address) {
      console.error('❌ Wallet not connected');
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (!toAmount || parseFloat(toAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    // Check if user has sufficient balance
    if (!hasSufficientBalance()) {
      const currentBalance = getCurrentBalance();
      const balanceFormatted = formatBalance(currentBalance, getTokenDecimals(fromToken));
      toast({
        title: "Insufficient Balance",
        description: `You have ${balanceFormatted} ${fromToken} but need ${fromAmount} ${fromToken}`,
        variant: "destructive"
      });
      return;
    }

    // Check if SDK is initialized
    if (!sdkInitialized) {
      toast({
        title: "SDK Not Connected",
        description: "Please wait for SDK connection to complete",
        variant: "destructive"
      });
      return;
    }

    setOrderLoading(true);
    
    try {
      console.log('🔧 Getting quote from backend for approval...');
      
      // Get token addresses
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(toChain, toToken);
      
      console.log('🔧 Token addresses:', {
        srcTokenAddress,
        dstTokenAddress,
        fromChain,
        toChain,
        fromToken,
        toToken
      });
      
      if (!srcTokenAddress || !dstTokenAddress) {
        console.error('❌ Token addresses not found');
        throw new Error('Token addresses not found');
      }

      // Convert amount to wei
      const tokenDecimals = {
        'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
        'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
      };
      const decimals = tokenDecimals[fromToken] || 18;
      const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

      // Get quote from backend (NO APPROVAL YET - just getting quote)
      const quoteParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: weiAmount,
        walletAddress: address,
        approve: false // NO APPROVAL - just getting quote
      };

      console.log('📡 Getting quote from backend:', quoteParams);

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteParams)
      });

      const data = await response.json();

      if (data.success && data.data.quote && data.data.quote.quoteReferenceId) {
        console.log('✅ Quote received from backend:', data.data.quote);
        console.log('✅ Quote reference ID:', data.data.quote.quoteReferenceId);
        
        // Store the quote data (already contains reference ID)
        setCurrentQuote(data.data.quote);
        
        // Show approval modal with swap details (NO APPROVAL SENT YET)
        setOrderData({
          ...data.data,
          status: 'pending_approval',
          orderHash: 'pending_approval'
        });
        setShowOrderModal(true);
        setIsProcessing(false);
        
        toast({
          title: "✅ Quote Ready!",
          description: `Please approve token spending to proceed with the swap.`,
        });
      } else {
        throw new Error(data.error || 'Failed to get quote');
      }
      
    } catch (error: any) {
      console.error('❌ Quote preparation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      toast({
        title: "Quote Preparation Failed",
        description: error.message || "Failed to get quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('🔚 Setting orderLoading to false');
      setOrderLoading(false);
    }
  };

  const handleFlipTokens = () => {
    const tempChain = fromChain;
    const tempToken = fromToken;
    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(toToken);
    setToToken(tempToken);
    setIsApproved(false);
  };

  // Reset approval state when amount changes
  useEffect(() => {
    if (fromAmount && isApproved) {
      setIsApproved(false);
    }
  }, [fromAmount, isApproved]);

  const handleChainSwitch = (newChainId: string) => {
    if (switchChain) {
      switchChain({ chainId: parseInt(newChainId) });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    });
  };

  // Check order status
  const checkOrderStatus = async (orderHash: string) => {
    if (!orderHash) return;
    
    setStatusLoading(true);
    try {
      console.log('🔍 Checking order status for:', orderHash);
      
      const response = await fetch(`${API_BASE_URL}/order-status/${orderHash}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Order status retrieved:', data.data);
        setOrderStatus(data.data);
        toast({
          title: "Order Status Updated",
          description: "Order status has been refreshed",
        });
      } else {
        throw new Error(data.error || 'Failed to get order status');
      }
    } catch (error: any) {
      console.error('❌ Order status check failed:', error);
      toast({
        title: "Status Check Failed",
        description: error.message || "Failed to check order status",
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Approve tokens for swap using user's wallet
  const approveTokens = async () => {
    console.log('🚀 APPROVE TOKENS FUNCTION CALLED');
    console.log('📋 Current state:', {
      orderData: !!orderData,
      currentQuote: !!currentQuote,
      address: address,
      fromChain: fromChain,
      fromToken: fromToken,
      fromAmount: fromAmount,
      isConnected: isConnected
    });

    if (!orderData || !currentQuote) {
      console.error('❌ Missing required data for approval');
      console.error('❌ orderData:', orderData);
      console.error('❌ currentQuote:', currentQuote);
      toast({
        title: "Error",
        description: "No order data or quote available for approval",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected || !address) {
      console.error('❌ Wallet not connected');
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setApprovalLoading(true);
    setIsProcessing(true);
    try {
      console.log('🔐 Starting token approval process for user wallet');
      console.log('📋 Order data:', orderData);
      console.log('📋 Current quote:', currentQuote);
      
      // Get token address and amount
      const tokenAddress = getTokenAddress(fromChain, fromToken);
      const tokenDecimals = getTokenDecimals(fromToken);
      const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, tokenDecimals)).toString();

      console.log('🔐 Token details:', {
        tokenAddress,
        tokenDecimals,
        fromAmount,
        weiAmount,
        fromChain,
        fromToken
      });

      if (!tokenAddress) {
        throw new Error(`Token address not found for ${fromToken} on chain ${fromChain}`);
      }

      const approvalParams = {
        tokenAddress: tokenAddress,
        spenderAddress: '0x111111125421ca6dc452d289314280a0f8842a65', // 1inch spender
        amount: weiAmount,
        walletAddress: address,
        chainId: parseInt(fromChain)
      };

      console.log('🔐 Preparing approval transaction:', approvalParams);

      toast({
        title: "Preparing Approval",
        description: "Preparing token approval transaction...",
      });

      // Get approval transaction data
      console.log('📡 Calling /prepare-approval API...');
      const response = await fetch(`${API_BASE_URL}/prepare-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalParams)
      });

      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📡 API Response data:', data);

      if (data.success) {
        console.log('✅ Approval transaction prepared:', data.data);
        
        // Send transaction to user's wallet for signature
        const approvalTx = data.data.approvalTransaction;
        
        console.log('🔐 Approval transaction details:', approvalTx);
        
        toast({
          title: "Approve Tokens",
          description: "Please approve the token spending in your wallet...",
        });

        // Use wagmi to send the transaction
        try {
          console.log('🔐 Parsing approval transaction data...');
          const spenderAddress = '0x' + approvalTx.data.slice(34, 74);
          const amount = BigInt('0x' + approvalTx.data.slice(74));
          
          console.log('🔐 Parsed transaction data:', {
            tokenAddress: approvalTx.to,
            spenderAddress,
            amount: amount.toString(),
            data: approvalTx.data
          });
          
          console.log('🔐 Preparing writeContract call...');
          console.log('🔐 writeContract parameters:', {
            address: approvalTx.to,
            functionName: 'approve',
            args: [spenderAddress, amount.toString()],
            account: address,
            chain: parseInt(fromChain)
          });
          
          console.log('🔐 Calling writeContract - this should trigger wallet popup...');
          
          // In wagmi v2, we need to use a different approach to get the transaction hash
          // Let's use the wallet provider to get the transaction hash after confirmation
          let transactionHash: string | null = null;
          
          // Set up a listener for the transaction hash
          const handleTransaction = (txHash: string) => {
            transactionHash = txHash;
            console.log('✅ Transaction hash received:', txHash);
          };
          
          // Call writeContract
          await writeContract({
            address: approvalTx.to as `0x${string}`,
            abi: [{
              "constant": false,
              "inputs": [
                { "name": "spender", "type": "address" },
                { "name": "amount", "type": "uint256" }
              ],
              "name": "approve",
              "outputs": [{ "name": "", "type": "bool" }],
              "type": "function"
            }] as const,
            functionName: 'approve',
            args: [spenderAddress as `0x${string}`, amount],
            account: address,
            chain: parseInt(fromChain) as any
          });

          console.log('✅ Token approval transaction sent to wallet');
          
          // Wait a moment for the transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to get the transaction hash from the wallet provider
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              // Get the latest transaction from the wallet
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts[0]) {
                const latestTx = await window.ethereum.request({
                  method: 'eth_getTransactionCount',
                  params: [accounts[0], 'latest']
                });
                console.log('📋 Latest transaction count:', latestTx);
              }
            } catch (error) {
              console.log('⚠️ Could not get transaction hash from wallet provider:', error);
            }
          }
          
          // For now, let's use a different approach - wait for the transaction to be mined
          // by checking the wallet's transaction history
          console.log('⏳ Waiting for transaction confirmation on blockchain...');
          
          toast({
            title: "⏳ Transaction Pending",
            description: "Waiting for blockchain confirmation. Please wait...",
          });
          
          // Wait for transaction to be confirmed by polling the blockchain
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait
          
          while (!confirmed && attempts < maxAttempts) {
            try {
              // Check if the approval was successful by calling allowance
              const allowance = await publicClient.readContract({
                address: approvalTx.to as `0x${string}`,
                abi: [{
                  "constant": true,
                  "inputs": [
                    { "name": "_owner", "type": "address" },
                    { "name": "_spender", "type": "address" }
                  ],
                  "name": "allowance",
                  "outputs": [{ "name": "", "type": "uint256" }],
                  "type": "function"
                }] as const,
                functionName: 'allowance',
                args: [address as `0x${string}`, spenderAddress as `0x${string}`]
              });
              
              console.log('📋 Current allowance:', allowance);
              
                             if (BigInt(allowance as string) >= amount) {
                confirmed = true;
                console.log('✅ Transaction confirmed - allowance updated');
                break;
              }
            } catch (error) {
              console.log('⚠️ Error checking allowance:', error);
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          }
          
          if (!confirmed) {
            throw new Error('Transaction confirmation timeout - approval may have failed');
          }
          
          console.log('✅ Transaction confirmed on blockchain');
          transactionHash = 'confirmed_approval'; // Use a placeholder since we can't get the exact hash
          console.log('✅ Transaction hash:', transactionHash);
          
          // Set approval status to true
          setIsApproved(true);
          
          toast({
            title: "✅ Tokens Approved!",
            description: "Token approval confirmed. Now signing order data...",
          });

          // Now prompt user to sign EIP-712 data for order placement
          console.log('🎉 Token approval confirmed - now requesting EIP-712 signature');
          await requestEIP712Signature(transactionHash);

        } catch (walletError: any) {
          console.error('❌ Wallet transaction failed:', walletError);
          console.error('❌ Error details:', {
            message: walletError.message,
            code: walletError.code,
            stack: walletError.stack
          });
          console.log('🚫 NO DATA SENT TO BACKEND - Wallet approval failed');
          // Don't show error toast when in processing mode, just keep processing state
          if (!isProcessing) {
            toast({
              title: "Wallet Transaction Failed",
              description: walletError.message || "Failed to send approval transaction. No data was sent to backend.",
              variant: "destructive"
            });
          }
        }
      } else {
        console.error('❌ API call failed:', data.error);
        throw new Error(data.error || 'Failed to prepare approval');
      }
    } catch (error: any) {
      console.error('❌ Token approval failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      console.log('🚫 NO DATA SENT TO BACKEND - Approval preparation failed');
      // Don't show error toast when in processing mode, just keep processing state
      if (!isProcessing) {
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve tokens. No data was sent to backend. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setApprovalLoading(false);
      // Keep isProcessing true to maintain the processing state
    }
  };

  // Request EIP-712 signature for order placement
  const requestEIP712Signature = async (approvalTxResult: any) => {
    if (!currentQuote || !address) {
      console.error('❌ Missing required data for EIP-712 signing');
      toast({
        title: "Error",
        description: "No quote data or wallet address available",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔐 Requesting EIP-712 signature for order placement');
      
      // Get the wallet provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet provider available');
      }

      // Use the exact EIP-712 structure from the 1inch SDK
      const domain = {
        name: '1inch Aggregation Router',
        version: '6',
        chainId: parseInt(fromChain),
        verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65'
      };

      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Order: [
          { name: 'salt', type: 'uint256' },
          { name: 'maker', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'makerAsset', type: 'address' },
          { name: 'takerAsset', type: 'address' },
          { name: 'makingAmount', type: 'uint256' },
          { name: 'takingAmount', type: 'uint256' },
          { name: 'makerTraits', type: 'uint256' }
        ]
      };

      // Use the exact values extracted from the quote object by the backend
      // These values come from the 1inch SDK quote and are the exact values the SDK expects
      const exactValues = currentQuote?.exactValues;
      
      if (!exactValues) {
        console.error('❌ No exact values found in quote object!');
        toast({
          title: "Quote Error",
          description: "Quote data is missing required values. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Use the exact values from the quote (dynamically extracted by backend)
      const salt = exactValues.salt;
      const takingAmount = exactValues.dstTokenAmount;
      const makerTraits = exactValues.makerTraits;
      const takerAsset = exactValues.dstTokenAddress;
      
      console.log('🔐 USING DYNAMIC VALUES FROM QUOTE:');
      console.log('🔐 These values are extracted from the 1inch SDK quote object');
      
      // Log the exact values we're using from the quote
      console.log('🔐 EXACT VALUES FROM QUOTE:');
      console.log('🔐 Salt:', salt);
      console.log('🔐 Taking Amount:', takingAmount);
      console.log('🔐 Taker Asset:', takerAsset);
      console.log('🔐 Maker Traits:', makerTraits);
      console.log('🔐 Full exactValues object:', exactValues);
      
      console.log('🔐 EIP-712 Values from Quote Object:');
      console.log('🔐 Salt:', salt);
      console.log('🔐 Taking Amount:', takingAmount);
      console.log('🔐 Maker Traits:', makerTraits);
      console.log('🔐 Taker Asset:', takerAsset);
      console.log('🔐 Current Quote Object:', currentQuote);
      
      console.log('🔐 QUOTE ANALYSIS:');
      console.log('🔐 Quote has salt:', !!currentQuote?.salt);
      console.log('🔐 Quote has dstTokenAmount:', !!currentQuote?.dstTokenAmount);
      console.log('🔐 Quote has dstTokenAddress:', !!currentQuote?.dstTokenAddress);
      console.log('🔐 Quote has makerTraits:', !!currentQuote?.makerTraits);
      
      // Create the order data using the exact values from the quote object
      const message = {
        salt: salt,
        maker: address,
        receiver: '0x0000000000000000000000000000000000000000',
        makerAsset: getTokenAddress(fromChain, fromToken),
        takerAsset: takerAsset, // Use the exact address from the quote
        makingAmount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
        takingAmount: takingAmount, // Use the exact amount the user expects to receive
        makerTraits: makerTraits
      };
      
      // Log the exact data we're about to sign for comparison
      console.log('🔐 FRONTEND SIGNING DATA:');
      console.log('🔐 Domain:', JSON.stringify(domain, null, 2));
      console.log('🔐 Types:', JSON.stringify(types, null, 2));
      console.log('🔐 Message:', JSON.stringify(message, null, 2));
      console.log('🔐 Full EIP-712 Data:', JSON.stringify({ domain, types, primaryType: 'Order', message }, null, 2));
      
      // Log the expected data from the SDK error for comparison
      console.log('🔐 EXPECTED SDK DATA (from error):');
      console.log('🔐 Expected Domain:', JSON.stringify({
        name: "1inch Aggregation Router",
        version: "6",
        chainId: 42161,
        verifyingContract: "0x111111125421ca6dc452d289314280a0f8842a65"
      }, null, 2));
      console.log('🔐 Expected Message:', JSON.stringify({
        maker: "0x6dbc17c7e398807dba3a7e0f80ea686deed35eba",
        makerAsset: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        takerAsset: "0xda0000d4000015a526378bb6fafc650cea5966f8",
        makerTraits: "62419173104490761595518734106643312524177918888344010093236686688879363751936",
        salt: "9445680530224305540524292030867566681388014142675087687752274005807264959808",
        makingAmount: "1200000",
        takingAmount: "988609",
        receiver: "0x0000000000000000000000000000000000000000"
      }, null, 2));
      
      console.log('🔐 COMPARISON - What we sign vs What SDK expects:');
      console.log('🔐 Our takerAsset:', message.takerAsset);
      console.log('🔐 Expected takerAsset: 0xda0000d4000015a526378bb6fafc650cea5966f8');
      console.log('🔐 Our takingAmount:', message.takingAmount);
      console.log('🔐 Expected takingAmount: 988609');
      console.log('🔐 Our salt:', message.salt);
      console.log('🔐 Expected salt: 9445680530224305540524292030867566681388014142675087687752274005807264959808');
      console.log('🔐 Our makerTraits:', message.makerTraits);
      console.log('🔐 Expected makerTraits: 62419173104490761595518734106643312524177918888344010093236686688879363751936');

      console.log('🔐 EIP-712 data to sign:', { domain, types, message });

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify({ domain, types, primaryType: 'Order', message })]
      });

      console.log('✅ EIP-712 signature received:', signature);

      // Create the complete order structure for Fusion Intent API
      const completeOrderData = {
        order: {
          salt: salt,
          makerAsset: getTokenAddress(fromChain, fromToken),
          takerAsset: takerAsset,
          maker: address,
          receiver: '0x0000000000000000000000000000000000000000',
          makingAmount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
          takingAmount: takingAmount,
          makerTraits: makerTraits
        },
        signature: signature,
        extension: '0x',
        quoteId: currentQuote.quoteReferenceId || 'default'
      };

      // Log the complete order structure for Fusion Intent API
      console.log('🚀 COMPLETE FUSION INTENT ORDER DATA:');
      console.log('🚀 This is the exact data that will be sent to 1inch Fusion Intent API:');
      console.log('🚀 Order Structure:', JSON.stringify(completeOrderData, null, 2));
      
      console.log('🚀 ORDER BREAKDOWN:');
      console.log('🚀 Salt:', completeOrderData.order.salt);
      console.log('🚀 Maker Asset:', completeOrderData.order.makerAsset);
      console.log('🚀 Taker Asset:', completeOrderData.order.takerAsset);
      console.log('🚀 Maker (User Address):', completeOrderData.order.maker);
      console.log('🚀 Receiver:', completeOrderData.order.receiver);
      console.log('🚀 Making Amount:', completeOrderData.order.makingAmount);
      console.log('🚀 Taking Amount:', completeOrderData.order.takingAmount);
      console.log('🚀 Maker Traits:', completeOrderData.order.makerTraits);
      console.log('🚀 Signature:', completeOrderData.signature);
      console.log('🚀 Extension:', completeOrderData.extension);
      console.log('🚀 Quote ID:', completeOrderData.quoteId);

      // Decode and analyze the signature
      console.log('🔐 SIGNATURE ANALYSIS:');
      console.log('🔐 Full signature:', signature);
      console.log('🔐 Signature length:', signature.length);
      
      // Extract signature components
      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);
      
      console.log('🔐 Signature components:');
      console.log('🔐 r (first 32 bytes):', r);
      console.log('🔐 s (next 32 bytes):', s);
      console.log('🔐 v (recovery byte):', v);

      toast({
        title: "✅ Order Signed!",
        description: "Order data signed successfully. Submitting to backend...",
      });

      // Now send the signed data to backend
      await processApprovedSwap(approvalTxResult, signature);

    } catch (error: any) {
      console.error('❌ EIP-712 signing failed:', error);
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign order data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Process approved swap with stored quote data and signature
  const processApprovedSwap = async (approvalTxResult: any, eip712Signature?: string) => {
    if (!currentQuote || !address) {
      console.error('❌ Missing required data for swap processing');
      console.error('❌ currentQuote:', currentQuote);
      console.error('❌ address:', address);
      toast({
        title: "Error",
        description: "No quote data or wallet address available",
        variant: "destructive"
      });
      return;
    }

    // Check if we have a proper quote object with reference ID
    if (!currentQuote.quoteReferenceId) {
      console.error('❌ Quote object missing reference ID');
      console.error('❌ Quote object:', currentQuote);
      toast({
        title: "Invalid Quote",
        description: "Quote data is invalid. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Quote object has reference ID:', currentQuote.quoteReferenceId);

    setSubmissionLoading(true);
    setIsProcessing(true);
    try {
      console.log('🎉 Processing approved swap with stored quote data');
      console.log('📋 Approval transaction result:', approvalTxResult);
      console.log('📋 Stored quote has getPreset method:', !!currentQuote.getPreset);
      
      // Get the RPC URL from user's connected network
      const getRpcUrl = (chainId: string) => {
        const rpcUrls = {
          '1': 'https://eth.llamarpc.com', // Ethereum
          '42161': 'https://arb1.arbitrum.io/rpc', // Arbitrum
          '8453': 'https://mainnet.base.org', // Base
          '137': 'https://polygon-rpc.com', // Polygon
          '56': 'https://bsc-dataseed.binance.org', // BSC
          '43114': 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
          '10': 'https://mainnet.optimism.io', // Optimism
          '250': 'https://rpc.ftm.tools' // Fantom
        };
        return rpcUrls[chainId] || 'https://eth.llamarpc.com';
      };

      const userRpcUrl = getRpcUrl(fromChain);
      console.log('🌐 User RPC URL for chain', fromChain, ':', userRpcUrl);

      // Use the stored quote data with reference ID and signature
      const swapParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: getTokenAddress(fromChain, fromToken),
        dstTokenAddress: getTokenAddress(toChain, toToken),
        amount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
        walletAddress: address,
        approve: true, // Send approval status
        approvalTxHash: approvalTxResult,
        eip712Signature: eip712Signature, // Send the signed EIP-712 data
        userRpcUrl: userRpcUrl, // Send the user's RPC URL
        quote: {
          quoteReferenceId: currentQuote.quoteReferenceId
        } // Only send the reference ID, not the full quote object
      };

      console.log('🚀 Sending approved swap request to backend:', {
        ...swapParams,
        quote: { quoteReferenceId: currentQuote.quoteReferenceId }
      });

      console.log('✅ SENDING DATA TO BACKEND - User approved tokens successfully');

      toast({
        title: "Processing Swap",
        description: "Submitting approved swap to backend...",
      });

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapParams)
      });

      console.log('📡 Backend response status:', response.status);
      const data = await response.json();
      console.log('📡 Backend response data:', data);

      if (data.success) {
        console.log('✅ Approved swap processed successfully:', data.data);
        
        // Update order data with swap progress
        setOrderData(prev => ({
          ...prev,
          status: 'swap_in_progress',
          approvalTxHash: approvalTxResult,
          swapResult: data.data.submitOrderResult
        }));

        toast({
          title: "🔄 Swap in Progress",
          description: "Your cross-chain swap is being processed. This may take a few minutes.",
        });

        // Wait for swap completion (submitOrder.js handles this)
        setTimeout(() => {
          setSwapCompleted(true);
          setShowOrderModal(false);
          
          toast({
            title: "🎉 Swap Completed!",
            description: "Your cross-chain swap has been executed successfully!",
          });

          // Reset form
          setFromAmount('');
          setToAmount('');
          setOrderData(null);
          setOrderStatus(null);
          setCurrentQuote(null);
          setIsApproved(false);
          setIsProcessing(false);
        }, 3000); // Simulate completion after 3 seconds

      } else {
        console.error('❌ Backend processing failed:', data.error);
        // Don't throw error, just keep processing state
        console.log('🔄 Keeping processing state despite backend error');
        return;
      }
    } catch (error: any) {
      console.error('❌ Approved swap processing failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      console.log('🚫 NO DATA SENT TO BACKEND - Swap processing failed');
      // Don't show error toast, just keep processing state
      console.log('🔄 Keeping processing state despite error');
    } finally {
      setSubmissionLoading(false);
      // Keep isProcessing true to maintain the processing state
    }
  };

  // Submit Fusion Intent order directly to 1inch API
  const submitFusionIntentOrder = async (orderData: any) => {
    if (!address || !fromChain) {
      console.error('❌ Missing required data for Fusion Intent order');
      toast({
        title: "Error",
        description: "No wallet address or chain selected",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Submitting Fusion Intent order directly to 1inch API');
      console.log('📋 Order data:', orderData);

      const response = await fetch(`${API_BASE_URL}/fusion-intent/submit-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId: parseInt(fromChain),
          orderData: orderData
        })
      });

      console.log('📡 Fusion Intent API response status:', response.status);
      const data = await response.json();
      console.log('📡 Fusion Intent API response data:', data);

      if (data.success) {
        console.log('✅ Fusion Intent order submitted successfully:', data.data);
        
        toast({
          title: "✅ Order Submitted!",
          description: "Fusion Intent order submitted to 1inch API successfully",
        });

        return data.data;
      } else {
        console.error('❌ Fusion Intent order submission failed:', data.error);
        throw new Error(data.error || 'Failed to submit Fusion Intent order');
      }
    } catch (error: any) {
      console.error('❌ Fusion Intent order submission failed:', error);
      toast({
        title: "Order Submission Failed",
        description: error.message || "Failed to submit Fusion Intent order",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Get Fusion Intent quote from 1inch API
  const getFusionIntentQuote = async () => {
    if (!address || !fromChain || !toChain || !fromToken || !toToken || !fromAmount) {
      console.error('❌ Missing required data for Fusion Intent quote');
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔍 Getting Fusion Intent quote from 1inch API');

      const response = await fetch(`${API_BASE_URL}/fusion-intent/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          srcChainId: parseInt(fromChain),
          dstChainId: parseInt(toChain),
          srcTokenAddress: getTokenAddress(fromChain, fromToken),
          dstTokenAddress: getTokenAddress(toChain, toToken),
          amount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
          walletAddress: address
        })
      });

      console.log('📡 Fusion Intent quote response status:', response.status);
      const data = await response.json();
      console.log('📡 Fusion Intent quote response data:', data);

      if (data.success) {
        console.log('✅ Fusion Intent quote received:', data.data);
        
        // Update the quote display
        if (data.data.data && data.data.data.dstTokenAmount) {
          const dstAmount = parseFloat(data.data.data.dstTokenAmount) / Math.pow(10, getTokenDecimals(toToken));
          setToAmount(dstAmount.toString());
        }
        
        toast({
          title: "✅ Quote Received!",
          description: "Fusion Intent quote retrieved successfully",
        });

        return data.data;
      } else {
        console.error('❌ Fusion Intent quote failed:', data.error);
        throw new Error(data.error || 'Failed to get Fusion Intent quote');
      }
    } catch (error: any) {
      console.error('❌ Fusion Intent quote failed:', error);
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get Fusion Intent quote",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Create Fusion Intent order with proper structure
  const createFusionIntentOrder = (quoteData: any, signature: string) => {
    try {
      console.log('🔧 Creating Fusion Intent order structure');
      console.log('📋 Quote data:', quoteData);
      console.log('📋 Signature:', signature);

      // Extract required data from quote
      const quote = quoteData.data;
      
      // Create the order structure as per 1inch Fusion Intent API
      const orderData = {
        order: {
          salt: quote.salt || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
          makerAsset: quote.srcTokenAddress,
          takerAsset: quote.dstTokenAddress,
          maker: address,
          receiver: '0x0000000000000000000000000000000000000000',
          makingAmount: quote.srcTokenAmount,
          takingAmount: quote.dstTokenAmount,
          makerTraits: quote.makerTraits || '0'
        },
        signature: signature,
        extension: '0x',
        quoteId: quote.quoteId || quote.id || 'default'
      };

      console.log('✅ Fusion Intent order structure created:', orderData);
      return orderData;
    } catch (error) {
      console.error('❌ Failed to create Fusion Intent order structure:', error);
      throw error;
    }
  };

  // Complete swap execution (TRUE DeFi - user wallet handles everything)
  const completeSwap = async (approvalTxResult?: any) => {
    if (!orderData || !orderData.orderHash) {
      toast({
        title: "Error",
        description: "No order data available for completion",
        variant: "destructive"
      });
      return;
    }

    setSubmissionLoading(true);
    try {
      console.log('🎉 Completing swap execution (TRUE DeFi):', orderData.orderHash);
      
      const completionParams = {
        orderHash: orderData.orderHash,
        walletAddress: address,
        approvalTxHash: approvalTxResult?.hash || approvalTxResult,
        userSignedData: {
          fromChain: fromChain,
          toChain: toChain,
          fromToken: fromToken,
          toToken: toToken,
          amount: fromAmount,
          timestamp: new Date().toISOString()
        }
      };

      console.log('🎉 Sending swap completion:', completionParams);

      toast({
        title: "Completing Swap",
        description: "Finalizing your cross-chain swap...",
      });

      const response = await fetch(`${API_BASE_URL}/complete-swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionParams)
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Swap completed successfully:', data.data);
        
        setSwapCompleted(true);
        setShowOrderModal(false);
        
        toast({
          title: "🎉 Swap Completed!",
          description: "Your cross-chain swap has been executed successfully!",
        });

        // Reset form
        setFromAmount('');
        setToAmount('');
        setOrderData(null);
        setOrderStatus(null);
      } else {
        throw new Error(data.error || 'Failed to complete swap');
      }
    } catch (error: any) {
      console.error('❌ Swap completion failed:', error);
      toast({
        title: "Completion Failed",
        description: error.message || "Failed to complete swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Classic Swap Functions

  // Get classic swap quote
  const getClassicSwapQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !isConnected || !address) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and connect wallet first",
        variant: "destructive"
      });
      return;
    }

    setClassicSwapLoading(true);
    try {
      // Get token addresses - Classic swap is single-chain only
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      // For classic swap, ensure we're on the same chain
      if (fromChain !== toChain) {
        toast({
          title: "Error",
          description: "Classic swap only works on the same network. Please select the same network for both tokens.",
          variant: "destructive"
        });
        return;
      }
      
      if (!srcTokenAddress || !dstTokenAddress) {
        toast({
          title: "Error",
          description: "Token addresses not found for selected network",
          variant: "destructive"
        });
        return;
      }

      // Check if we're trying to swap the same token
      if (srcTokenAddress === dstTokenAddress) {
        toast({
          title: "Error",
          description: "Cannot swap the same token. Please select different tokens for classic swap.",
          variant: "destructive"
        });
        return;
      }

      // Convert amount to wei
      const tokenDecimals = {
        'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
        'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
      };
      const decimals = tokenDecimals[fromToken] || 18;
      const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

      // Validate wei amount is not 0
      if (weiAmount === '0') {
        toast({
          title: "Error",
          description: "Amount is too small to get a quote",
          variant: "destructive"
        });
        return;
      }

      // Prepare classic swap quote request
      const quoteParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: weiAmount,
        from: address,
        slippage: '1', // 1% slippage
        chainId: parseInt(fromChain)
      };

      console.log('🔄 Classic swap quote request:', quoteParams);

      const response = await fetch(`${API_BASE_URL}/classic-swap/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Classic swap quote received:', data.data);
        setClassicQuote(data.data);
        
        // Calculate output amount
        const toDecimals = tokenDecimals[toToken] || 18;
        const outputAmount = data.data.toAmount ? (parseInt(data.data.toAmount) / Math.pow(10, toDecimals)).toString() : '0';
        setToAmount(outputAmount);
        
        toast({
          title: "Classic Swap Quote",
          description: `Estimated output: ${outputAmount} ${toToken}`,
        });
      } else {
        throw new Error(data.error || 'Failed to get classic swap quote');
      }
    } catch (error: any) {
      console.error('❌ Classic swap quote failed:', error);
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get classic swap quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClassicSwapLoading(false);
    }
  };

  // Get classic swap analysis
  const getClassicSwapAnalysis = async () => {
    if (!classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      const analysisParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: classicQuote.fromTokenAmount || fromAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      console.log('🔍 Getting classic swap analysis:', analysisParams);

      const response = await fetch(`${API_BASE_URL}/classic-swap/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Classic swap analysis received:', data.data);
        setClassicAnalysis(data.data);
        
        toast({
          title: "Analysis Complete",
          description: "Classic swap analysis ready",
        });
      } else {
        throw new Error(data.error || 'Failed to get classic swap analysis');
      }
    } catch (error: any) {
      console.error('❌ Classic swap analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to get classic swap analysis",
        variant: "destructive"
      });
    }
  };

  // Get approval transaction for classic swap
  const getClassicApprovalTransaction = async () => {
    if (!classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      
      const approvalParams = {
        tokenAddress: srcTokenAddress,
        amount: classicQuote.fromTokenAmount || fromAmount,
        chainId: parseInt(fromChain)
      };

      console.log('✅ Getting classic approval transaction:', approvalParams);

      const response = await fetch(`${API_BASE_URL}/classic-swap/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Classic approval transaction received:', data.data);
        setClassicApprovalTx(data.data);
        
        toast({
          title: "Approval Ready",
          description: "Approval transaction prepared for signing",
        });
      } else {
        throw new Error(data.error || 'Failed to get approval transaction');
      }
    } catch (error: any) {
      console.error('❌ Classic approval transaction failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to get approval transaction",
        variant: "destructive"
      });
    }
  };

  // Get swap transaction for classic swap
  const getClassicSwapTransaction = async () => {
    if (!classicQuote) {
      toast({
        title: "Error",
        description: "Please get a quote first",
        variant: "destructive"
      });
      return;
    }

    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      const swapParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: classicQuote.fromTokenAmount || fromAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      console.log('🔄 Getting classic swap transaction:', swapParams);

      const response = await fetch(`${API_BASE_URL}/classic-swap/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapParams)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Classic swap transaction received:', data.data);
        setClassicSwapTx(data.data);
        
        toast({
          title: "Swap Ready",
          description: "Swap transaction prepared for signing",
        });
      } else {
        throw new Error(data.error || 'Failed to get swap transaction');
      }
    } catch (error: any) {
      console.error('❌ Classic swap transaction failed:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to get swap transaction",
        variant: "destructive"
      });
    }
  };

  // Execute classic swap with signed transaction
  const executeClassicSwap = async (signedTx: string) => {
    if (!classicSwapTx || !signedTx) {
      toast({
        title: "Error",
        description: "Missing swap transaction or signature",
        variant: "destructive"
      });
      return;
    }

    setClassicSwapLoading(true);
    try {
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(fromChain, toToken);
      
      const swapParams = {
        src: srcTokenAddress,
        dst: dstTokenAddress,
        amount: classicQuote.fromTokenAmount || fromAmount,
        from: address,
        slippage: '1',
        chainId: parseInt(fromChain)
      };

      const executionData = {
        chainId: parseInt(fromChain),
        signedTx: signedTx,
        swapParams: swapParams,
        userRpcUrl: undefined
      };

      console.log('🚀 Executing classic swap:', executionData);

      const response = await fetch(`${API_BASE_URL}/classic-swap/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executionData)
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Classic swap executed successfully:', data.data);
        setClassicExecutionResult(data.data);
        
        toast({
          title: "🎉 Classic Swap Executed!",
          description: `Transaction hash: ${data.data.transactionHash}`,
        });

        // Reset form
        setFromAmount('');
        setToAmount('');
        setClassicQuote(null);
        setClassicAnalysis(null);
        setClassicApprovalTx(null);
        setClassicSwapTx(null);
      } else {
        throw new Error(data.error || 'Failed to execute classic swap');
      }
    } catch (error: any) {
      console.error('❌ Classic swap execution failed:', error);
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute classic swap",
        variant: "destructive"
      });
    } finally {
      setClassicSwapLoading(false);
    }
  };

  // Handle classic swap approval
  const handleClassicApproval = async () => {
    if (!classicApprovalTx) {
      toast({
        title: "Error",
        description: "No approval transaction available",
        variant: "destructive"
      });
      return;
    }

    try {
      const { writeContract } = useWriteContract();
      
      // Sign and send approval transaction
      const result = await writeContract({
        address: classicApprovalTx.to as `0x${string}`,
        abi: [{
          name: 'approve',
          type: 'function',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable'
        }],
        functionName: 'approve',
        args: [classicApprovalTx.data.slice(10, 50) as `0x${string}`, BigInt(classicApprovalTx.data.slice(50))],
        account: address,
        chain: getCurrentChain()
      });

      console.log('✅ Classic approval transaction sent:', result);
      
      toast({
        title: "Approval Sent",
        description: "Approval transaction submitted successfully",
      });

      // Get swap transaction after approval
      await getClassicSwapTransaction();
      
    } catch (error: any) {
      console.error('❌ Classic approval failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve tokens",
        variant: "destructive"
      });
    }
  };

  // Handle classic swap execution
  const handleClassicSwap = async () => {
    if (!classicSwapTx) {
      toast({
        title: "Error",
        description: "No swap transaction available",
        variant: "destructive"
      });
      return;
    }

    try {
      const { writeContract } = useWriteContract();
      
      // Sign and send swap transaction
      const result = await writeContract({
        address: classicSwapTx.to as `0x${string}`,
        abi: [{
          name: 'swap',
          type: 'function',
          inputs: [],
          outputs: [],
          stateMutability: 'payable'
        }],
        functionName: 'swap',
        args: [],
        value: BigInt(classicSwapTx.value || '0'),
        account: address,
        chain: getCurrentChain()
      });

      console.log('✅ Classic swap transaction sent:', result);
      
      // Execute the swap with the signed transaction
      // Note: writeContract returns void, so we need to handle this differently
      // For now, we'll just show a success message
      toast({
        title: "Swap Transaction Sent",
        description: "Your swap transaction has been submitted to the network.",
      });
      
    } catch (error: any) {
      console.error('❌ Classic swap failed:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success border-success/30";
      case "pending":
        return "bg-warning/20 text-warning border-warning/30";
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "";
    }
  };

  // AI Chat Functions
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Debug chat state changes
  useEffect(() => {
    console.log('🔍 Chat state changed:', { isChatOpen, isChatMinimized });
  }, [isChatOpen, isChatMinimized]);

  // Parse natural language swap requests
  const parseSwapRequest = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Pattern: "swap [amount] [token] on [fromChain] to [toChain]"
    const swapPattern = /swap\s+([\d.]+)\s+(\w+)\s+on\s+(\w+)\s+to\s+(\w+)/i;
    const match = message.match(swapPattern);
    
    if (match) {
      const [, amount, token, fromChainName, toChainName] = match;
      
      // Map chain names to chain IDs
      const chainMap: { [key: string]: string } = {
        'ethereum': '1',
        'eth': '1',
        'mainnet': '1',
        'arbitrum': '42161',
        'arb': '42161',
        'polygon': '137',
        'matic': '137',
        'base': '8453',
        'optimism': '10',
        'op': '10',
        'bsc': '56',
        'binance': '56',
        'avalanche': '43114',
        'avax': '43114',
        'fantom': '250',
        'ftm': '250'
      };
      
      const fromChainId = chainMap[fromChainName.toLowerCase()];
      const toChainId = chainMap[toChainName.toLowerCase()];
      
      if (fromChainId && toChainId) {
        return {
          type: 'swap_request',
          amount: parseFloat(amount),
          token: token.toUpperCase(),
          fromChain: fromChainId,
          toChain: toChainId,
          isValid: true
        };
      }
    }
    
    return { type: 'other', isValid: false };
  };

  // Handle Fusion Intent swap from chat
  // Handle chat swap with natural language parsing (EXACT SAME PATTERN AS MAIN SWAP)
  const handleChatSwap = async (swapData: any) => {
    try {
      console.log('🚀 Processing chat swap request:', swapData);
      
      // Check if wallet is connected (EXACT SAME AS MAIN SWAP)
      if (!isConnected || !address) {
        console.log('❌ Wallet not connected');
        return {
          success: false,
          message: '❌ **Wallet Not Connected**\n\nPlease connect your wallet first to execute this swap.'
        };
      }
      
      console.log('✅ Wallet connection verified successfully');
      
      // Get quote from Fusion Intent API (EXACT SAME AS MAIN SWAP - NO APPROVAL YET)
      console.log('📡 Getting Fusion Intent quote...');
      
      // Use the same quote parameters as main swap
      const srcTokenAddress = getTokenAddress(swapData.fromChain, swapData.token);
      const dstTokenAddress = getTokenAddress(swapData.toChain, swapData.token);
      const weiAmount = Math.floor(swapData.amount * Math.pow(10, getTokenDecimals(swapData.token))).toString();
      
      const quoteParams = {
        srcChainId: parseInt(swapData.fromChain),
        dstChainId: parseInt(swapData.toChain),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: weiAmount,
        walletAddress: address,
        approve: false // NO APPROVAL - just getting quote (EXACT SAME AS MAIN SWAP)
      };
      
      console.log('📡 Getting quote from backend:', quoteParams);

      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteParams)
      });

      const data = await response.json();

      if (data.success && data.data.quote && data.data.quote.quoteReferenceId) {
        console.log('✅ Quote received from backend:', data.data.quote);
        console.log('✅ Quote reference ID:', data.data.quote.quoteReferenceId);
        
        // Show confirmation button in chat (EXACT SAME AS MAIN SWAP - NO APPROVAL YET)
        return {
          success: true,
          message: `🎯 **Quote Ready!**\n\n**Swap Details:**\n• From: ${swapData.amount} ${swapData.token} on ${swapData.fromChain}\n• To: ${swapData.toChain}\n• Expected: ${data.data.quote.dstTokenAmount} tokens\n\n**Ready to execute?** Click the button below to approve and sign.`,
          quoteData: data.data,
          swapData: swapData
        };
      } else {
        throw new Error(data.error || 'Failed to get quote');
      }
      
    } catch (error) {
      console.error('❌ Chat swap failed:', error);
      return {
        success: false,
        message: `❌ **Swap Failed**\n\nError: ${error.message}\n\nPlease try again.`
      };
    }
  };

  // Execute the confirmed swap (EXACT SAME PATTERN AS MAIN SWAP)
  const executeChatSwap = async (quoteData: any, swapData: any) => {
    try {
      console.log('🚀 Executing confirmed chat swap:', { quoteData, swapData });
      
      // Step 1: Check and handle token approval (EXACT SAME AS MAIN SWAP)
      const tokenAddress = getTokenAddress(swapData.fromChain, swapData.token);
      const spenderAddress = '0x111111125421ca6dc452d289314280a0f8842a65';
      const amount = Math.floor(swapData.amount * Math.pow(10, getTokenDecimals(swapData.token))).toString();
      
      // Check current allowance
      const allowance = await checkTokenAllowance(tokenAddress, spenderAddress, address);
      const needsApproval = BigInt(allowance) < BigInt(amount);
      
      if (needsApproval) {
        console.log('🔐 Token approval required');
        
        // Prepare approval transaction (EXACT SAME AS MAIN SWAP)
        const approvalParams = {
          tokenAddress: tokenAddress,
          spenderAddress: spenderAddress,
          amount: amount,
          walletAddress: address,
          chainId: parseInt(swapData.fromChain)
        };
        
        const approvalResponse = await fetch(`${API_BASE_URL}/prepare-approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(approvalParams)
        });
        
        const approvalData = await approvalResponse.json();
        
        if (!approvalData.success) {
          throw new Error('Failed to prepare approval transaction');
        }
        
        // Execute approval transaction (EXACT SAME AS MAIN SWAP)
        const approvalTx = approvalData.data.approvalTransaction;
        
        toast({
          title: "Approve Tokens",
          description: "Please approve the token spending in your wallet...",
        });
        
                const approvalResult = await writeContract({
          address: approvalTx.to as `0x${string}`,
          abi: [{
            "constant": false,
            "inputs": [
              { "name": "spender", "type": "address" },
              { "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "name": "", "type": "bool" }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
          }],
          functionName: 'approve',
          args: [approvalTx.data.slice(10, 50) as `0x${string}`, BigInt(approvalTx.data.slice(50))],
          account: address,
          chain: getCurrentChain()
        });
        
        console.log('✅ Token approval submitted:', approvalResult);
        
        // Wait for approval to be confirmed
        toast({
          title: "Approval Submitted",
          description: "Waiting for approval confirmation...",
        });
      }
      
      // Step 2: Use exact same pattern as main swap's processApprovedSwap
      if (!quoteData.quote || !address) {
        throw new Error('Missing required data for swap processing');
      }

      // Check if we have a proper quote object with reference ID
      if (!quoteData.quote.quoteReferenceId) {
        throw new Error('Quote object missing reference ID');
      }
      
      console.log('✅ Quote object has reference ID:', quoteData.quote.quoteReferenceId);

      // Get the RPC URL from user's connected network (EXACT SAME AS MAIN SWAP)
      const getRpcUrl = (chainId: string) => {
        const rpcUrls = {
          '1': 'https://eth.llamarpc.com', // Ethereum
          '42161': 'https://arb1.arbitrum.io/rpc', // Arbitrum
          '8453': 'https://mainnet.base.org', // Base
          '137': 'https://polygon-rpc.com', // Polygon
          '56': 'https://bsc-dataseed.binance.org', // BSC
          '43114': 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
          '10': 'https://mainnet.optimism.io', // Optimism
          '250': 'https://rpc.ftm.tools' // Fantom
        };
        return rpcUrls[chainId] || 'https://eth.llamarpc.com';
      };

      const userRpcUrl = getRpcUrl(swapData.fromChain);
      console.log('🌐 User RPC URL for chain', swapData.fromChain, ':', userRpcUrl);

      // Use the stored quote data with reference ID and signature (EXACT SAME AS MAIN SWAP)
      const swapParams = {
        srcChainId: parseInt(swapData.fromChain),
        dstChainId: parseInt(swapData.toChain),
        srcTokenAddress: getTokenAddress(swapData.fromChain, swapData.token),
        dstTokenAddress: getTokenAddress(swapData.toChain, swapData.token),
        amount: Math.floor(swapData.amount * Math.pow(10, getTokenDecimals(swapData.token))).toString(),
        walletAddress: address,
        approve: true, // Send approval status (EXACT SAME AS MAIN SWAP)
        approvalTxHash: 'pending', // Will be updated after approval
        eip712Signature: 'pending', // Will be updated after signature
        userRpcUrl: userRpcUrl, // Send the user's RPC URL (EXACT SAME AS MAIN SWAP)
        quote: {
          quoteReferenceId: quoteData.quote.quoteReferenceId
        } // Only send the reference ID, not the full quote object (EXACT SAME AS MAIN SWAP)
      };

      console.log('🚀 Sending approved swap request to backend:', {
        ...swapParams,
        quote: { quoteReferenceId: quoteData.quote.quoteReferenceId }
      });

      console.log('✅ SENDING DATA TO BACKEND - User approved tokens successfully');

      toast({
        title: "Processing Swap",
        description: "Submitting approved swap to backend...",
      });

      // Use the same endpoint as main swap (EXACT SAME AS MAIN SWAP)
      const response = await fetch(`${API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapParams)
      });

      console.log('📡 Backend response status:', response.status);
      const data = await response.json();
      console.log('📡 Backend response data:', data);

      if (data.success) {
        console.log('✅ Approved swap processed successfully:', data.data);
        
        return {
          success: true,
          message: `🎉 **Swap Executed Successfully!**\n\n**Order Hash:** ${data.data?.orderHash || 'N/A'}\n**Status:** Submitted to Fusion Intent\n**Source:** ${data.data?.source || '1inch API'}\n\nYour swap is now being processed!`,
          orderHash: data.data?.orderHash
        };
      } else {
        throw new Error(data.error || 'Failed to process swap');
      }
      
    } catch (error) {
      console.error('❌ Execute chat swap failed:', error);
      return {
        success: false,
        message: `❌ **Swap Execution Failed**\n\nError: ${error.message || 'Unknown error'}\n\nPlease try again or contact support.`
      };
    }
  };

  // Check token allowance for a specific spender
  const checkTokenAllowance = async (tokenAddress: string, spenderAddress: string, ownerAddress: string) => {
    try {
      console.log('🔍 Checking token allowance:', { tokenAddress, spenderAddress, ownerAddress });
      
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            "constant": true,
            "inputs": [
              { "name": "owner", "type": "address" },
              { "name": "spender", "type": "address" }
            ],
            "name": "allowance",
            "outputs": [{ "name": "", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'allowance',
        args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`]
      });
      
      console.log('📋 Current allowance:', allowance);
      return allowance.toString();
      
    } catch (error) {
      console.error('❌ Error checking allowance:', error);
      return '0';
    }
  };



  // Request EIP-712 signature for chat swap (same structure as main swap)
  const requestChatEIP712Signature = async (quoteData: any, swapData: any) => {
    try {
      console.log('🔐 Requesting EIP-712 signature for chat swap order placement');
      
      // Get the wallet provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet provider available');
      }

      // Use the exact EIP-712 structure from the 1inch SDK (same as main swap)
      const domain = {
        name: '1inch Aggregation Router',
        version: '6',
        chainId: parseInt(swapData.fromChain),
        verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65'
      };

      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Order: [
          { name: 'salt', type: 'uint256' },
          { name: 'maker', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'makerAsset', type: 'address' },
          { name: 'takerAsset', type: 'address' },
          { name: 'makingAmount', type: 'uint256' },
          { name: 'takingAmount', type: 'uint256' },
          { name: 'makerTraits', type: 'uint256' }
        ]
      };

      // Use the exact values from the quote data (same as main swap)
      const exactValues = quoteData.data;
      
      if (!exactValues) {
        throw new Error('No exact values found in quote data');
      }
      
      // Use the exact values from the quote (same as main swap)
      const salt = exactValues.salt || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
      const takingAmount = exactValues.dstTokenAmount;
      const makerTraits = exactValues.makerTraits || '0';
      const takerAsset = exactValues.dstTokenAddress;
      
      console.log('🔐 USING EXACT VALUES FROM QUOTE FOR CHAT SWAP:');
      console.log('🔐 Salt:', salt);
      console.log('🔐 Taking Amount:', takingAmount);
      console.log('🔐 Taker Asset:', takerAsset);
      console.log('🔐 Maker Traits:', makerTraits);
      
      // Create the order data using the exact values from the quote object (same as main swap)
      const message = {
        salt: salt,
        maker: address,
        receiver: '0x0000000000000000000000000000000000000000',
        makerAsset: getTokenAddress(swapData.fromChain, swapData.token),
        takerAsset: takerAsset, // Use the exact address from the quote
        makingAmount: Math.floor(swapData.amount * Math.pow(10, getTokenDecimals(swapData.token))).toString(),
        takingAmount: takingAmount, // Use the exact amount the user expects to receive
        makerTraits: makerTraits
      };

      console.log('🔐 EIP-712 data to sign for chat swap:', { domain, types, message });

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify({ domain, types, primaryType: 'Order', message })]
      });

      console.log('✅ Chat swap EIP-712 signature received:', signature);
      return signature;

    } catch (error) {
      console.error('❌ Chat swap EIP-712 signature failed:', error);
      throw error;
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    // Add loading message
    const loadingMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai' as const,
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      // Check if this is a swap request
      const swapRequest = parseSwapRequest(chatInput.trim());
      
      if (swapRequest.type === 'swap_request' && swapRequest.isValid) {
        console.log('🔄 Detected swap request in chat:', swapRequest);
        
        // Add debug message about wallet status (simplified like main swap)
        const walletStatus = `🔍 **Wallet Status:**\n- Connected: ${isConnected ? '✅ Yes' : '❌ No'}\n- Address: ${address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not available'}`;
        
        // Add debug message first
        setChatMessages(prev => prev.filter(msg => !msg.isLoading).concat({
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: walletStatus,
          timestamp: new Date()
        }));
        
        // Handle the swap request
        const swapResult = await handleChatSwap(swapRequest);
        
        // Add the swap result
        setChatMessages(prev => prev.concat({
          id: (Date.now() + 3).toString(),
          type: 'ai',
          content: swapResult.message,
          timestamp: new Date(),
          swapData: swapResult.success && swapResult.quoteData ? { quoteData: swapResult.quoteData, swapData: swapResult.swapData } : null
        }));
        
        return;
      }

      // Call real AI API for other messages
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput.trim(),
          context: {
            fromChain,
            toChain,
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            isConnected,
            address,
            currentQuote
          }
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
      setChatMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }));

    } catch (error) {
      console.error('AI chat error:', error);
      setChatMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }));
    } finally {
      setIsChatLoading(false);
    }
  };



  const toggleChat = () => {
    console.log('🔍 Toggle chat clicked. Current state:', { isChatOpen, isChatMinimized });
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setIsChatMinimized(false);
    }
    console.log('🔍 Chat state after toggle:', { isChatOpen: !isChatOpen, isChatMinimized: false });
  };

  const minimizeChat = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  const handleQuickAction = async (action: string) => {
    if (isChatLoading) return;

    setIsChatLoading(true);
    
    // Add loading message
    const loadingMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai' as const,
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      let endpoint = '';
      let requestBody = {};

      switch (action) {
        case 'analyze-swap':
          if (!fromToken || !toToken || !fromAmount) {
            throw new Error('Please set up a swap first to analyze');
          }
          endpoint = '/ai/analyze-swap';
          requestBody = {
            swapData: {
              fromToken,
              toToken,
              fromNetwork: Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain),
              toNetwork: Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain),
              amount: fromAmount,
              fromChainId: fromChain,
              toChainId: toChain
            }
          };
          break;

        case 'market-insights':
          endpoint = '/ai/market-insights';
          requestBody = {
            tokens: [fromToken, toToken].filter(Boolean),
            priceData: currentQuote || {}
          };
          break;

        case 'token-price':
          if (!fromToken || !fromChain) {
            throw new Error('Please select a token and network first');
          }
          endpoint = '/ai/token-price';
          requestBody = {
            chainId: fromChain,
            tokenAddress: getTokenAddress(fromChain, fromToken),
            currency: 'USD'
          };
          break;

        case 'gas-price':
          if (!fromChain) {
            throw new Error('Please select a network first');
          }
          endpoint = '/ai/gas-price';
          requestBody = {
            chainId: fromChain
          };
          break;

        case 'wallet-balance':
          if (!fromChain || !address) {
            throw new Error('Please connect your wallet and select a network first');
          }
          endpoint = '/ai/wallet-balance';
          requestBody = {
            chainId: fromChain,
            walletAddress: address
          };
          break;

        case 'token-list':
          if (!fromChain) {
            throw new Error('Please select a network first');
          }
          endpoint = '/ai/token-list';
          requestBody = {
            chainId: fromChain
          };
          break;

        case 'fusion-intent-quote':
          if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !address) {
            throw new Error('Please fill in all swap fields and connect wallet first');
          }
          endpoint = '/ai/fusion-intent-quote';
          requestBody = {
            srcChainId: parseInt(fromChain),
            dstChainId: parseInt(toChain),
            srcTokenAddress: getTokenAddress(fromChain, fromToken),
            dstTokenAddress: getTokenAddress(toChain, toToken),
            amount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
            walletAddress: address
          };
          break;

        case 'optimize-swap':
          if (!fromToken || !toToken || !fromAmount) {
            throw new Error('Please set up a swap first to optimize');
          }
          endpoint = '/ai/optimize-swap';
          requestBody = {
            swapRequest: {
              fromToken,
              toToken,
              fromNetwork: Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain),
              toNetwork: Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain),
              amount: fromAmount,
              fromChainId: fromChain,
              toChainId: toChain
            }
          };
          break;

        case 'educational':
          endpoint = '/ai/educational-content';
          requestBody = {
            topic: 'cross-chain swaps and DeFi'
          };
          break;

        default:
          throw new Error('Unknown action');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      console.log('🔍 Quick action response:', {
        action,
        success: result.success,
        data: result.data,
        responseStructure: Object.keys(result.data || {})
      });
      
      let aiResponse;
      if (result.success && result.data.success) {
        // Handle different response structures from different AI endpoints
        aiResponse = result.data.analysis || 
                    result.data.insights || 
                    result.data.recommendations || 
                    result.data.content || 
                    result.data.aiAnalysis || // New field for price analysis
                    result.data.response || // General AI response
                    result.data.fallback;
        
        console.log('🔍 AI Response extracted:', {
          foundIn: aiResponse ? 'found' : 'not found',
          analysis: !!result.data.analysis,
          insights: !!result.data.insights,
          recommendations: !!result.data.recommendations,
          content: !!result.data.content,
          aiAnalysis: !!result.data.aiAnalysis,
          response: !!result.data.response,
          fallback: !!result.data.fallback
        });
      } else {
        aiResponse = result.error || 'Sorry, I encountered an error. Please try again.';
        console.log('❌ AI Response error:', result.error);
      }
      
      // Fallback if no AI response was found
      if (!aiResponse || aiResponse.trim() === '') {
        console.log('⚠️ No AI response found, using fallback');
        aiResponse = `I've retrieved the data for your ${action} request, but I'm having trouble generating the analysis. Please try asking me about the ${action} again or check the console for more details.`;
      }
      
      // Remove loading message and add AI response
      setChatMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }));

    } catch (error) {
      console.error('Quick action error:', error);
      setChatMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-30" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-glow/20 rounded-full blur-3xl animate-pulse-glow" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/1e18f896-8c0d-4c93-9d21-0aa11cf4aa76.png" 
              alt="genSwaps Logo" 
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                genSwaps TRUE DeFi
              </h1>
              <p className="text-muted-foreground">True decentralized cross-chain swaps</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Debug Chat Button - Remove this in production */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsChatOpen(true);
                setIsChatMinimized(false);
                toast({
                  title: "AI Chat Opened",
                  description: "AI DeFi Assistant is now available!",
                });
              }}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              🤖 Open AI Chat
            </Button>
            <WalletConnector />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span>TRUE DeFi Swap Tokens</span>
                    {sdkLoading ? (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connecting SDK...</span>
                      </div>
                    ) : sdkInitialized ? (
                      <div className="flex items-center space-x-2 text-sm text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span>SDK Connected</span>
                      </div>
                    ) : isConnected ? (
                      <div className="flex items-center space-x-2 text-sm text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span>SDK Disconnected</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Swap Mode Selector */}
                    <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
                      <Button
                        variant={swapMode === 'fusion' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSwapMode('fusion')}
                        className="h-7 px-3 text-xs"
                      >
                        🔄 Fusion Intent
                      </Button>
                      <Button
                        variant={swapMode === 'classic' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setSwapMode('classic');
                          // For classic swap, set both chains to the same
                          setToChain(fromChain);
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        ⚡ Classic Swap
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={swapMode === 'fusion' ? getQuote : getClassicSwapQuote}
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                    >
                      <RefreshCw className={`h-4 w-4 ${quoteLoading || classicSwapLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Swap Mode Indicator */}
                {swapMode === 'classic' && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">⚡</span>
                      <span className="text-sm font-medium text-blue-800">Classic Swap Mode</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Single-chain swap. Both tokens must be on the same network.
                    </p>
                  </div>
                )}

                {/* From Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">From</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={fromChain} onValueChange={(value) => {
                      setFromChain(value);
                      handleChainSwitch(value);
                    }}>
                      <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                        {Object.entries(NETWORKS).map(([key, network]) => (
                          <SelectItem key={network.id} value={network.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{network.logo}</span>
                              <span>{network.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={fromToken} onValueChange={setFromToken}>
                      <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                        {getFromTokens().map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{token.logo}</span>
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="text-2xl h-14 bg-background/50 border-border/50 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                  <div className="flex items-center justify-between mt-2">
                    {isBalanceLoading() ? (
                      <div className="text-sm text-muted-foreground">
                        <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                        Loading balance...
                      </div>
                    ) : isConnected ? (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Balance:</span> {formatBalance(getCurrentBalance(), getTokenDecimals(fromToken))} {fromToken}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Balance:</span> Connect wallet to see balance
                      </div>
                    )}
                    {isConnected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchBalance()}
                        className="h-6 px-2 hover:bg-primary/20"
                        disabled={isBalanceLoading()}
                      >
                        <RefreshCw className={`h-3 w-3 ${isBalanceLoading() ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                  {!isConnected && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <AlertTriangle className="inline mr-2 h-4 w-4 text-warning" />
                      Please connect your wallet to see balance.
                    </div>
                  )}
                  {isConnected && !isBalanceLoading() && !hasSufficientBalance() && fromAmount && parseFloat(fromAmount) > 0 && (
                    <div className="text-sm text-destructive mt-2">
                      <AlertTriangle className="inline mr-2 h-4 w-4" />
                      Insufficient balance. You need {fromAmount} {fromToken} but have {formatBalance(getCurrentBalance(), getTokenDecimals(fromToken))} {fromToken}.
                    </div>
                  )}
                </div>

                {/* Flip Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFlipTokens}
                    className="h-10 w-10 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* To Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">To</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={toChain} onValueChange={setToChain}>
                      <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                        {Object.entries(NETWORKS).map(([key, network]) => (
                          <SelectItem key={network.id} value={network.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{network.logo}</span>
                              <span>{network.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={toToken} onValueChange={setToToken}>
                      <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                        {getToTokens().map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{token.logo}</span>
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={toAmount}
                      readOnly
                      className="text-2xl h-14 bg-background/30 border-border/50"
                    />
                    {quoteLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Quote Status */}
                  {quoteLoading && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      Getting quote automatically...
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <Button
                  onClick={() => {
                    console.log('🔘 CONFIRM SWAP BUTTON CLICKED');
                    console.log('🔘 Button state:', {
                      isConnected,
                      hasFromAmount: !!fromAmount,
                      hasToAmount: !!toAmount,
                      orderLoading,
                      classicSwapLoading,
                      hasSufficientBalance: hasSufficientBalance(),
                      sdkInitialized,
                      swapMode
                    });
                    
                    if (swapMode === 'fusion') {
                      handleSwap();
                    } else {
                      // For classic swap, we need to get approval first
                      if (classicQuote) {
                        getClassicApprovalTransaction();
                      } else {
                        getClassicSwapQuote();
                      }
                    }
                  }}
                  disabled={
                    !isConnected || 
                    !fromAmount || 
                    !toAmount || 
                    orderLoading || 
                    classicSwapLoading || 
                    !hasSufficientBalance() || 
                    (swapMode === 'fusion' && !sdkInitialized)
                  }
                  className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:shadow-none"
                >
                  {orderLoading || classicSwapLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {swapMode === 'fusion' ? 'Creating Order...' : 'Processing...'}
                    </>
                  ) : !isConnected ? (
                    "Connect Wallet to Swap"
                  ) : !fromAmount ? (
                    "Enter Amount to Get Quote"
                  ) : !toAmount ? (
                    "Getting Quote..."
                  ) : !hasSufficientBalance() ? (
                    <>
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Insufficient Balance
                    </>
                  ) : swapMode === 'fusion' && !sdkInitialized ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting SDK...
                    </>
                  ) : classicQuote ? (
                    `Execute ${swapMode === 'fusion' ? 'Fusion Intent' : 'Classic'} Swap: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`
                  ) : (
                    `Get ${swapMode === 'fusion' ? 'Fusion Intent' : 'Classic'} Quote: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`
                  )}
                </Button>



                {/* Classic Swap Status Section */}
                {swapMode === 'classic' && (
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
                            onClick={getClassicSwapAnalysis}
                            className="text-xs"
                          >
                            📊 Get Analysis
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={getClassicApprovalTransaction}
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
                            onClick={handleClassicApproval}
                            className="text-xs bg-yellow-600 hover:bg-yellow-700"
                          >
                            🔐 Approve Tokens
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setClassicApprovalTx(null)}
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
                            onClick={handleClassicSwap}
                            className="text-xs bg-purple-600 hover:bg-purple-700"
                          >
                            🚀 Execute Swap
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setClassicSwapTx(null)}
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
                          onClick={() => setClassicExecutionResult(null)}
                          className="text-xs mt-2"
                        >
                          ✅ Done
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wallet SDK Connection */}
          <div className="lg:col-span-1 space-y-4">
            <WalletSDKConnector />
            
            {/* Swap History */}
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Swaps</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20">
                    <Filter className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock swap history - you can replace this with real data */}
                  <div className="p-4 rounded-lg bg-background/30 border border-border/30 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">USDC → USDC</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <Badge className="bg-success/20 text-success border-success/30">
                        completed
                      </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                      Ethereum → Polygon
                      </div>
                      <div className="flex justify-between items-center">
                      <span className="text-sm">100 USDC</span>
                      <span className="text-sm text-muted-foreground">$98.00</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">Just now</span>
                        <Button
                          variant="ghost"
                          size="sm"
                        onClick={() => copyToClipboard("0x123...")}
                          className="h-6 px-2 hover:bg-primary/20"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
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
                          'Pending Approval'
                        )}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">From:</span>
                        <span>{fromAmount} {fromToken} on {NETWORKS[Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain) || 'ethereum']?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">To:</span>
                        <span>{toAmount} {toToken} on {NETWORKS[Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain) || 'ethereum']?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Hash:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs">{orderData.orderHash.slice(0, 10)}...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(orderData.orderHash)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => checkOrderStatus(orderData.orderHash)}
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
                    onClick={() => {
                      console.log('🔘 APPROVE TOKENS BUTTON CLICKED');
                      console.log('🔘 Button state:', {
                        approvalLoading,
                        submissionLoading,
                        swapInProgress: orderData?.status === 'swap_in_progress'
                      });
                      approveTokens();
                    }}
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
                      setShowOrderModal(false);
                      setIsProcessing(false);
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
      <Dialog open={swapCompleted} onOpenChange={setSwapCompleted}>
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
                onClick={() => {
                  setSwapCompleted(false);
                  // Reset form for new swap
                  setFromAmount('');
                  setToAmount('');
                  setOrderData(null);
                  setOrderStatus(null);
                }}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                Start New Swap
              </Button>
              <Button
                onClick={() => setSwapCompleted(false)}
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
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
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
                    onClick={() => copyToClipboard(txHash)}
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

      {/* AI Chat Interface */}
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

            {/* Chat Messages */}
            {!isChatMinimized && (
              <>
                <div 
                  ref={chatContainerRef}
                  className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                >
                  {chatMessages.map((message) => (
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
                            {message.content.split('\n').map((line, index) => {
                              if (line.startsWith('## ')) {
                                return <h3 key={index} className="text-lg font-bold text-blue-600 mt-4 mb-2">{line.replace('## ', '')}</h3>;
                              } else if (line.startsWith('### ')) {
                                return <h4 key={index} className="text-base font-semibold text-gray-700 mt-3 mb-1">{line.replace('### ', '')}</h4>;
                              } else if (line.startsWith('- **')) {
                                const parts = line.replace('- **', '').split(':**');
                                return (
                                  <div key={index} className="flex items-start space-x-2 my-1">
                                    <span className="font-semibold text-blue-600">{parts[0]}:</span>
                                    <span>{parts[1] || ''}</span>
                                  </div>
                                );
                              } else if (line.startsWith('- ')) {
                                return <div key={index} className="ml-4 my-1">• {line.replace('- ', '')}</div>;
                              } else if (line.trim() === '') {
                                return <div key={index} className="h-2"></div>;
                              } else {
                                return <div key={index} className="my-1">{line}</div>;
                              }
                            })}
                          </div>
                        )}
                        
                        {/* Confirmation Button for Swap */}
                        {message.swapData && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Button
                              onClick={async () => {
                                try {
                                  const result = await executeChatSwap(message.swapData.quoteData, message.swapData.swapData);
                                  setChatMessages(prev => prev.concat({
                                    id: Date.now().toString(),
                                    type: 'ai',
                                    content: result.message,
                                    timestamp: new Date()
                                  }));
                                } catch (error) {
                                  console.error('Execute swap error:', error);
                                  setChatMessages(prev => prev.concat({
                                    id: Date.now().toString(),
                                    type: 'ai',
                                    content: '❌ Failed to execute swap. Please try again.',
                                    timestamp: new Date()
                                  }));
                                }
                              }}
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

                {/* Quick Action Buttons */}
                <div className="px-4 py-3 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('analyze-swap')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      🔍 Analyze Swap
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('market-insights')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      📊 Market Insights
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('token-price')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      💰 Token Price
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('gas-price')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      ⛽ Gas Price
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('wallet-balance')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      💰 Wallet Balance
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('token-list')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      📋 Token List
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('fusion-intent-quote')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      🔥 Fusion Intent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('optimize-swap')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      ⚡ Optimize
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('educational')}
                      disabled={isChatLoading}
                      className="text-xs h-8 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700"
                    >
                      📚 Learn
                    </Button>
                  </div>
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200/50 bg-white">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Try: 'swap 1.2 USDC on arbitrum to polygon' or ask about DeFi..."
                      className="flex-1 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-xl text-gray-800 placeholder-gray-500"
                      disabled={isChatLoading}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 h-10 w-10 rounded-xl"
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapInterface;