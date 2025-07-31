import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  polygon, 
  bsc, 
  avalanche, 
  fantom, 
  arbitrum, 
  base, 
  optimism 
} from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'genSwaps',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || '504a7aec6fe71640750033fd6999d65c',
  chains: [
    mainnet,      // Ethereum (Chain ID: 1)
    arbitrum,     // Arbitrum (Chain ID: 42161)
    base,         // Base (Chain ID: 8453)
    polygon,      // Polygon (Chain ID: 137)
    bsc,          // BSC (Chain ID: 56)
    avalanche,    // Avalanche (Chain ID: 43114)
    optimism,     // Optimism (Chain ID: 10)
    fantom        // Fantom (Chain ID: 250)
  ],
  ssr: false,
}); 