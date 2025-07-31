const { CrossChainSwapper } = require('./Swapper.js');

async function checkOrderStatus(orderHash) {
  const swapper = new CrossChainSwapper();
  
  try {
    console.log(`🔍 Checking order status for: ${orderHash}`);
    await swapper.initializeSDK('arbitrum');
    
    const order = await swapper.sdk.getOrderStatus(orderHash);
    console.log(`📊 Order Status: ${order.status}`);
    console.log(`📋 Order Details:`, swapper.safeStringify(order));
    
    if (order.status === 'executed') {
      console.log(`🎉 SUCCESS! Cross-chain swap completed!`);
    } else if (order.status === 'pending') {
      console.log(`⏳ Still pending... Check again in 2-3 minutes`);
    } else {
      console.log(`📊 Current status: ${order.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking status: ${error.message}`);
  }
}

// Get order hash from command line arguments
const args = process.argv.slice(2);
const orderHash = args[0];

if (!orderHash) {
  console.log(`
🔍 Order Status Checker

Usage:
  node check-status.js <orderHash>

Examples:
  node check-status.js 0x4a8027d93735048b80155f69d04a04401d8ab73ffe6b84de647ee4add4a6ef47
  node check-status.js 0x1234567890abcdef...

Your recent order hash: 0x4a8027d93735048b80155f69d04a04401d8ab73ffe6b84de647ee4add4a6ef47
  `);
  process.exit(1);
}

// Validate order hash format
if (!orderHash.startsWith('0x') || orderHash.length !== 66) {
  console.error('❌ Invalid order hash format. Should be 0x followed by 64 hex characters.');
  process.exit(1);
}

console.log(`🚀 Checking status for order: ${orderHash}`);
checkOrderStatus(orderHash); 