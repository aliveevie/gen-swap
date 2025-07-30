const { CrossChainSwapper } = require('./Swapper.js');

async function testUSDC() {
  const swapper = new CrossChainSwapper();
  
  try {
    console.log('🔧 Initializing SDK for Arbitrum...');
    await swapper.initializeSDK('arbitrum');
    
    console.log('🔍 Getting quote for USDC swap...');
    
    const params = {
      srcChainId: 42161, // Arbitrum
      dstChainId: 8453,  // Base
      srcTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
      dstTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      amount: '100000', // 1 USDC
      enableEstimate: true,
      walletAddress: '0x6DBC17c7e398807dba3a7E0f80Ea686dEED35Eba'
    };

    console.log('📋 Quote Parameters:', JSON.stringify(params, null, 2));
    
    const quote = await swapper.sdk.getQuote(params);
    console.log('✅ Quote received successfully');
    console.log('📊 Quote Details:', swapper.safeStringify(quote));
    
    // Test order placement
    console.log('📝 Testing order placement...');
    
    const secretsCount = quote.getPreset().secretsCount;
    const secrets = Array.from({ length: secretsCount }).map(() => swapper.getRandomBytes32());
    const secretHashes = secrets.map(x => require('@1inch/cross-chain-sdk').HashLock.hashSecret(x));
    
    const hashLock = secretsCount === 1
      ? require('@1inch/cross-chain-sdk').HashLock.forSingleFill(secrets[0])
      : require('@1inch/cross-chain-sdk').HashLock.forMultipleFills(
          secretHashes.map((secretHash, i) =>
            require('ethers').solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
          )
        );

    const orderParams = {
      walletAddress: '0x6DBC17c7e398807dba3a7E0f80Ea686dEED35Eba',
      hashLock,
      secretHashes
    };

    console.log('📋 Order Parameters:', JSON.stringify(orderParams, null, 2));
    
    const orderResponse = await swapper.sdk.placeOrder(quote, orderParams);
    console.log('✅ Order placed successfully!');
    console.log('🆔 Order Hash:', orderResponse.orderHash);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', error);
    
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

testUSDC(); 