# GenSwap API Server Setup

## Prerequisites

1. Node.js (v16 or higher)
2. A 1inch Developer Portal API key
3. A wallet with private key and address
4. Some test tokens on supported networks

## Environment Variables

Create a `.env` file in the `fusion_api_impl` directory with the following variables:

```env
# 1inch Developer Portal API Key (Required for quotes)
DEV_PORTAL_KEY=your_1inch_api_key_here

# Server Configuration
PORT=9056
```

**Note**: No wallet private keys are needed on the server side. Users will sign transactions with their own wallets (MetaMask, etc.).

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`

3. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Networks
- `GET /api/networks` - Get all supported networks

### Tokens
- `GET /api/tokens/:networkName` - Get supported tokens for a network

### Quotes
- `POST /api/quote` - Get swap quote
  ```json
  {
    "fromChainId": 1,
    "toChainId": 137,
    "fromToken": "ETH",
    "toToken": "USDC",
    "amount": "0.1",
    "walletAddress": "0x..."
  }
  ```

### Swap Parameters
- `POST /api/swap-params` - Get swap parameters for user wallet execution
  ```json
  {
    "fromChainId": 1,
    "toChainId": 137,
    "fromToken": "ETH",
    "toToken": "USDC",
    "amount": "0.1",
    "walletAddress": "0x..."
  }
  ```
  
  **Response**: Returns quote, hash lock, and other parameters needed for the user's wallet to execute the swap.

### Balance
- `GET /api/balance/:networkName/:tokenSymbol/:address` - Check token balance

### Swap Status
- `GET /api/swap/status/:orderHash` - Get swap status

## Supported Networks

- Ethereum (1)
- Optimism (10)
- BSC (56)
- Polygon (137)
- Fantom (250)
- Arbitrum (42161)
- Avalanche (43114)
- Base (8453)

## Supported Tokens

Each network supports different tokens. Common tokens include:
- ETH/WETH
- USDC
- USDT
- DAI
- WBTC
- Native tokens (MATIC, BNB, AVAX, etc.)

## Frontend Integration

The server is configured to work with the React frontend running on:
- http://localhost:5173 (Vite default)
- http://localhost:3000 (Alternative)

## Testing

Test the server is running:
```bash
curl http://localhost:9056/api/health
```

Get supported networks:
```bash
curl http://localhost:9056/api/networks
```

## Troubleshooting

1. **API Key Issues**: Make sure your 1inch API key is valid and has sufficient credits
2. **Wallet Issues**: Ensure your wallet has sufficient balance for the swap
3. **Network Issues**: Check that you're connected to the correct network
4. **CORS Issues**: The server is configured for localhost development

## How It Works

1. **Server Role**: The server only provides quotes and swap parameters
2. **User Wallet**: Users sign transactions with their own wallets (MetaMask, etc.)
3. **No Server Keys**: No private keys are stored on the server
4. **User Control**: Users have full control over their transactions

## Security Notes

- Never commit your `.env` file to version control
- Only the 1inch API key is needed on the server
- Users control their own private keys and transactions
- Consider using environment-specific configurations for production 