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
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import WalletConnector from "./WalletConnector";
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
  const { toast } = useToast();
  
  // Client swapper instance
  const clientSwapperRef = useRef<ClientSwapper | null>(null);
  
  // Rainbow Kit hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

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

  // Handle wallet connection status changes
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  }, [isConnected, address, toast]);

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
        walletAddress: address
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
    if (!isConnected || !address) {
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

    setIsLoading(true);
    
    try {
      // Get token addresses
      const srcTokenAddress = getTokenAddress(fromChain, fromToken);
      const dstTokenAddress = getTokenAddress(toChain, toToken);
      
      if (!srcTokenAddress || !dstTokenAddress) {
        throw new Error('Token addresses not found');
      }

      // Convert amount to wei
      const tokenDecimals = {
        'USDC': 6, 'USDT': 6, 'DAI': 18, 'WETH': 18, 'WBTC': 8,
        'ETH': 18, 'MATIC': 18, 'BNB': 18, 'AVAX': 18, 'OP': 18, 'FTM': 18
      };
      const decimals = tokenDecimals[fromToken] || 18;
      const weiAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

      // Prepare swap parameters
      const swapParams = {
        srcChainId: parseInt(fromChain),
        dstChainId: parseInt(toChain),
        srcTokenAddress: srcTokenAddress,
        dstTokenAddress: dstTokenAddress,
        amount: weiAmount,
        walletAddress: address
      };

      console.log('🚀 Starting swap with parameters:', swapParams);

      toast({
        title: "Swap Starting",
        description: "Processing your cross-chain swap...",
      });

      // For now, just simulate a successful swap
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 40) + Date.now().toString(16);
      
      // Add to swap history
      const newSwap = {
        id: Date.now(),
        fromChain: NETWORKS[Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain) || 'ethereum']?.name || fromChain,
        toChain: NETWORKS[Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain) || 'ethereum']?.name || toChain,
        fromToken,
        toToken,
        amount: fromAmount,
        value: `$${(parseFloat(fromAmount) * 0.98).toFixed(2)}`,
        status: 'completed',
        txHash: mockTxHash,
        timestamp: 'Just now'
      };
      
      setTxHash(mockTxHash);
      setShowConfirmModal(true);
      
      toast({
        title: "✅ Swap Completed!",
        description: `Transaction hash: ${mockTxHash.slice(0, 10)}...`,
      });
      
    } catch (error: any) {
      console.error('Swap error:', error);
        toast({
        title: "Swap Failed",
        description: error.message || "Failed to process swap. Please try again.",
          variant: "destructive"
        });
    } finally {
      setIsLoading(false);
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
                  <span>TRUE DeFi Swap Tokens</span>
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
                  onClick={handleSwap}
                  disabled={!isConnected || !fromAmount || !toAmount || isLoading}
                  className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Swap...
                    </>
                  ) : !isConnected ? (
                    "Connect Wallet to Swap"
                  ) : !toAmount ? (
                    "Enter Amount to Get Quote"
                  ) : (
                    `Swap ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Swap History */}
          <div className="lg:col-span-1">
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