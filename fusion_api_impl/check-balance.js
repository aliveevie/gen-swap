const { Web3 } = require('web3');

async function checkBalance() {
  const web3 = new Web3('https://arb1.arbitrum.io/rpc');
  const address = '0x6DBC17c7e398807dba3a7E0f80Ea686dEED35Eba';
  
  try {
    const balance = await web3.eth.getBalance(address);
    const ethBalance = web3.utils.fromWei(balance, 'ether');
    
    console.log(`💰 Wallet: ${address}`);
    console.log(`📊 ETH Balance: ${ethBalance} ETH`);
    console.log(`📊 Wei Balance: ${balance} wei`);
    
    // Check if we have enough for 0.001 ETH swap
    const requiredAmount = '1000000000000000'; // 0.001 ETH
    const hasEnough = BigInt(balance) >= BigInt(requiredAmount);
    
    console.log(`🔍 Required for swap: 0.001 ETH (${requiredAmount} wei)`);
    console.log(`✅ Has enough: ${hasEnough}`);
    
    if (!hasEnough) {
      const shortfall = BigInt(requiredAmount) - BigInt(balance);
      console.log(`❌ Shortfall: ${shortfall} wei (${web3.utils.fromWei(shortfall.toString(), 'ether')} ETH)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkBalance(); 