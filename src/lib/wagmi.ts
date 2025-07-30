import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, bsc, avalanche, fantom } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'genSwaps',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || '504a7aec6fe71640750033fd6999d65c',
  chains: [mainnet, polygon, bsc, avalanche, fantom],
  ssr: false,
}); 