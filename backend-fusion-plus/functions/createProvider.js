const { SDK } = require('@1inch/cross-chain-sdk');

// Get the auth key from environment variables
function getAuthKey() {
  const authKey = process.env.DEV_PORTAL_KEY;
  if (!authKey) {
    console.error('❌ DEV_PORTAL_KEY not found in environment variables');
    throw new Error('DEV_PORTAL_KEY is required for 1inch API access');
  }
  console.log('✅ DEV_PORTAL_KEY loaded successfully');
  return authKey;
}

// Create SDK with user's Web3 provider
function createSDK(web3Provider, authKey) {
  try {
    console.log('🔧 Creating 1inch SDK with user wallet provider...');
    console.log('👤 Using user\'s connected wallet (no server private keys)');
    console.log('🔐 Using DEV_PORTAL_KEY for API access only');
    
    if (!web3Provider) {
      throw new Error('Web3 provider is required');
    }
    
    if (!authKey) {
      throw new Error('Auth key is required');
    }

    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: authKey,
      blockchainProvider: web3Provider,
    });

    console.log('✅ SDK created successfully with user wallet provider');
    return sdk;
    
  } catch (error) {
    console.error('❌ Failed to create SDK:', error.message);
    console.error('❌ Error details:', error.stack);
    throw error;
  }
}

// Validate SDK creation
function validateSDK(sdk) {
  try {
    if (!sdk) {
      throw new Error('SDK is null or undefined');
    }
    
    // Check if SDK has required methods
    if (typeof sdk.getQuote !== 'function') {
      throw new Error('SDK missing getQuote method');
    }
    
    console.log('✅ SDK validation successful');
    console.log('🔍 SDK methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(sdk)).filter(name => typeof sdk[name] === 'function'));
    
    return true;
    
  } catch (error) {
    console.error('❌ SDK validation failed:', error.message);
    return false;
  }
}

// Combined function to create and validate SDK
function createSDKWithProvider(web3Provider) {
  try {
    console.log('🚀 Starting SDK creation process...');
    
    // Get auth key
    const authKey = getAuthKey();
    
    // Create SDK
    const sdk = createSDK(web3Provider, authKey);
    
    // Validate SDK
    const isValid = validateSDK(sdk);
    
    if (isValid) {
      console.log('🎉 SDK creation and validation completed successfully!');
      console.log('👤 User wallet provider integrated');
      console.log('🔐 API access configured with DEV_PORTAL_KEY');
      console.log('✅ Ready for TRUE DeFi operations');
    } else {
      throw new Error('SDK validation failed');
    }
    
    return sdk;
    
  } catch (error) {
    console.error('❌ SDK creation process failed:', error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  getAuthKey,
  createSDK,
  validateSDK,
  createSDKWithProvider
};