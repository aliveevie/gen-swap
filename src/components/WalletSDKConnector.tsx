import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Activity,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useChainId, usePublicClient } from 'wagmi';

// API base URL
const API_BASE_URL = 'http://localhost:9056/api';

interface SDKStatus {
  connectionStatus: string;
  hasGlobalSDK: boolean;
  authKeyConfigured: boolean;
  timestamp: string;
}

interface ConnectionMetrics {
  connectionTime: number;
  retryCount: number;
  lastError?: string;
  uptime: number;
}

const WalletSDKConnector: React.FC = () => {
  const [sdkStatus, setSdkStatus] = useState<SDKStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    connectionTime: 0,
    retryCount: 0,
    uptime: 0
  });
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: string;
    status: string;
    duration?: number;
  }>>([]);
  
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });

  // Initialize SDK connection
  const initializeSDK = async (retryCount = 0): Promise<boolean> => {
    if (!isConnected || !address || !publicClient) {
      console.log('❌ Cannot initialize SDK: Wallet not connected or provider unavailable');
      return false;
    }

    setIsConnecting(true);
    const startTime = Date.now();

    try {
      console.log('🔧 Initializing professional SDK connection...');
      console.log('👤 User wallet:', address);
      console.log('🌐 Chain ID:', chainId);
      console.log('🔗 Provider available:', !!publicClient);

      // Create Web3 provider object
      const web3Provider = {
        provider: publicClient,
        chainId: chainId,
        address: address,
        timestamp: new Date().toISOString()
      };

      console.log('📡 Sending Web3 provider to backend for SDK initialization...');

      const response = await fetch(`${API_BASE_URL}/test-sdk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          web3Provider: web3Provider,
          nodeUrl: publicClient.transport.url || 'user_wallet_provider',
          retryCount: retryCount
        })
      });

      const data = await response.json();
      const connectionTime = Date.now() - startTime;

      if (data.success) {
        console.log('✅ Professional SDK connection established successfully');
        console.log('⏱️ Connection time:', connectionTime + 'ms');
        console.log('🔗 Provider type:', data.data.providerType);
        console.log('📊 Connection status:', data.data.connectionStatus);

        setSdkStatus({
          connectionStatus: data.data.connectionStatus,
          hasGlobalSDK: data.data.hasGetQuote,
          authKeyConfigured: data.data.authKeyConfigured,
          timestamp: new Date().toISOString()
        });

        setConnectionMetrics(prev => ({
          ...prev,
          connectionTime,
          retryCount: retryCount,
          uptime: Date.now()
        }));

        // Add to connection history
        setConnectionHistory(prev => [...prev, {
          timestamp: new Date().toISOString(),
          status: 'connected',
          duration: connectionTime
        }]);

        toast({
          title: "🔗 SDK Connected Successfully",
          description: `Connected in ${connectionTime}ms with ${retryCount} retries`,
        });

        return true;
      } else {
        throw new Error(data.error || 'Failed to establish SDK connection');
      }

    } catch (error: any) {
      const connectionTime = Date.now() - startTime;
      console.error('❌ Professional SDK connection failed:', error.message);
      
      setConnectionMetrics(prev => ({
        ...prev,
        connectionTime,
        retryCount: retryCount + 1,
        lastError: error.message,
        uptime: 0
      }));

      // Add to connection history
      setConnectionHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        status: 'failed',
        duration: connectionTime
      }]);

      toast({
        title: "❌ SDK Connection Failed",
        description: error.message || "Failed to connect 1inch SDK",
        variant: "destructive"
      });

      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Check SDK status
  const checkSDKStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sdk-status`);
      const data = await response.json();
      
      if (data.success) {
        setSdkStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to check SDK status:', error);
    }
  };

  // Auto-reconnect logic
  useEffect(() => {
    if (isConnected && address && autoReconnect && !sdkStatus?.hasGlobalSDK) {
      const timer = setTimeout(() => {
        initializeSDK(connectionMetrics.retryCount);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, address, autoReconnect, sdkStatus?.hasGlobalSDK]);

  // Initialize SDK when wallet connects
  useEffect(() => {
    if (isConnected && address && publicClient) {
      initializeSDK();
    } else {
      setSdkStatus(null);
    }
  }, [isConnected, address, chainId]);

  // Periodic status check
  useEffect(() => {
    if (sdkStatus?.hasGlobalSDK) {
      const interval = setInterval(checkSDKStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [sdkStatus?.hasGlobalSDK]);

  // Calculate uptime
  useEffect(() => {
    if (connectionMetrics.uptime > 0) {
      const interval = setInterval(() => {
        setConnectionMetrics(prev => ({
          ...prev,
          uptime: Date.now() - prev.uptime
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [connectionMetrics.uptime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success/20 text-success border-success/30';
      case 'disconnected': return 'bg-muted/20 text-muted-foreground border-muted/30';
      case 'connection_failed': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'no_auth_key': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <WifiOff className="h-4 w-4" />;
      case 'connection_failed': return <XCircle className="h-4 w-4" />;
      case 'no_auth_key': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Wallet SDK Connection</span>
          </div>
          <Badge className={getStatusColor(sdkStatus?.connectionStatus || 'disconnected')}>
            {getStatusIcon(sdkStatus?.connectionStatus || 'disconnected')}
            <span className="ml-1">{sdkStatus?.connectionStatus || 'disconnected'}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet Status</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">SDK Status</span>
              <Badge variant={sdkStatus?.hasGlobalSDK ? "default" : "secondary"}>
                {sdkStatus?.hasGlobalSDK ? (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auth Key</span>
              <Badge variant={sdkStatus?.authKeyConfigured ? "default" : "destructive"}>
                {sdkStatus?.authKeyConfigured ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Configured
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Missing
                  </>
                )}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection Time</span>
              <span className="font-mono">{connectionMetrics.connectionTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Retry Count</span>
              <span className="font-mono">{connectionMetrics.retryCount}</span>
            </div>

            {connectionMetrics.uptime > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono">{formatUptime(connectionMetrics.uptime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Progress */}
        {isConnecting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Establishing SDK Connection...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {/* Error Display */}
        {connectionMetrics.lastError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Last Error: {connectionMetrics.lastError}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={() => initializeSDK(connectionMetrics.retryCount)}
            disabled={!isConnected || isConnecting}
            className="flex-1"
            size="sm"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </>
            )}
          </Button>

          <Button
            onClick={checkSDKStatus}
            variant="outline"
            size="sm"
            disabled={isConnecting}
          >
            <Activity className="h-4 w-4 mr-2" />
            Status
          </Button>

          <Button
            onClick={() => setAutoReconnect(!autoReconnect)}
            variant={autoReconnect ? "default" : "outline"}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Auto
          </Button>
        </div>

        {/* Connection History */}
        {connectionHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recent Connections</span>
              <span className="text-xs text-muted-foreground">
                {connectionHistory.length} events
              </span>
            </div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {connectionHistory.slice(-3).reverse().map((event, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge variant={event.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                    {event.status}
                  </Badge>
                  {event.duration && (
                    <span className="text-muted-foreground font-mono">
                      {event.duration}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Professional Features */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Globe className="h-3 w-3" />
            <span>Multi-Chain</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Secure</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Fast</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletSDKConnector; 