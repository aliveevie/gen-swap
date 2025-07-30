const { Web3 } = require('web3');
require('dotenv').config();

async function wrapETH() {
  const web3 = new Web3('https://arb1.arbitrum.io/rpc');
  const privateKey = process.env.WALLET_KEY;
  const address = process.env.WALLET_ADDRESS;
  const wethAddress = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'; // WETH on Arbitrum
  
  if (!privateKey || !address) {
    console.error('❌ Missing WALLET_KEY or WALLET_ADDRESS in .env');
    return;
  }
  
  // WETH ABI (deposit function)
  const wethABI = [
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }
  ];
  
  try {
    console.log(`💰 Wrapping ETH to WETH...`);
    console.log(`📊 Wallet: ${address}`);
    
    // Check current balances
    const ethBalance = await web3.eth.getBalance(address);
    const ethBalanceEth = web3.utils.fromWei(ethBalance, 'ether');
    console.log(`📊 Current ETH Balance: ${ethBalanceEth} ETH`);
    
    // Amount to wrap (smaller amount to ensure it works)
    const wrapAmount = '50000000000000'; // 0.00005 ETH
    const wrapAmountEth = web3.utils.fromWei(wrapAmount, 'ether');
    
    if (BigInt(ethBalance) < BigInt(wrapAmount)) {
      console.error(`❌ Not enough ETH. Need ${wrapAmountEth} ETH, have ${ethBalanceEth} ETH`);
      return;
    }
    
    console.log(`🔄 Wrapping ${wrapAmountEth} ETH to WETH...`);
    
    // Create WETH contract instance
    const wethContract = new web3.eth.Contract(wethABI, wethAddress);
    
    // Create transaction
    const gasEstimate = await wethContract.methods.deposit().estimateGas({
      from: address,
      value: wrapAmount
    });
    
    const gasPrice = await web3.eth.getGasPrice();
    const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);
    
    console.log(`⛽ Gas Estimate: ${gasEstimate}`);
    console.log(`⛽ Gas Price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);
    console.log(`⛽ Gas Cost: ${web3.utils.fromWei(gasCost.toString(), 'ether')} ETH`);
    
    // Check if we have enough for gas + wrap
    const totalRequired = BigInt(wrapAmount) + gasCost;
    if (BigInt(ethBalance) < totalRequired) {
      console.error(`❌ Not enough ETH for wrap + gas. Need ${web3.utils.fromWei(totalRequired.toString(), 'ether')} ETH`);
      return;
    }
    
    // Build transaction
    const tx = {
      from: address,
      to: wethAddress,
      value: wrapAmount,
      gas: Math.floor(Number(gasEstimate) * 1.5), // 50% buffer for safety
      gasPrice: gasPrice,
      data: wethContract.methods.deposit().encodeABI()
    };
    
    // Sign and send transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`✅ ETH wrapped successfully!`);
    console.log(`🆔 Transaction Hash: ${receipt.transactionHash}`);
    console.log(`📊 Gas Used: ${receipt.gasUsed}`);
    
    // Check new balances
    const newEthBalance = await web3.eth.getBalance(address);
    const newEthBalanceEth = web3.utils.fromWei(newEthBalance, 'ether');
    
    const wethContract2 = new web3.eth.Contract([
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      }
    ], wethAddress);
    
    const wethBalance = await wethContract2.methods.balanceOf(address).call();
    const wethBalanceEth = web3.utils.fromWei(wethBalance, 'ether');
    
    console.log(`\n📊 New Balances:`);
    console.log(`📊 ETH: ${newEthBalanceEth} ETH`);
    console.log(`📊 WETH: ${wethBalanceEth} WETH`);
    
  } catch (error) {
    console.error('❌ Error wrapping ETH:', error.message);
  }
}

wrapETH(); 