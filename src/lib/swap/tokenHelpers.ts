import { TOKENS } from '@/lib/data';
import { NETWORKS, TOKEN_DECIMALS, NATIVE_TOKENS } from '@/lib/constants/networks';
import { TokenInfo } from '@/types/swap';

export const getTokenAddress = (networkId: string, tokenSymbol: string): string | null => {
  const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === networkId);
  if (!networkName || !TOKENS[networkName] || !TOKENS[networkName][tokenSymbol]) {
    return null;
  }
  return TOKENS[networkName][tokenSymbol];
};

export const getTokenAddressForBalance = (networkId: string, tokenSymbol: string): string | undefined => {
  // For native tokens like ETH, return undefined to use native balance
  if (tokenSymbol === 'ETH') {
    return undefined;
  }
  
  const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === networkId);
  if (!networkName || !TOKENS[networkName] || !TOKENS[networkName][tokenSymbol]) {
    return undefined;
  }
  return TOKENS[networkName][tokenSymbol] as `0x${string}`;
};

export const getTokenDecimals = (tokenSymbol: string): number => {
  return TOKEN_DECIMALS[tokenSymbol] || 18;
};

export const getFromTokens = (fromChain: string): TokenInfo[] => {
  const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === fromChain);
  if (!networkName || !TOKENS[networkName]) return [];
  
  return Object.keys(TOKENS[networkName]).map(symbol => ({
    symbol,
    name: symbol,
    logo: symbol === 'USDC' ? '💰' : symbol === 'USDT' ? '💵' : symbol === 'WETH' ? '⟠' : '🪙',
    address: TOKENS[networkName][symbol]
  }));
};

export const getToTokens = (toChain: string): TokenInfo[] => {
  const networkName = Object.keys(NETWORKS).find(key => NETWORKS[key].id.toString() === toChain);
  if (!networkName || !TOKENS[networkName]) return [];
  
  return Object.keys(TOKENS[networkName]).map(symbol => ({
    symbol,
    name: symbol,
    logo: symbol === 'USDC' ? '💰' : symbol === 'USDT' ? '💵' : symbol === 'WETH' ? '⟠' : '🪙',
    address: TOKENS[networkName][symbol]
  }));
};

export const formatBalance = (balance: any, decimals: number): string => {
  if (!balance || !balance.value) return '0.00';
  const formatted = (Number(balance.value) / Math.pow(10, decimals)).toFixed(6);
  // Remove trailing zeros after decimal
  return formatted.replace(/\.?0+$/, '');
};

export const isNativeToken = (tokenSymbol: string): boolean => {
  return NATIVE_TOKENS.includes(tokenSymbol);
};

export const convertToWei = (amount: string, tokenSymbol: string): string => {
  const decimals = getTokenDecimals(tokenSymbol);
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();
};

export const convertFromWei = (amount: string, tokenSymbol: string): string => {
  const decimals = getTokenDecimals(tokenSymbol);
  return (parseInt(amount) / Math.pow(10, decimals)).toString();
};