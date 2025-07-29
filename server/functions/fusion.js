const axios = require('axios');
const { ONEINCH_BASE_URL, getHeaders } = require('./config');

// Intent-based Swap (Fusion) - Create order
async function createFusionOrder(params) {
  try {
    const response = await axios.post(
      `${ONEINCH_BASE_URL}/fusion/orders`,
      {
        source: params.source,
        destination: params.destination,
        sourceAmount: params.sourceAmount,
        destinationAmount: params.destinationAmount,
        sourceToken: params.sourceToken,
        destinationToken: params.destinationToken,
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
    console.error('Error creating fusion order:', error.response?.data || error.message);
    throw error;
  }
}

// Get fusion order status
async function getFusionOrderStatus(orderHash) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/orders/${orderHash}`,
      {
        headers: getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting fusion order status:', error.response?.data || error.message);
    throw error;
  }
}

// Get all fusion orders for a user
async function getUserFusionOrders(userAddress, limit = 10, offset = 0) {
  try {
    const response = await axios.get(
      `${ONEINCH_BASE_URL}/fusion/orders`,
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
    console.error('Error getting user fusion orders:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createFusionOrder,
  getFusionOrderStatus,
  getUserFusionOrders
}; 