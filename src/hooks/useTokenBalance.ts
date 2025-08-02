import { useBalance } from 'wagmi';
import { getTokenAddressForBalance, getTokenDecimals, formatBalance, isNativeToken } from '@/lib/swap/tokenHelpers';
import { BalanceState } from '@/types/wallet';

interface UseTokenBalanceProps {
  address: string | undefined;
  fromChain: string;
  fromToken: string;
}

export const useTokenBalance = ({ address, fromChain, fromToken }: UseTokenBalanceProps) => {
  // Get token balance using wagmi
  const tokenAddress = getTokenAddressForBalance(fromChain, fromToken);
  const { data: tokenBalance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
    token: tokenAddress,
    chainId: parseInt(fromChain),
  });

  // Get native token balance (ETH, MATIC, etc.)
  const { data: nativeBalance, isLoading: nativeBalanceLoading } = useBalance({
    address: address,
    chainId: parseInt(fromChain),
  });

  // Get current balance based on token type
  const getCurrentBalance = () => {
    if (isNativeToken(fromToken)) {
      return nativeBalance;
    }
    return tokenBalance;
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return false;
    
    const currentBalance = getCurrentBalance();
    if (!currentBalance || !currentBalance.value) return false;
    
    const decimals = getTokenDecimals(fromToken);
    const requiredAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
    const userBalance = currentBalance.value;
    
    return userBalance >= requiredAmount;
  };

  // Get balance loading state
  const getBalanceLoading = () => {
    if (isNativeToken(fromToken)) {
      return nativeBalanceLoading;
    }
    return balanceLoading;
  };

  // Get formatted balance for display
  const getFormattedBalance = () => {
    const currentBalance = getCurrentBalance();
    const decimals = getTokenDecimals(fromToken);
    return formatBalance(currentBalance, decimals);
  };

  return {
    tokenBalance,
    nativeBalance,
    balanceLoading,
    nativeBalanceLoading,
    getCurrentBalance,
    hasSufficientBalance,
    isBalanceLoading: getBalanceLoading,
    getFormattedBalance,
    refetchBalance
  };
};