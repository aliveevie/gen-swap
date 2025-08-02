const { Web3 } = require('web3');

async function checkWETHBalance() {
  const web3 = new Web3('https://arb1.arbitrum.io/rpc');
  const address = '0x6DBC17c7e398807dba3a7E0f80Ea686dEED35Eba';
  const wethAddress = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'; // WETH on Arbitrum
  
  // WETH ABI (just balanceOf function)
  const wethABI = [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    }
  ];
  
  try {
    const wethContract = new web3.eth.Contract(wethABI, wethAddress);
    const wethBalance = await wethContract.methods.balanceOf(address).call();
    const wethBalanceEth = web3.utils.fromWei(wethBalance, 'ether');
    
    console.log(`💰 Wallet: ${address}`);
    console.log(`📊 WETH Balance: ${wethBalanceEth} WETH`);
    console.log(`📊 WETH Balance (wei): ${wethBalance} wei`);
    
    // Check if we have enough WETH for the swap
    const requiredAmount = '100000000000000'; // 0.0001 ETH
    const hasEnough = BigInt(wethBalance) >= BigInt(requiredAmount);
    
    console.log(`🔍 Required for swap: 0.0001 ETH (${requiredAmount} wei)`);
    console.log(`✅ Has enough WETH: ${hasEnough}`);
    
    if (!hasEnough) {
      const shortfall = BigInt(requiredAmount) - BigInt(wethBalance);
      console.log(`❌ Shortfall: ${shortfall} wei (${web3.utils.fromWei(shortfall.toString(), 'ether')} WETH)`);
      console.log(`💡 Need to wrap ETH to WETH first!`);
    }
    
  } catch (error) {
    console.error('❌ Error checking WETH balance:', error.message);
  }
}

checkWETHBalance(); 