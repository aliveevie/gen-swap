require('dotenv').config();

const { SDK, NetworkEnum } = require("@1inch/cross-chain-sdk");

async function getQuote(srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, walletAddress) {
  try {
    // Console.log all the parameters coming from the UI
    console.log('🔍 getQuote.js - Parameters received from UI:');
    console.log('📋 srcChainId:', srcChainId);
    console.log('📋 dstChainId:', dstChainId);
    console.log('📋 srcTokenAddress:', srcTokenAddress);
    console.log('📋 dstTokenAddress:', dstTokenAddress);
    console.log('📋 amount:', amount);
    console.log('📋 walletAddress:', walletAddress);
    console.log('📋 Full parameters object:', {
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress
    });

    // Validate amount is not 0
    if (!amount || amount === '0' || parseInt(amount) === 0) {
      throw new Error('Amount cannot be 0. Please enter a valid amount.');
    }

    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_KEY,
    });

    // Use the correct parameters format from test-quote.js
    const params = {
      srcChainId: srcChainId, // Pass as number, not NetworkEnum
      dstChainId: dstChainId, // Pass as number, not NetworkEnum
      srcTokenAddress: srcTokenAddress,
      dstTokenAddress: dstTokenAddress,
      amount: amount,
      enableEstimate: true, // Add this parameter
      walletAddress: walletAddress,
    };

    console.log('🚀 SDK params being sent to 1inch:', params);

    const quote = await sdk.getQuote(params);
    console.log('✅ Quote received from 1inch:', quote);
    
    // Extract the dstTokenAmount and convert BigInt to string
    const dstTokenAmount = quote.dstTokenAmount ? quote.dstTokenAmount.toString() : '0';
    console.log('💰 dstTokenAmount extracted:', dstTokenAmount);
    
    return {
      success: true,
      dstTokenAmount: dstTokenAmount,
      quoteId: quote.quoteId,
      slippage: quote.slippage,
      recommendedPreset: quote.recommendedPreset
    };
  } catch (error) {
    console.error('❌ Error getting quote:', error);
    throw error;
  }
}

module.exports = { getQuote };