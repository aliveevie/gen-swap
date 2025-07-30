# 🚀 Cross-Chain Swapper - Flexible & User-Friendly

A complete cross-chain swapping system using 1inch Fusion+ protocol that lets you specify your own amounts and networks.

## 🎯 Quick Start

### 1. Setup Environment
```bash
# Copy your environment variables
cp ../fusion-plus-order/.env .env

# Edit .env with your details
WALLET_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here
DEV_PORTAL_KEY=your_1inch_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Setup
```bash
npm run test-setup
```

## 🔄 Cross-Chain Swaps

### Basic Swap Command
```bash
node cli.js swap <fromNetwork> <fromToken> <toNetwork> <toToken> <amount>
```

### Examples
```bash
# Swap 1.5 USDC from Arbitrum to Base
node cli.js swap arbitrum usdc base usdc 1.5

# Swap 0.1 WETH from Ethereum to Polygon USDC
node cli.js swap ethereum weth polygon usdc 0.1

# Swap 100 USDT from Polygon to Arbitrum
node cli.js swap polygon usdt arbitrum usdt 100

# Swap 0.05 ETH from Ethereum to Base
node cli.js swap ethereum eth base eth 0.05
```

## 🔍 Check Balances

### Check Balance Command
```bash
node cli.js check <network> [token]
```

### Examples
```bash
# Check USDC balance on Arbitrum
node cli.js check arbitrum usdc

# Check WETH balance on Ethereum
node cli.js check ethereum weth

# Check native token balance (default)
node cli.js check arbitrum
```

## 🌐 Supported Networks
- **ethereum** - Ethereum Mainnet
- **arbitrum** - Arbitrum One
- **base** - Coinbase Base
- **polygon** - Polygon PoS
- **bsc** - BNB Smart Chain
- **avalanche** - Avalanche C-Chain
- **optimism** - Optimism
- **fantom** - Fantom Opera

## 🪙 Supported Tokens
- **usdc** - USD Coin
- **usdt** - Tether USD
- **weth** - Wrapped Ether
- **dai** - Dai Stablecoin
- **wbtc** - Wrapped Bitcoin
- **eth** - Native Ether
- **matic** - Polygon MATIC
- **bnb** - BNB
- **avax** - Avalanche
- **op** - Optimism
- **ftm** - Fantom

## 💡 Key Features

✅ **Human-Readable Amounts** - Use 1.5 instead of 1500000  
✅ **Flexible Network Selection** - Choose any supported network pair  
✅ **Automatic Token Conversion** - Converts human amounts to proper decimals  
✅ **Real-Time Balance Checking** - Verify your balances before swapping  
✅ **Detailed Logging** - See every step of the swap process  
✅ **Order Monitoring** - Track your swap status in real-time  

## 📊 Amount Examples

| Token | Human Amount | Wei Amount |
|-------|-------------|------------|
| USDC | 1.5 | 1500000 |
| WETH | 0.1 | 100000000000000000 |
| USDT | 100 | 100000000 |
| ETH | 0.05 | 50000000000000000 |

## ⚠️ Important Notes

1. **Ensure sufficient funds** on the source network for both the token amount and gas fees
2. **Token approval** is handled automatically for the first swap
3. **Cross-chain swaps** can take 2-5 minutes to complete
4. **Monitor the console** for real-time status updates
5. **Keep your private key secure** and never share it

## 🚨 Troubleshooting

- **"Not enough balance"** - Add more funds to the source network
- **"Token not supported"** - Check the supported tokens list
- **"Network not supported"** - Verify the network name spelling
- **"Invalid amount"** - Use decimal format (e.g., 1.5, not 1,5)

## 🎉 Success!

When your swap completes successfully, you'll see:
- ✅ Order executed successfully
- 🎉 Cross-chain swap completed
- 📋 Final order details with transaction hashes
