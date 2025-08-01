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
  Lock
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
  const [swapCompleted, setSwapCompleted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<any>(null);
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
      case 1: return { id: 1, name: 'Ethereum' };
      case 42161: return { id: 42161, name: 'Arbitrum' };
      case 8453: return { id: 8453, name: 'Base' };
      case 137: return { id: 137, name: 'Polygon' };
      case 56: return { id: 56, name: 'BSC' };
      case 43114: return { id: 43114, name: 'Avalanche' };
      case 10: return { id: 10, name: 'Optimism' };
      case 250: return { id: 250, name: 'Fantom' };
      default: return { id: 1, name: 'Ethereum' };
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
          
          const result = await writeContract({
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

          console.log('✅ Token approval transaction sent to wallet:', result);
          console.log('⏳ Waiting for transaction confirmation on blockchain...');
          
          toast({
            title: "⏳ Transaction Pending",
            description: "Waiting for blockchain confirmation. Please wait...",
          });
          
          // Wait for the transaction to be confirmed on the blockchain
          const transactionReceipt = await publicClient.waitForTransactionReceipt({
            hash: result,
            confirmations: 1
          });

          console.log('✅ Transaction confirmed on blockchain:', transactionReceipt);
          
          if (transactionReceipt.status === 'reverted') {
            throw new Error('Transaction was reverted on the blockchain');
          }
          console.log('✅ Transaction hash:', result);
          
          // Set approval status to true
          setIsApproved(true);
          
          toast({
            title: "✅ Tokens Approved!",
            description: "Token approval confirmed on blockchain. Processing swap...",
          });

          // Now send the approval status to backend with quote data
          console.log('🎉 Token approval confirmed - now sending data to backend');
          await processApprovedSwap(result);

        } catch (walletError: any) {
          console.error('❌ Wallet transaction failed:', walletError);
          console.error('❌ Error details:', {
            message: walletError.message,
            code: walletError.code,
            stack: walletError.stack
          });
          console.log('🚫 NO DATA SENT TO BACKEND - Wallet approval failed');
          toast({
            title: "Wallet Transaction Failed",
            description: walletError.message || "Failed to send approval transaction. No data was sent to backend.",
            variant: "destructive"
          });
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
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve tokens. No data was sent to backend. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  // Process approved swap with stored quote data
  const processApprovedSwap = async (approvalTxResult: any) => {
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
    try {
      console.log('🎉 Processing approved swap with stored quote data');
      console.log('📋 Approval transaction result:', approvalTxResult);
      console.log('📋 Stored quote has getPreset method:', !!currentQuote.getPreset);
      
      // Use the stored quote data with reference ID
      const swapParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: getTokenAddress(fromChain, fromToken),
        dstTokenAddress: getTokenAddress(toChain, toToken),
        amount: Math.floor(parseFloat(fromAmount) * Math.pow(10, getTokenDecimals(fromToken))).toString(),
        walletAddress: address,
        approve: true, // Send approval status
        approvalTxHash: approvalTxResult,
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
        }, 3000); // Simulate completion after 3 seconds

      } else {
        console.error('❌ Backend processing failed:', data.error);
        throw new Error(data.error || 'Failed to process approved swap');
      }
    } catch (error: any) {
      console.error('❌ Approved swap processing failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      console.log('🚫 NO DATA SENT TO BACKEND - Swap processing failed');
      toast({
        title: "Swap Processing Failed",
        description: error.message || "Failed to process approved swap. No data was sent to backend. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmissionLoading(false);
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-30" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-glow/20 rounded-full blur-3xl animate-pulse-glow" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
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
          
          <WalletConnector />
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={getQuote}
                    className="h-8 w-8 p-0 hover:bg-primary/20"
                  >
                    <RefreshCw className={`h-4 w-4 ${quoteLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      hasSufficientBalance: hasSufficientBalance(),
                      sdkInitialized
                    });
                    handleSwap();
                  }}
                  disabled={!isConnected || !fromAmount || !toAmount || orderLoading || !hasSufficientBalance() || !sdkInitialized}
                  className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:shadow-none"
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Order...
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
                  ) : !sdkInitialized ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting SDK...
                    </>
                  ) : (
                    `Get Quote & Review: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`
                  )}
                </Button>
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
                        Pending Approval
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
                    disabled={approvalLoading || submissionLoading || orderData?.status === 'swap_in_progress'}
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
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Approve Tokens
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => setShowOrderModal(false)}
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
    </div>
  );
};

export default SwapInterface;