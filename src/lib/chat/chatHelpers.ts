import { CHAIN_NAME_MAP } from '@/lib/constants/networks';
import { SwapRequest } from '@/types/chat';

export const parseSwapRequest = (message: string): SwapRequest => {
  const lowerMessage = message.toLowerCase();
  
  // Pattern: "swap [amount] [token] on [fromChain] to [toChain]"
  const swapPattern = /swap\s+([\d.]+)\s+(\w+)\s+on\s+(\w+)\s+to\s+(\w+)/i;
  const match = message.match(swapPattern);
  
  if (match) {
    const [, amount, token, fromChainName, toChainName] = match;
    
    const fromChainId = CHAIN_NAME_MAP[fromChainName.toLowerCase()];
    const toChainId = CHAIN_NAME_MAP[toChainName.toLowerCase()];
    
    if (fromChainId && toChainId) {
      return {
        type: 'swap_request',
        amount: parseFloat(amount),
        token: token.toUpperCase(),
        fromChain: fromChainId,
        toChain: toChainId,
        isValid: true
      };
    }
  }
  
  return { type: 'other', isValid: false };
};

export const formatMessageContent = (content: string) => {
  return content.split('\n').map((line, index) => ({
    id: index,
    type: line.startsWith('## ') ? 'h3' :
          line.startsWith('### ') ? 'h4' :
          line.startsWith('- **') ? 'bold-item' :
          line.startsWith('- ') ? 'list-item' :
          line.trim() === '' ? 'spacer' : 'text',
    content: line,
    parts: line.startsWith('- **') ? line.replace('- **', '').split(':**') : null
  }));
};