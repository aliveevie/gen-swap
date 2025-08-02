import { Balance } from 'wagmi';

export interface WalletState {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
}

export interface BalanceState {
  tokenBalance: Balance | undefined;
  nativeBalance: Balance | undefined;
  balanceLoading: boolean;
  nativeBalanceLoading: boolean;
}

export interface ApprovalParams {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  walletAddress: string;
  chainId: number;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface EIP712Types {
  EIP712Domain: Array<{ name: string; type: string }>;
  Order: Array<{ name: string; type: string }>;
}

export interface EIP712Message {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface ChainConfig {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
}