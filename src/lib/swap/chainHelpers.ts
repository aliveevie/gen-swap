import { NETWORKS, RPC_URLS } from '@/lib/constants/networks';
import { ChainConfig } from '@/types/wallet';

export const getCurrentChain = (fromChain: string): ChainConfig => {
  const chainIdNum = parseInt(fromChain);
  switch (chainIdNum) {
    case 1: return { 
      id: 1, 
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } }
    };
    case 42161: return { 
      id: 42161, 
      name: 'Arbitrum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } }
    };
    case 8453: return { 
      id: 8453, 
      name: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.base.org'] } }
    };
    case 137: return { 
      id: 137, 
      name: 'Polygon',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: { default: { http: ['https://polygon-rpc.com'] } }
    };
    case 56: return { 
      id: 56, 
      name: 'BSC',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: { default: { http: ['https://bsc-dataseed.binance.org'] } }
    };
    case 43114: return { 
      id: 43114, 
      name: 'Avalanche',
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
      rpcUrls: { default: { http: ['https://api.avax.network/ext/bc/C/rpc'] } }
    };
    case 10: return { 
      id: 10, 
      name: 'Optimism',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } }
    };
    case 250: return { 
      id: 250, 
      name: 'Fantom',
      nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
      rpcUrls: { default: { http: ['https://rpc.ftm.tools'] } }
    };
    default: return { 
      id: 1, 
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } }
    };
  }
};

export const getRpcUrl = (chainId: string): string => {
  return RPC_URLS[chainId] || 'https://eth.llamarpc.com';
};

export const getNetworkName = (chainId: string): string => {
  const network = Object.values(NETWORKS).find(n => n.id.toString() === chainId);
  return network?.name || 'Unknown';
};