require('dotenv').config();

const { SDK, NetworkEnum } = require("@1inch/cross-chain-sdk");

async function testGetQuote() {
  try {
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_KEY,
    });

    const params = {
      srcChainId: NetworkEnum.ETHEREUM,
      dstChainId: NetworkEnum.GNOSIS,
      srcTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
      dstTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      amount: "1000000000000000000000",
      walletAddress: "0x1234567890123456789012345678901234567890",
    };

    const quote = await sdk.getQuote(params);
    console.log('Quote received:', quote);
    return quote;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

// Run the test
testGetQuote().catch(console.error);