const axios = require('axios');
const { ONEINCH_BASE_URL, getHeaders } = require('./config');

// Get cross-chain swap quote (Fusion+)
async function getCrossChainQuote(params) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/crosschain/quote`,
      {
        headers: getHeaders(),
        params: {
          sourceChain: params.sourceChain,
          destinationChain: params.destinationChain,
          sourceToken: params.sourceToken,
          destinationToken: params.destinationToken,
          amount: params.amount,
          user: params.user
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting cross-chain quote:', error.response?.data || error.message);
    throw error;
  }
}

// Create cross-chain swap order (Fusion+)
async function createCrossChainOrder(params) {
  try {
    const response = await axios.post(
      `${ONEINCH_BASE_URL}/fusion/crosschain/orders`,
      {
        sourceChain: params.sourceChain,
        destinationChain: params.destinationChain,
        sourceToken: params.sourceToken,
        destinationToken: params.destinationToken,
        sourceAmount: params.sourceAmount,
        destinationAmount: params.destinationAmount,
        user: params.user,
        receiver: params.receiver,
        permit: params.permit,
        nonce: params.nonce,
        deadline: params.deadline,
        signature: params.signature
      },
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating cross-chain order:', error.response?.data || error.message);
    throw error;
  }
}

// Get cross-chain order status
async function getCrossChainOrderStatus(orderHash) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/crosschain/orders/${orderHash}`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting cross-chain order status:', error.response?.data || error.message);
    throw error;
  }
}

// Get supported cross-chain routes
async function getCrossChainRoutes() {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/crosschain/routes`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting cross-chain routes:', error.response?.data || error.message);
    throw error;
  }
}

// Get cross-chain order history for a user
async function getUserCrossChainOrders(userAddress, limit = 10, offset = 0) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/crosschain/orders`,
      {
        headers: getHeaders(),
        params: {
          user: userAddress,
          limit: limit,
          offset: offset
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user cross-chain orders:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getCrossChainQuote,
  createCrossChainOrder,
  getCrossChainOrderStatus,
  getCrossChainRoutes,
  getUserCrossChainOrders
}; 