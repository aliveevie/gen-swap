# Frontend Setup Guide

## Environment Variables

Create a `.env` file in the root directory with:

```env
# 1inch Developer Portal API Key (for client-side quotes)
VITE_1INCH_API_KEY=your_1inch_api_key_here

# Server API URL
VITE_API_BASE_URL=http://localhost:9056/api
```

## How It Works

### 1. User Wallet Integration
- Users connect their own wallets (MetaMask, WalletConnect, etc.)
- No server-side private keys required
- Users sign all transactions themselves

### 2. Swap Flow
1. **Quote Request**: Frontend requests quote from server
2. **Parameter Generation**: Server generates swap parameters
3. **User Approval**: User approves token spending in their wallet
4. **Swap Execution**: User's wallet executes the swap transaction
5. **Confirmation**: Transaction is confirmed on blockchain

### 3. Security Benefits
- **User Control**: Users control their own private keys
- **No Server Risk**: Server doesn't hold any user funds
- **Transparency**: All transactions are visible to users
- **Standard Flow**: Uses standard DeFi approval patterns

## Required Dependencies

The frontend needs these packages for wallet integration:

```bash
pnpm install ethers @1inch/cross-chain-sdk
```

## Wallet Support

The implementation supports:
- **MetaMask**: Primary wallet provider
- **WalletConnect**: For mobile wallets
- **Other EIP-1193 compatible wallets**

## User Experience

1. **Connect Wallet**: User clicks "Connect Wallet" button
2. **Select Networks/Tokens**: Choose source and destination
3. **Enter Amount**: Input swap amount
4. **Get Quote**: Real-time quote from 1inch
5. **Approve Tokens**: User approves token spending (if needed)
6. **Execute Swap**: User confirms swap transaction
7. **Track Progress**: Monitor swap status

## Error Handling

The frontend handles:
- **Wallet Connection Errors**: No wallet found, connection refused
- **Network Errors**: Wrong network, insufficient balance
- **Approval Errors**: User rejects approval
- **Swap Errors**: Insufficient liquidity, slippage too high

## Testing

1. **Test Networks**: Use testnets for development
2. **Small Amounts**: Start with small swap amounts
3. **Multiple Wallets**: Test with different wallet providers
4. **Error Scenarios**: Test various error conditions 