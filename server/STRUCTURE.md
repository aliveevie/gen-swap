# GenSwap Server Structure

## 🏗️ Modular Architecture Overview

The server has been refactored into a clean, modular structure with separate concerns:

```
server/
├── functions/           # 🔧 All API functions (modular)
│   ├── config.js       # Configuration and constants
│   ├── swap.js         # Swap-related functions
│   ├── fusion.js       # Fusion (Intent-based swap) functions
│   ├── tokens.js       # Token-related functions
│   ├── crosschain.js   # Cross-chain swap functions
│   ├── index.js        # Main export file
│   └── README.md       # Functions documentation
├── index.js            # 🚀 Main server file (routes only)
├── test-api.js         # 🧪 Test suite
├── package.json        # 📦 Dependencies and scripts
├── env.example         # 🔑 Environment variables template
├── README.md           # 📚 Main documentation
└── STRUCTURE.md        # 📋 This file
```

## 🔄 What Changed

### Before (Monolithic):
- All functions were in `index.js`
- Mixed concerns (server + business logic)
- Hard to maintain and test
- Difficult to reuse functions

### After (Modular):
- **`functions/` directory**: All business logic
- **`index.js`**: Only server routes and middleware
- **Clean separation**: Each file has a single responsibility
- **Easy testing**: Functions can be tested independently
- **Reusable**: Functions can be imported anywhere

## 📁 Function Modules

### `functions/config.js`
```javascript
// Configuration, constants, and utilities
const { ONEINCH_API_KEY, NETWORKS, TOKENS, getHeaders } = require('./config');
```

### `functions/swap.js`
```javascript
// Swap quotes and transactions
const { getQuote, createSwap } = require('./swap');
```

### `functions/fusion.js`
```javascript
// Intent-based swaps (Fusion)
const { createFusionOrder, getFusionOrderStatus } = require('./fusion');
```

### `functions/tokens.js`
```javascript
// Token information and balances
const { getSupportedTokens, getTokenPrices } = require('./tokens');
```

### `functions/crosschain.js`
```javascript
// Cross-chain swaps (Fusion+)
const { getCrossChainQuote, createCrossChainOrder } = require('./crosschain');
```

## 🚀 Server Actions (index.js)

The main server file now only contains:

1. **Express setup** (middleware, CORS)
2. **Route definitions** (API endpoints)
3. **Error handling** (404, global error handler)
4. **Server startup** (port listening)

All business logic is imported from the `functions/` directory.

## 🧪 Testing

```bash
# Start the server
npm run dev

# Run tests (in another terminal)
npm test
```

## 📊 API Endpoints

### Swap Routes
- `POST /api/quote` - Get swap quotes
- `POST /api/swap` - Execute swaps

### Fusion Routes
- `POST /api/fusion/order` - Create Fusion orders
- `GET /api/fusion/order/:orderHash` - Check order status
- `GET /api/fusion/orders/:userAddress` - Get user orders

### Token Routes
- `GET /api/tokens/:chainId` - Get supported tokens
- `GET /api/prices/:chainId` - Get token prices
- `GET /api/token/:chainId/:tokenAddress` - Get token metadata
- `GET /api/balances/:chainId/:walletAddress` - Get wallet balances

### Cross-chain Routes
- `POST /api/crosschain/quote` - Get cross-chain quotes
- `POST /api/crosschain/order` - Create cross-chain orders
- `GET /api/crosschain/order/:orderHash` - Check cross-chain order status
- `GET /api/crosschain/routes` - Get available routes
- `GET /api/crosschain/orders/:userAddress` - Get user cross-chain orders

## 🔧 Benefits of This Structure

1. **Maintainability**: Easy to find and update specific functionality
2. **Testability**: Functions can be tested in isolation
3. **Reusability**: Functions can be imported by other parts of the application
4. **Scalability**: Easy to add new modules without cluttering the main server file
5. **Readability**: Clear separation of concerns
6. **Debugging**: Easier to trace issues to specific modules

## 🎯 Perfect for 1inch Bounty

This modular structure demonstrates:
- ✅ **Multiple 1inch API integrations** (Swap, Fusion, Cross-chain)
- ✅ **Intent-based swap functionality** (Fusion protocol)
- ✅ **Cross-chain capabilities** (Fusion+)
- ✅ **Comprehensive error handling**
- ✅ **Production-ready code structure**
- ✅ **Easy to extend and maintain**

## 🚀 Next Steps

1. **Get 1inch API Key**: Add your key to `.env`
2. **Test with real data**: Run `npm test` with valid API key
3. **Frontend integration**: Connect your React app to these endpoints
4. **Add more features**: Extend with additional 1inch APIs as needed 