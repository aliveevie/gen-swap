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

// API base URL
const API_BASE_URL = 'http://localhost:9056/api';

// Default chains and tokens - will be populated from API
const defaultChains = [
  { id: 1, name: "Ethereum", symbol: "ETH", logo: "⟠" },
  { id: 56, name: "BSC", symbol: "BNB", logo: "🟡" },
  { id: 137, name: "Polygon", symbol: "MATIC", logo: "🟣" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", logo: "🔺" },
  { id: 250, name: "Fantom", symbol: "FTM", logo: "👻" },
];

const defaultTokens = [
  { symbol: "ETH", name: "Ethereum", logo: "⟠" },
  { symbol: "USDC", name: "USD Coin", logo: "💰" },
  { symbol: "USDT", name: "Tether", logo: "💵" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", logo: "₿" },
];

const SwapInterface = () => {
  const [fromChain, setFromChain] = useState("1");
  const [toChain, setToChain] = useState("137");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [chains, setChains] = useState(defaultChains);
  const [fromTokens, setFromTokens] = useState(defaultTokens);
  const [toTokens, setToTokens] = useState(defaultTokens);
  const [swapHistory, setSwapHistory] = useState([]);
  const { toast } = useToast();
  
  // Client swapper instance
  const clientSwapperRef = useRef<ClientSwapper | null>(null);
  
  // Rainbow Kit hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

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

  // Load networks and tokens from API
  useEffect(() => {
    const loadNetworks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/networks`);
        const data = await response.json();
        if (data.success) {
          setChains(data.data);
        }
      } catch (error) {
        console.error('Failed to load networks:', error);
        toast({
          title: "Error",
          description: "Failed to load supported networks",
          variant: "destructive"
        });
      }
    };

    loadNetworks();
  }, [toast]);

  // Load tokens for selected chains
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const fromNetwork = chains.find(chain => chain.id.toString() === fromChain);
        const toNetwork = chains.find(chain => chain.id.toString() === toChain);
        
        if (fromNetwork) {
          const response = await fetch(`${API_BASE_URL}/tokens/${fromNetwork.networkName}`);
          const data = await response.json();
          if (data.success) {
            setFromTokens(data.data);
          }
        }
        
        if (toNetwork) {
          const response = await fetch(`${API_BASE_URL}/tokens/${toNetwork.networkName}`);
          const data = await response.json();
          if (data.success) {
            setToTokens(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load tokens:', error);
      }
    };

    if (chains.length > 0) {
      loadTokens();
    }
  }, [fromChain, toChain, chains]);

  useEffect(() => {
    if (fromAmount && fromToken && toToken && isConnected && address) {
      setQuoteLoading(true);
      
      const getQuote = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/quote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromChainId: parseInt(fromChain),
              toChainId: parseInt(toChain),
              fromToken,
              toToken,
              amount: fromAmount,
              walletAddress: address
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setToAmount(data.data.toAmount);
          } else {
            console.error('Quote error:', data.error);
            setToAmount('0');
          }
        } catch (error) {
          console.error('Failed to get quote:', error);
          setToAmount('0');
        } finally {
          setQuoteLoading(false);
        }
      };
      
      getQuote();
    } else if (!fromAmount) {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken, fromChain, toChain, isConnected, address]);

  const handleSwap = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Initialize client swapper if not already done
      if (!clientSwapperRef.current) {
        clientSwapperRef.current = new ClientSwapper();
        
        // Get wallet provider from window.ethereum
        const walletProvider = (window as any).ethereum;
        if (!walletProvider) {
          throw new Error('No wallet provider found. Please install MetaMask.');
        }
        
        await clientSwapperRef.current.initialize(walletProvider);
      }

      // Execute swap via server API
      const result = await clientSwapperRef.current.executeSwap({
        fromChainId: parseInt(fromChain),
        toChainId: parseInt(toChain),
        fromToken,
        toToken,
        amount: fromAmount,
        walletAddress: address
      }, API_BASE_URL);
      
      setTxHash(result.orderHash);
      setShowConfirmModal(true);
      
      // Add to swap history
      const newSwap = {
        id: Date.now(),
        fromChain: chains.find(c => c.id.toString() === fromChain)?.name || fromChain,
        toChain: chains.find(c => c.id.toString() === toChain)?.name || toChain,
        fromToken,
        toToken,
        amount: fromAmount,
        value: `$${(parseFloat(fromAmount) * 2000).toFixed(2)}`, // Mock value
        status: 'pending',
        txHash: result.orderHash,
        timestamp: 'Just now'
      };
      
      setSwapHistory(prev => [newSwap, ...prev.slice(0, 9)]); // Keep last 10 swaps
      
      toast({
        title: "Swap Initiated",
        description: `Order placed successfully! Hash: ${result.orderHash.slice(0, 10)}...`,
      });
      
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap",
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
  };

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
                genSwaps
              </h1>
              <p className="text-muted-foreground">Cross-chain DeFi made simple</p>
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
                  <span>Swap Tokens</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setQuoteLoading(true)}
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
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{chain.logo}</span>
                              <span>{chain.name}</span>
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
                        {fromTokens.map((token) => (
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
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{chain.logo}</span>
                              <span>{chain.name}</span>
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
                        {toTokens.map((token) => (
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
                  ) : (
                    `Swap ${fromToken} to ${toToken}`
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
                  {swapHistory.map((swap) => (
                    <div 
                      key={swap.id} 
                      className="p-4 rounded-lg bg-background/30 border border-border/30 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{swap.fromToken} → {swap.toToken}</span>
                          {getStatusIcon(swap.status)}
                        </div>
                        <Badge className={getStatusColor(swap.status)}>
                          {swap.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {swap.fromChain} → {swap.toChain}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{swap.amount} {swap.fromToken}</span>
                        <span className="text-sm text-muted-foreground">{swap.value}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{swap.timestamp}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(swap.txHash)}
                          className="h-6 px-2 hover:bg-primary/20"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
            <DialogTitle>Transaction Submitted</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg mb-4">Your swap is being processed!</p>
            <div className="bg-background/50 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction Hash:</span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
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