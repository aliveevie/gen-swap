# Functions Directory

This directory contains all the modular functions for the 1inch API server, organized by functionality.

## 📁 File Structure

```
functions/
├── config.js          # Configuration and constants
├── swap.js           # Swap-related functions (quotes, transactions)
├── fusion.js         # Fusion (Intent-based swap) functions
├── tokens.js         # Token-related functions (metadata, prices, balances)
├── crosschain.js     # Cross-chain swap functions (Fusion+)
└── index.js          # Main export file
```

## 🔧 Modules

### `config.js`
- API configuration and constants
- Network definitions
- Token address mappings
- Header generation

### `swap.js`
- `getQuote()` - Get swap quotes
- `createSwap()` - Execute swap transactions

### `fusion.js`
- `createFusionOrder()` - Create intent-based swap orders
- `getFusionOrderStatus()` - Check order status
- `getUserFusionOrders()` - Get user's fusion orders

### `tokens.js`
- `getSupportedTokens()` - Get supported tokens for a chain
- `getTokenPrices()` - Get token prices
- `getTokenMetadata()` - Get token information
- `getWalletTokenBalances()` - Get wallet token balances

### `crosschain.js`
- `getCrossChainQuote()` - Get cross-chain swap quotes
- `createCrossChainOrder()` - Create cross-chain orders
- `getCrossChainOrderStatus()` - Check cross-chain order status
- `getCrossChainRoutes()` - Get available cross-chain routes
- `getUserCrossChainOrders()` - Get user's cross-chain orders

## 📦 Usage

Import all functions:
```javascript
const functions = require('./functions');
```

Import specific modules:
```javascript
const { getQuote, createSwap } = require('./functions/swap');
const { createFusionOrder } = require('./functions/fusion');
```

## 🔄 Benefits of Modular Structure

1. **Separation of Concerns**: Each file handles specific functionality
2. **Maintainability**: Easier to update and debug specific features
3. **Reusability**: Functions can be imported individually
4. **Testing**: Easier to test individual modules
5. **Scalability**: Easy to add new functionality modules

## 🚀 Adding New Functions

1. Create a new file in the `functions/` directory
2. Export your functions
3. Add the exports to `functions/index.js`
4. Import in `server/index.js` if needed for API routes 