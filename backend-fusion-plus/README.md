# GenSwap Backend API

Professional cross-chain DeFi swapping backend with 1inch Fusion+ integration.

## 🚀 Features

- **Real 1inch Fusion+ Integration**: Uses actual 1inch API for quotes and swaps
- **Cross-Chain Support**: Ethereum, Arbitrum, Base, Polygon, BSC, Avalanche, Optimism, Fantom
- **Client-Server Architecture**: Server handles complex logic, client handles wallet approvals
- **Professional Token Support**: All major tokens (USDC, USDT, WETH, DAI, etc.)
- **Perfect Synchronization**: Networks and tokens match exactly across UI, wallet, and server

## 📋 Prerequisites

- Node.js >= 18.0.0
- 1inch Developer Portal API Key
- Environment variables configured

## 🔧 Setup

### 1. Install Dependencies

```bash
cd backend-fusion-plus
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend-fusion-plus` directory:

```env
# Server Configuration
PORT=9056

# 1inch API Configuration (Optional - for server-side quotes)
DEV_PORTAL_KEY=your_1inch_api_key_here

# Wallet Configuration (Optional - for server-side execution)
WALLET_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here
```

**Note**: The `DEV_PORTAL_KEY` is optional. If not provided, the server will use client-side execution with user wallet approvals.

### 3. Start the Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The server will start on `http://localhost:9056`

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Get Supported Networks
```
GET /api/networks
```

### Get Tokens for Network
```
GET /api/tokens/:networkName
```

### Get Quote
```
POST /api/quote
{
  "fromChainId": 1,
  "toChainId": 137,
  "fromToken": "USDC",
  "toToken": "USDT",
  "amount": "100",
  "walletAddress": "0x..."
}
```

### Execute Swap
```
POST /api/swap
{
  "fromChainId": 1,
  "toChainId": 137,
  "fromToken": "USDC",
  "toToken": "USDT",
  "amount": "100",
  "walletAddress": "0x..."
}
```

### Get Swap Status
```
GET /api/swap/status/:orderHash
```

## 🔗 Network Synchronization

The backend ensures perfect synchronization across:

1. **Server Networks** (from Swapper.js)
2. **Frontend Networks** (from SwapInterface.tsx)
3. **Wallet Networks** (from wagmi.ts)

### Supported Networks

| Network | Chain ID | Network Name | Symbol |
|---------|----------|--------------|--------|
| Ethereum | 1 | ethereum | ETH |
| Arbitrum | 42161 | arbitrum | ARB |
| Base | 8453 | base | BASE |
| Polygon | 137 | polygon | MATIC |
| BSC | 56 | bsc | BNB |
| Avalanche | 43114 | avalanche | AVAX |
| Optimism | 10 | optimism | OP |
| Fantom | 250 | fantom | FTM |

### Supported Tokens

Each network supports:
- **Native tokens**: ETH, ARB, BASE, MATIC, BNB, AVAX, OP, FTM
- **Stablecoins**: USDC, USDT, DAI
- **Wrapped tokens**: WETH, WMATIC, WBNB, WAVAX, WFTM
- **Other**: WBTC

## 🔐 Security

- **No Private Keys on Frontend**: All sensitive operations happen server-side
- **User Wallet Approvals**: Users approve transactions through their own wallets
- **Environment Variables**: Sensitive data stored in .env files
- **CORS Protection**: Configured for secure cross-origin requests

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   1inch API     │
│                 │    │                 │    │                 │
│ • Wallet Connect│◄──►│ • Quote Logic   │◄──►│ • Fusion+ API   │
│ • Token Approval│    │ • Swap Params   │    │ • Cross-Chain   │
│ • User Interface│    │ • Network Sync  │    │ • Liquidity     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Usage

1. **Start Backend**: `npm start` in `backend-fusion-plus`
2. **Start Frontend**: `npm run dev` in root directory
3. **Connect Wallet**: Use MetaMask or other supported wallets
4. **Select Networks**: Choose from and to networks
5. **Select Tokens**: Choose tokens to swap
6. **Enter Amount**: Input the amount to swap
7. **Approve & Swap**: Approve token spending and execute swap

## 🔧 Troubleshooting

### Server Won't Start
- Check Node.js version (>= 18.0.0)
- Verify all dependencies installed: `npm install`
- Check port 9056 is available

### API Errors
- Verify .env file exists and is properly configured
- Check 1inch API key is valid (if using server-side quotes)
- Ensure all required environment variables are set

### Network Sync Issues
- Verify all networks in wagmi.ts match Swapper.js
- Check network names are consistent across all files
- Ensure chain IDs match exactly

## 📝 License

ISC License - see LICENSE file for details.
