# Cross-Chain Swap Testing Guide

## 🚀 Complete Cross-Chain Swapper Implementation

This guide provides comprehensive testing instructions for all supported networks and tokens using the 1inch Fusion+ protocol.

## 📋 Prerequisites

### Environment Variables (.env file)
```env
WALLET_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here
DEV_PORTAL_KEY=your_1inch_api_key_here
```

### Required Funds
Ensure you have sufficient funds on the source network:
- **Native token** (ETH, MATIC, BNB, etc.) for gas fees
- **Token to swap** (USDC, USDT, WETH, etc.)

## 🌐 Supported Networks

| Network | Chain ID | RPC URL | Status |
|---------|----------|---------|---------|
| **Ethereum** | 1 | `https://eth.llamarpc.com` | ✅ |
| **Arbitrum** | 42161 | `https://arb1.arbitrum.io/rpc` | ✅ |
| **Base** | 8453 | `https://mainnet.base.org` | ✅ |
| **Polygon** | 137 | `https://polygon-rpc.com` | ✅ |
| **BSC** | 56 | `https://bsc-dataseed1.binance.org` | ✅ |
| **Avalanche** | 43114 | `https://api.avax.network/ext/bc/C/rpc` | ✅ |
| **Optimism** | 10 | `https://mainnet.optimism.io` | ✅ |
| **Fantom** | 250 | `https://rpc.ftm.tools` | ✅ |

## 🪙 Supported Tokens

### Ethereum
- USDC, USDT, WETH, DAI

### Arbitrum
- USDC, USDT, WETH, DAI

### Base
- USDC, USDbC, WETH, DAI

### Polygon
- USDC, USDT, WMATIC, DAI

### BSC
- USDC, USDT, WBNB, DAI

### Avalanche
- USDC, USDT, WAVAX, DAI

### Optimism
- USDC, USDT, WETH, DAI

### Fantom
- USDC, USDT, WFTM, DAI

## 🧪 Testing Commands

### 1. Test Setup
```bash
cd fusion_api_impl
npm run test-setup
```

**Expected Output:**
```
🧪 Testing setup...
📍 Wallet Address: 0x...
🔑 API Key: ✅ Set
🌐 Supported Networks: [ethereum, arbitrum, base, polygon, bsc, avalanche, optimism, fantom]
📋 ETHEREUM Tokens: [USDC, USDT, WETH, DAI]
📋 ARBITRUM Tokens: [USDC, USDT, WETH, DAI]
...
✅ Setup test completed
```

### 2. Check Balance
```bash
# Check USDC balance on Arbitrum
npm run check-balance arbitrum USDC

# Check WETH balance on Ethereum
npm run check-balance ethereum WETH

# Check USDT balance on Polygon
npm run check-balance polygon USDT
```

**Expected Output:**
```
🔧 Initializing SDK for Arbitrum...
✅ SDK initialized for Arbitrum
🔍 Checking USDC balance on Arbitrum...
💰 Arbitrum Native Balance: 0.0003 ETH
💵 USDC Balance: 1900000 wei
💵 USDC Balance: 1.900000 USDC
```

### 3. Cross-Chain Swap Tests

#### Test 1: Arbitrum → Base (USDC)
```bash
npm run test-arbitrum-base
```

**Command Details:**
- **From**: Arbitrum
- **To**: Base
- **Token**: USDC → USDC
- **Amount**: 1,000,000 wei (1 USDC)

**Expected Output:**
```
🚀 Starting cross-chain swap...
📤 From: Arbitrum (USDC)
📥 To: Base (USDC)
💰 Amount: 1000000
📍 Wallet: 0x...
---
🔧 Initializing SDK for Arbitrum...
✅ SDK initialized for Arbitrum
🔍 Checking USDC balance on Arbitrum...
💵 USDC Balance: 1.900000 USDC
🔐 Approving USDC on Arbitrum...
✅ USDC approval successful on Arbitrum
📋 Swap Parameters: {...}
🔍 Getting quote from 1inch Fusion+...
✅ Quote received successfully
📊 Quote Details: {...}
🔐 Generating 1 secrets for hash lock...
🔑 Secrets generated: [0x...]
🔒 Secret hashes: [0x...]
🔐 Hash lock created: {...}
📝 Placing cross-chain order...
✅ Order placed successfully!
🆔 Order Hash: 0x...
📊 Order Response: {...}
⏳ Monitoring order status...
🔄 Checking order status (attempt 1/60)...
📊 Order Status: pending
🔍 Found 1 fills ready for secret submission
🔐 Submitting secret for fill 0...
✅ Secret submitted for fill 0
🔄 Checking order status (attempt 2/60)...
📊 Order Status: executed
🎉 Order executed successfully!
✅ Cross-chain swap completed!
📋 Final Order Details: {...}
```

#### Test 2: Ethereum → Polygon (WETH → USDC)
```bash
npm run test-ethereum-polygon
```

**Command Details:**
- **From**: Ethereum
- **To**: Polygon
- **Token**: WETH → USDC
- **Amount**: 1,000,000,000,000,000,000 wei (1 WETH)

#### Test 3: Polygon → Arbitrum (USDC)
```bash
npm run test-polygon-arbitrum
```

#### Test 4: BSC → Ethereum (USDC)
```bash
npm run test-bsc-ethereum
```

#### Test 5: Avalanche → Base (USDC)
```bash
npm run test-avalanche-base
```

#### Test 6: Optimism → Polygon (USDC)
```bash
npm run test-optimism-polygon
```

#### Test 7: Fantom → Ethereum (USDC)
```bash
npm run test-fantom-ethereum
```

## 🔧 Custom Swap Commands

### Generic Swap Command
```bash
node functions/Swapper.js swap <fromNetwork> <toNetwork> <fromToken> <toToken> <amount>
```

### Examples:

#### USDC Swap (6 decimals)
```bash
# 1 USDC from Arbitrum to Base
node functions/Swapper.js swap arbitrum base USDC USDC 1000000

# 0.5 USDC from Polygon to Ethereum
node functions/Swapper.js swap polygon ethereum USDC USDC 500000

# 2 USDC from BSC to Avalanche
node functions/Swapper.js swap bsc avalanche USDC USDC 2000000
```

#### WETH Swap (18 decimals)
```bash
# 0.1 WETH from Ethereum to Polygon
node functions/Swapper.js swap ethereum polygon WETH USDC 100000000000000000

# 0.05 WETH from Arbitrum to Base
node functions/Swapper.js swap arbitrum base WETH WETH 50000000000000000
```

#### USDT Swap (6 decimals)
```bash
# 10 USDT from Polygon to Arbitrum
node functions/Swapper.js swap polygon arbitrum USDT USDT 10000000

# 5 USDT from BSC to Ethereum
node functions/Swapper.js swap bsc ethereum USDT USDT 5000000
```

## 📊 Verification Steps

### 1. Pre-Swap Verification
- ✅ Check source network balance
- ✅ Verify token approval
- ✅ Confirm quote received
- ✅ Validate swap parameters

### 2. During Swap
- ✅ Order placed successfully
- ✅ Order hash generated
- ✅ Secrets and hash locks created
- ✅ Monitoring order status

### 3. Post-Swap Verification
- ✅ Order status: "executed"
- ✅ Secrets submitted
- ✅ Cross-chain transfer completed
- ✅ Check destination network balance

## 🔍 Troubleshooting

### Common Issues:

#### 1. Insufficient Balance
```
❌ Error: not enough balance
```
**Solution**: Add more tokens to source network

#### 2. Network Connection Issues
```
❌ Error: FetchError: request to https://... failed
```
**Solution**: Check RPC URL or try alternative RPC

#### 3. Token Approval Required
```
❌ Error: ERC20: transfer amount exceeds allowance
```
**Solution**: Run approval process first

#### 4. API Key Issues
```
❌ Error: Missing required environment variables
```
**Solution**: Check .env file configuration

## 📈 Performance Metrics

### Expected Execution Times:
- **Quote Generation**: 2-5 seconds
- **Order Placement**: 5-10 seconds
- **Cross-Chain Transfer**: 30-120 seconds
- **Total Process**: 1-3 minutes

### Gas Costs:
- **Token Approval**: ~50,000 gas
- **Order Placement**: ~200,000 gas
- **Secret Submission**: ~50,000 gas

## 🎯 Success Criteria

A successful cross-chain swap should show:
1. ✅ Quote received with valid rates
2. ✅ Order placed with unique hash
3. ✅ Order status changes to "executed"
4. ✅ Tokens received on destination network
5. ✅ Balance verification on both networks

## 🔒 Security Features

- **Hash-Lock Mechanism**: Atomic cross-chain execution
- **Secret Generation**: Cryptographically secure random bytes
- **MEV Protection**: Fusion+ protocol protection
- **Order Monitoring**: Real-time status tracking
- **Error Handling**: Comprehensive error management

## 📝 Logging

The system provides detailed logging for:
- 🔧 SDK initialization
- 💰 Balance checks
- 🔐 Token approvals
- 📋 Swap parameters
- 🔍 Quote details
- 🔑 Secret generation
- 📝 Order placement
- ⏳ Status monitoring
- ✅ Completion confirmation

This comprehensive testing guide ensures you can verify all cross-chain swap functionality across all supported networks and tokens. 