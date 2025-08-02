import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, CheckCircle, Copy } from "lucide-react";

interface SwapHistoryProps {
  onCopyToClipboard: (text: string) => void;
}

export const SwapHistory: React.FC<SwapHistoryProps> = ({
  onCopyToClipboard
}) => {
  return (
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
                onClick={() => onCopyToClipboard("0x123...")}
                className="h-6 px-2 hover:bg-primary/20"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};