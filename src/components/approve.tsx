import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, encodeFunctionData, isAddress } from 'viem';
import WalletConnector from "./WalletConnector";

// ERC-20 approve function ABI
const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// Token addresses for different networks (properly checksummed)
const TOKEN_ADDRESSES = {
  1: "0xA0b86a33E6441C6C36D8E5B33F0E1D2BB8C5E3E6", // USDC on Ethereum
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
  10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC on Optimism
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
};

const SPENDER_ADDRESSES = {
  1: "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch router v5 on Ethereum
  42161: "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch router v5 on Arbitrum
  137: "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch router v5 on Polygon
  10: "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch router v5 on Optimism
  8453: "0x1111111254fb6c44bAC0beD2854e76F90643097d", // 1inch router v5 on Base
};

const ApproveInterface = () => {
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [spenderAddress, setSpenderAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { toast } = useToast();
  
  const { isConnected, address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Auto-set token and spender addresses based on current chain
  useEffect(() => {
    if (chain?.id) {
      const chainId = chain.id as keyof typeof TOKEN_ADDRESSES;
      setTokenAddress(TOKEN_ADDRESSES[chainId] || "");
      setSpenderAddress(SPENDER_ADDRESSES[chainId] || "");
    }
  }, [chain?.id]);

  const handleApprove = async () => {
    if (!isConnected || !address || !walletClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (!tokenAddress || !spenderAddress) {
      toast({
        title: "Error",
        description: "Please enter valid token and spender addresses",
        variant: "destructive"
      });
      return;
    }

    // Validate addresses
    if (!isAddress(tokenAddress)) {
      toast({
        title: "Error",
        description: "Invalid token address format",
        variant: "destructive"
      });
      return;
    }

    if (!isAddress(spenderAddress)) {
      toast({
        title: "Error",
        description: "Invalid spender address format",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert amount to proper units (assuming 18 decimals for most tokens)
      const amountInWei = parseUnits(amount, 18);
      
             console.log("=== REAL TOKEN APPROVAL TRANSACTION ===");
       console.log("Network:", chain?.name || "Unknown");
       console.log("Chain ID:", chain?.id || "Unknown");
       console.log("Token Address:", tokenAddress);
       console.log("Spender Address:", spenderAddress);
       console.log("Amount:", amount);
       console.log("Amount in Wei:", amountInWei.toString());
       console.log("User Address:", address);
       console.log("Wallet Client:", walletClient);

      toast({
        title: "Approval Pending",
        description: "Please check your wallet to sign the transaction...",
      });

      // Send the actual approval transaction
      const txHash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amountInWei],
        account: address as `0x${string}`,
        chain: walletClient.chain,
      });

      console.log("Transaction Hash:", txHash);
      setTxHash(txHash);
      
      toast({
        title: "Transaction Sent!",
        description: `Transaction hash: ${txHash.slice(0, 10)}...`,
      });

      // Wait for transaction confirmation if publicClient is available
      if (publicClient) {
        toast({
          title: "Confirming Transaction",
          description: "Waiting for blockchain confirmation...",
        });

        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: txHash 
        });

        console.log("Transaction Receipt:", receipt);
        
        if (receipt.status === 'success') {
          setIsApproved(true);
          toast({
            title: "✅ Approval Successful!",
            description: "Token approval confirmed on blockchain",
          });
        } else {
          throw new Error("Transaction failed");
        }
      } else {
        // If no public client, just assume success after sending
        setIsApproved(true);
        toast({
          title: "✅ Approval Sent!",
          description: "Transaction sent to blockchain",
        });
      }

      console.log("=== APPROVAL COMPLETED ===");
      
    } catch (error: any) {
      console.error('Approval error:', error);
      
      // Check if it's a user rejection
      if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction in your wallet.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve token. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Token Approval</h1>
          <WalletConnector />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Approve Token Spending</span>
              {isApproved && <CheckCircle className="h-5 w-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Address */}
            <div className="space-y-2">
              <Label>Token Address</Label>
              <Input
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            {/* Spender Address */}
            <div className="space-y-2">
              <Label>Spender Address</Label>
              <Input
                value={spenderAddress}
                onChange={(e) => setSpenderAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
              />
            </div>

            {/* Wallet Info */}
            {isConnected && address && (
              <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Connected Wallet:</span>
                  </div>
                  <span className="text-sm font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                {chain && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Network: <span className="font-medium text-foreground">{chain.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Chain ID: <span className="font-medium text-foreground">{chain.id}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approve Button */}
            <Button
              onClick={handleApprove}
              disabled={!isConnected || !amount || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : !isConnected ? (
                "Connect Wallet First"
              ) : (
                "Approve Token Spending"
              )}
            </Button>

            {/* Transaction Hash Display */}
            {txHash && (
              <div className="p-3 rounded bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">Transaction Hash:</p>
                <p className="text-xs font-mono text-green-600 break-all">{txHash}</p>
              </div>
            )}

            {/* Instructions */}
            <p className="text-sm text-muted-foreground text-center">
              Click approve to trigger a REAL wallet transaction signature
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApproveInterface;