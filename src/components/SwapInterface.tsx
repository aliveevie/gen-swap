import { useState, useEffect } from "react";
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

const chains = [
  { id: 1, name: "Ethereum", symbol: "ETH", logo: "⟠" },
  { id: 56, name: "BSC", symbol: "BNB", logo: "🟡" },
  { id: 137, name: "Polygon", symbol: "MATIC", logo: "🟣" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", logo: "🔺" },
  { id: 250, name: "Fantom", symbol: "FTM", logo: "👻" },
];

const tokens = [
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
  const [isConnected, setIsConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const { toast } = useToast();

  // Mock swap history
  const [swapHistory] = useState([
    {
      id: 1,
      fromChain: "Ethereum",
      toChain: "Polygon",
      fromToken: "ETH",
      toToken: "USDC",
      amount: "0.5",
      value: "$1,250",
      status: "completed",
      txHash: "0x1234...5678",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      fromChain: "BSC",
      toChain: "Avalanche",
      fromToken: "BNB",
      toToken: "AVAX",
      amount: "2.5",
      value: "$850",
      status: "pending",
      txHash: "0x9876...4321",
      timestamp: "5 minutes ago"
    },
    {
      id: 3,
      fromChain: "Polygon",
      toChain: "Ethereum",
      fromToken: "MATIC",
      toToken: "WBTC",
      amount: "1000",
      value: "$2,100",
      status: "failed",
      txHash: "0xabcd...efgh",
      timestamp: "1 day ago"
    }
  ]);

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      setQuoteLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockRate = Math.random() * 2000 + 1000;
        setToAmount((parseFloat(fromAmount) * mockRate).toFixed(6));
        setQuoteLoading(false);
      }, 1000);
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwap = () => {
    setIsLoading(true);
    // Simulate transaction
    setTimeout(() => {
      setTxHash("0x1234567890abcdef");
      setShowConfirmModal(true);
      setIsLoading(false);
    }, 2000);
  };

  const handleFlipTokens = () => {
    const tempChain = fromChain;
    const tempToken = fromToken;
    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const connectWallet = (walletType: string) => {
    setIsConnected(true);
    setShowWalletModal(false);
    toast({
      title: "Wallet Connected",
      description: `Successfully connected to ${walletType}`,
    });
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
          
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={() => setShowWalletModal(true)}
            className={isConnected ? "border-primary/50 hover:border-primary" : "bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow"}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnected ? "0x1234...5678" : "Connect Wallet"}
          </Button>
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
                    <Select value={fromChain} onValueChange={setFromChain}>
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
                        {tokens.map((token) => (
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
                        {tokens.map((token) => (
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

      {/* Wallet Connection Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="bg-gradient-card backdrop-blur-sm border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {[
              { name: "MetaMask", icon: "🦊" },
              { name: "Keplr", icon: "⚛️" },
              { name: "Leap", icon: "🦘" },
              { name: "WalletConnect", icon: "🔗" },
            ].map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                onClick={() => connectWallet(wallet.name)}
                className="h-14 border-border/50 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300"
              >
                <span className="text-2xl mr-3">{wallet.icon}</span>
                <span className="text-lg">{wallet.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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