import { NetworkInfo } from '@/types/swap';

// Network configurations with chain IDs
export const NETWORKS: Record<string, NetworkInfo> = {
  ethereum: { id: 1, name: "Ethereum", symbol: "ETH", logo: "⟠" },
  arbitrum: { id: 42161, name: "Arbitrum", symbol: "ARB", logo: "🔷" },
  base: { id: 8453, name: "Base", symbol: "BASE", logo: "🔵" },
  polygon: { id: 137, name: "Polygon", symbol: "MATIC", logo: "🟣" },
  bsc: { id: 56, name: "BSC", symbol: "BNB", logo: "🟡" },
  avalanche: { id: 43114, name: "Avalanche", symbol: "AVAX", logo: "🔺" },
  optimism: { id: 10, name: "Optimism", symbol: "OP", logo: "🔵" },
  fantom: { id: 250, name: "Fantom", symbol: "FTM", logo: "👻" },
};

// API base URL
export const API_BASE_URL = 'https://gen-swap-server.vercel.app/api';

// Token decimals mapping
export const TOKEN_DECIMALS: Record<string, number> = {
  'USDC': 6, 
  'USDT': 6, 
  'DAI': 18, 
  'WETH': 18, 
  'WBTC': 8,
  'ETH': 18, 
  'MATIC': 18, 
  'BNB': 18, 
  'AVAX': 18, 
  'OP': 18, 
  'FTM': 18
};

// Native tokens list
export const NATIVE_TOKENS = ['ETH', 'MATIC', 'BNB', 'AVAX', 'OP', 'FTM'];

// 1inch Aggregation Router address
export const INCH_SPENDER_ADDRESS = '0x111111125421ca6dc452d289314280a0f8842a65';

// RPC URLs mapping
export const RPC_URLS: Record<string, string> = {
  '1': 'https://eth.llamarpc.com', // Ethereum
  '42161': 'https://arb1.arbitrum.io/rpc', // Arbitrum
  '8453': 'https://mainnet.base.org', // Base
  '137': 'https://polygon-rpc.com', // Polygon
  '56': 'https://bsc-dataseed.binance.org', // BSC
  '43114': 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
  '10': 'https://mainnet.optimism.io', // Optimism
  '250': 'https://rpc.ftm.tools' // Fantom
};

// Chain name to ID mapping for chat parsing
export const CHAIN_NAME_MAP: Record<string, string> = {
  'ethereum': '1',
  'eth': '1',
  'mainnet': '1',
  'arbitrum': '42161',
  'arb': '42161',
  'polygon': '137',
  'matic': '137',
  'base': '8453',
  'optimism': '10',
  'op': '10',
  'bsc': '56',
  'binance': '56',
  'avalanche': '43114',
  'avax': '43114',
  'fantom': '250',
  'ftm': '250'
};