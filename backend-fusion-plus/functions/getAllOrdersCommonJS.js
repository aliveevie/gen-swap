const { SDK, NetworkEnum } = require("@1inch/cross-chain-sdk");
require("dotenv").config();
/**
 * Get all active orders from 1inch SDK
 * @param {string} authKey - The 1inch API key
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of orders per page (default: 10)
 * @returns {Promise<Array>} Array of active orders
 */
async function getAllOrders(authKey, page = 1, limit = 10) {
  
    console.log('🔍 Getting all active orders from 1inch SDK...');
    
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: `${process.env.DEV_PORTAL_KEY}`,
    });

    console.log('✅ SDK initialized with auth key');
    
    const orders = await sdk.getActiveOrders({ page, limit });
    
    console.log(orders);
   
}

getAllOrders();