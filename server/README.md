# GenSwap 1inch API Server

A comprehensive server that integrates with 1inch APIs to provide cross-chain swap functionality, following the [1inch Intent-based Swap (Fusion) API documentation](https://portal.1inch.dev/documentation/apis/swap/intent-swap/introduction).

## 🚀 Features

- **Swap Quotes**: Get real-time swap quotes across multiple chains
- **Token Swaps**: Execute token swaps using 1inch v6.0 API
- **Intent-based Swaps (Fusion)**: Advanced swap orders with MEV protection
- **Token Information**: Get supported tokens and prices
- **Multi-chain Support**: Ethereum, BSC, Polygon, Avalanche, Fantom, Arbitrum, Optimism, Base
- **Cross-chain Swaps**: Support for cross-chain token transfers

## 📋 Prerequisites

1. **1inch API Key**: Get your API key from [1inch Developer Portal](https://portal.1inch.dev/)
2. **Node.js**: Version 16 or higher
3. **npm**: For package management

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your 1inch API key:
   ```env
   ONEINCH_API_KEY=your-actual-api-key-here
   PORT=3001
   DEFAULT_CHAIN_ID=1
   ```

## 🏃‍♂️ Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## 🧪 Testing

Run the test suite to verify your API integration:

```bash
node test-api.js
```

## 📚 API Endpoints

### Health Check
```http
GET /api/health
```

### Get Quote
```http
POST /api/quote
Content-Type: application/json

{
  "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "toToken": "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8",
  "amount": "1000000000000000000",
  "chainId": 1
}
```

### Create Swap
```http
POST /api/swap
Content-Type: application/json

{
  "fromToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "toToken": "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8",
  "amount": "1000000000000000000",
  "fromAddress": "0x1234567890123456789012345678901234567890",
  "chainId": 1,
  "slippage": 1
}
```

### Create Fusion Order (Intent-based Swap)
```http
POST /api/fusion/order
Content-Type: application/json

{
  "source": "ethereum",
  "destination": "polygon",
  "sourceAmount": "1000000000000000000",
  "destinationAmount": "1000000",
  "sourceToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "destinationToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "user": "0x1234567890123456789012345678901234567890",
  "receiver": "0x1234567890123456789012345678901234567890",
  "permit": "0x...",
  "nonce": 1,
  "deadline": 1234567890,
  "signature": "0x..."
}
```

### Get Fusion Order Status
```http
GET /api/fusion/order/{orderHash}
```

### Get Supported Tokens
```http
GET /api/tokens/{chainId}
```

### Get Token Prices
```http
GET /api/prices/{chainId}?tokens=0x...,0x...,0x...
```

## 🔗 Supported Networks

| Network | Chain ID | Name |
|---------|----------|------|
| 1 | Ethereum Mainnet |
| 56 | BSC |
| 137 | Polygon |
| 43114 | Avalanche |
| 250 | Fantom |
| 42161 | Arbitrum |
| 10 | Optimism |
| 8453 | Base |

## 🪙 Common Token Addresses

### Ethereum Mainnet
- WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- USDC: `0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8`
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`

### Polygon
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- USDT: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- WMATIC: `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270`
- DAI: `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ONEINCH_API_KEY` | Your 1inch API key | Required |
| `PORT` | Server port | 3001 |
| `DEFAULT_CHAIN_ID` | Default network | 1 (Ethereum) |

### Network Configuration

To switch between mainnet and testnet:

- **Mainnet**: Use chain ID 1 (Ethereum)
- **Sepolia Testnet**: Use chain ID 11155111 (if supported by 1inch)

## 🚨 Error Handling

The server includes comprehensive error handling for:
- Invalid API keys
- Network connectivity issues
- Invalid token addresses
- Insufficient liquidity
- Transaction failures

## 🔒 Security

- API keys are stored in environment variables
- CORS is enabled for frontend integration
- Input validation for all endpoints
- Rate limiting (implemented by 1inch API)

## 📈 Usage Examples

### Frontend Integration

```javascript
// Get a quote
const quote = await fetch('/api/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
    amount: '1000000000000000000',
    chainId: 1
  })
});

// Execute a swap
const swap = await fetch('/api/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C8',
    amount: '1000000000000000000',
    fromAddress: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    slippage: 1
  })
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License

## 🆘 Support

For issues related to:
- **1inch API**: Check the [1inch Developer Portal](https://portal.1inch.dev/)
- **This Server**: Open an issue in the repository
- **General Questions**: Check the documentation above

---

**Note**: This server is designed to work with the 1inch API v6.0 and Fusion protocols. Make sure you have a valid API key and sufficient permissions for the endpoints you're using. 