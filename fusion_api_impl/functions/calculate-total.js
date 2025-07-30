const { Web3 } = require('web3');

function calculateTotalRequired() {
  const web3 = new Web3();
  
  // From the quote response
  const swapAmount = '100000000000000'; // 0.0001 ETH
  const safetyDeposit = '4825800000000'; // 0.0000048258 ETH
  
  // Estimate gas fees (typical for Arbitrum)
  const estimatedGas = 500000; // 500k gas
  const gasPrice = '100000000'; // 0.1 gwei (typical for Arbitrum)
  const gasCost = BigInt(estimatedGas) * BigInt(gasPrice);
  
  const totalRequired = BigInt(swapAmount) + BigInt(safetyDeposit) + gasCost;
  
  console.log('💰 ETH Requirements:');
  console.log(`📊 Swap Amount: ${web3.utils.fromWei(swapAmount, 'ether')} ETH`);
  console.log(`🔒 Safety Deposit: ${web3.utils.fromWei(safetyDeposit, 'ether')} ETH`);
  console.log(`⛽ Gas Cost: ${web3.utils.fromWei(gasCost.toString(), 'ether')} ETH`);
  console.log(`💸 Total Required: ${web3.utils.fromWei(totalRequired.toString(), 'ether')} ETH`);
  
  // Check against available balance
  const availableBalance = '298237400944000'; // 0.000298237400944 ETH
  const hasEnough = BigInt(availableBalance) >= totalRequired;
  
  console.log(`\n📊 Available Balance: ${web3.utils.fromWei(availableBalance, 'ether')} ETH`);
  console.log(`✅ Has enough: ${hasEnough}`);
  
  if (!hasEnough) {
    const shortfall = totalRequired - BigInt(availableBalance);
    console.log(`❌ Shortfall: ${web3.utils.fromWei(shortfall.toString(), 'ether')} ETH`);
  }
}

calculateTotalRequired(); 