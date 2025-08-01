const { SDK, NetworkEnum, HashLock } = require('@1inch/cross-chain-sdk');
const { solidityPackedKeccak256, randomBytes } = require('ethers');

// Helper function to generate random bytes32
function getRandomBytes32() {
  return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

/**
 * Place a cross-chain swap order using 1inch Fusion SDK
 * @param {Object} sdk - The initialized 1inch SDK instance
 * @param {number} srcChainId - Source chain ID
 * @param {number} dstChainId - Destination chain ID
 * @param {string} srcTokenAddress - Source token address
 * @param {string} dstTokenAddress - Destination token address
 * @param {string} amount - Amount in wei
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Order placement result with order hash and details
 */
async function placeOrder(sdk, srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress) {
  try {
    console.log('🚀 Starting order placement process...');
    console.log('📋 Order parameters:', {
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress
    });

    // Validate required parameters
    if (!sdk) {
      throw new Error('SDK instance is required');
    }
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      throw new Error('Missing required parameters for order placement');
    }

    // Validate SDK methods
    if (typeof sdk.getQuote !== 'function') {
      throw new Error('SDK does not have getQuote method');
    }
    if (typeof sdk.placeOrder !== 'function') {
      throw new Error('SDK does not have placeOrder method');
    }

    // Prepare quote parameters
    const quoteParams = {
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      enableEstimate: true,
      walletAddress: walletAddress,
    };

    console.log('🔍 Getting quote for order placement...');
    console.log('📋 Quote parameters:', quoteParams);

    // Get quote first
    const quote = await sdk.getQuote(quoteParams);
    console.log('✅ Quote received successfully');

    // Generate secrets and hash lock
    const secretsCount = quote.getPreset().secretsCount;
    console.log('🔐 Secrets count from quote preset:', secretsCount);

    const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
    const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

    console.log('🔑 Generated secrets:', secrets.length);
    console.log('🔒 Generated secret hashes:', secretHashes.length);

    // Create hash lock
    const hashLock = secretsCount === 1
      ? HashLock.forSingleFill(secrets[0])
      : HashLock.forMultipleFills(
          secretHashes.map((secretHash, i) =>
            solidityPackedKeccak256(
              ["uint64", "bytes32"],
              [i, secretHash.toString()],
            ),
          ),
        );

    console.log('🔒 Hash lock created successfully');

    // Place order using placeOrder method (as per reference implementation)
    console.log('📝 Placing order with SDK...');
    console.log('📋 Order placement parameters:', {
      walletAddress,
      hashLock: hashLock.value || hashLock,
      secretHashes
    });

    const orderResponse = await sdk.placeOrder(quote, {
      walletAddress: walletAddress,
      hashLock,
      secretHashes
    });

    console.log('✅ Order placed successfully');
    console.log('📋 Order response type:', typeof orderResponse);
    console.log('📋 Order response keys:', Object.keys(orderResponse || {}));
    
    // Extract order hash from response
    const orderHash = orderResponse.orderHash;
    console.log('🔗 Order hash:', orderHash);

    if (!orderHash) {
      throw new Error('Order placed but no order hash received');
    }

    // Prepare result object
    const result = {
      success: true,
      orderHash: orderHash,
      order: orderResponse,
      quote: quote,
      secrets: secrets,
      secretHashes: secretHashes,
      hashLock: hashLock,
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      walletAddress: walletAddress,
      status: 'placed',
      timestamp: new Date().toISOString(),
      message: 'Order placed successfully'
    };

    console.log('✅ Order placement completed successfully');
    console.log('🔗 Order hash:', orderHash);
    console.log('📊 Order status: placed');

    return result;

  } catch (error) {
    console.error('❌ Order placement failed:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);

    throw new Error(`Order placement failed: ${error.message}`);
  }
}

/**
 * Helper function to convert BigInt values to strings for JSON serialization
 * @param {any} obj - Object to convert
 * @returns {any} Object with BigInt values converted to strings
 */
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  
  return obj;
}

/**
 * Place order with JSON serialization handling
 * @param {Object} sdk - The initialized 1inch SDK instance
 * @param {number} srcChainId - Source chain ID
 * @param {number} dstChainId - Destination chain ID
 * @param {string} srcTokenAddress - Source token address
 * @param {string} dstTokenAddress - Destination token address
 * @param {string} amount - Amount in wei
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Serializable order placement result
 */
async function placeOrderSerializable(sdk, srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress) {
  try {
    const result = await placeOrder(sdk, srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress);
    
    // Convert BigInt values to strings for JSON serialization
    const serializableResult = convertBigIntToString(result);
    
    return serializableResult;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  placeOrder,
  placeOrderSerializable,
  convertBigIntToString
}; 