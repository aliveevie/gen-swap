const { CrossChainSwapper } = require('./Swapper.js');

async function testQuote() {
  const swapper = new CrossChainSwapper();
  
  try {
    console.log('🔧 Initializing SDK for Arbitrum...');
    await swapper.initializeSDK('arbitrum');
    
    console.log('🔍 Getting quote for ETH swap...');
    
    const params = {
      srcChainId: 42161, // Arbitrum
      dstChainId: 8453,  // Base
      srcTokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum (for ETH swap)
      dstTokenAddress: '0x4200000000000000000000000000000000000006', // WETH on Base (for ETH swap)
      amount: '100000000000000', // 0.0001 ETH (smaller amount)
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

testQuote(); 