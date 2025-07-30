// Script to check token balance on Base network after cross-chain transfer
const { Web3 } = require('web3');
const env = require('dotenv');
const process = env.config().parsed;

// Configuration
const baseRpcUrl = 'https://mainnet.base.org'; // Base mainnet RPC
const walletAddress = process?.WALLET_ADDRESS;
const dstTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Validate environment variables
if (!walletAddress) {
    throw new Error("Missing WALLET_ADDRESS in .env file.");
}

const web3Instance = new Web3(baseRpcUrl);

// Function to check Base network balance
async function checkBaseBalance() {
    try {
        console.log('🔍 Checking Base network balance...');
        console.log('📍 Wallet Address:', walletAddress);
        console.log('🌐 Network: Base Mainnet');
        console.log('🔗 RPC URL:', baseRpcUrl);
        console.log('---');
        
        // Check ETH balance on Base
        const ethBalance = await web3Instance.eth.getBalance(walletAddress);
        console.log('💰 ETH Balance on Base:', web3Instance.utils.fromWei(ethBalance, 'ether'), 'ETH');
        
        // Check USDC balance on Base
        const usdcContract = new web3Instance.eth.Contract([
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            }
        ], dstTokenAddress);
        
        const usdcBalance = await usdcContract.methods.balanceOf(walletAddress).call();
        const usdcDecimals = await usdcContract.methods.decimals().call();
        const usdcSymbol = await usdcContract.methods.symbol().call();
        
        console.log('💵 USDC Balance on Base:', usdcBalance, 'wei');
        console.log('💵 USDC Balance on Base:', (BigInt(usdcBalance) / BigInt(10**BigInt(usdcDecimals))).toString(), `${usdcSymbol} (${usdcDecimals} decimals)`);
        
        // Get latest block info
        const latestBlock = await web3Instance.eth.getBlockNumber();
        console.log('📦 Latest Block on Base:', latestBlock);
        
        // Check if balance is greater than 0 (indicating successful transfer)
        if (BigInt(usdcBalance) > BigInt(0)) {
            console.log('✅ SUCCESS: USDC tokens received on Base network!');
            console.log('🎉 Cross-chain transfer completed successfully!');
            console.log(`💰 You received: ${(BigInt(usdcBalance) / BigInt(10**usdcDecimals)).toString()} ${usdcSymbol}`);
        } else {
            console.log('⚠️  No USDC tokens found on Base network yet.');
            console.log('⏳ The transfer might still be processing...');
        }
        
        return { ethBalance, usdcBalance, usdcDecimals, usdcSymbol };
        
    } catch (error) {
        console.error('❌ Error checking Base balance:', error.message);
        throw error;
    }
}

// Function to get recent transactions
async function getRecentTransactions() {
    try {
        console.log('\n🔍 Checking recent transactions...');
        
        // Get the latest block
        const latestBlock = await web3Instance.eth.getBlockNumber();
        console.log('📦 Latest Block:', latestBlock);
        
        // Get transactions from the last 10 blocks
        const transactions = [];
        for (let i = 0; i < 10; i++) {
            const blockNumber = latestBlock - i;
            const block = await web3Instance.eth.getBlock(blockNumber, true);
            
            if (block && block.transactions) {
                const relevantTxs = block.transactions.filter(tx => 
                    tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase() ||
                    tx.from && tx.from.toLowerCase() === walletAddress.toLowerCase()
                );
                
                transactions.push(...relevantTxs.map(tx => ({
                    blockNumber: blockNumber,
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    timestamp: block.timestamp
                })));
            }
        }
        
        if (transactions.length > 0) {
            console.log('📋 Recent transactions involving your wallet:');
            transactions.forEach((tx, index) => {
                console.log(`${index + 1}. Block ${tx.blockNumber} - ${tx.hash}`);
                console.log(`   From: ${tx.from}`);
                console.log(`   To: ${tx.to}`);
                console.log(`   Value: ${web3Instance.utils.fromWei(tx.value, 'ether')} ETH`);
                console.log(`   Time: ${new Date(tx.timestamp * 1000).toLocaleString()}`);
                console.log('---');
            });
        } else {
            console.log('📋 No recent transactions found for your wallet.');
        }
        
        return transactions;
        
    } catch (error) {
        console.error('❌ Error getting recent transactions:', error.message);
        throw error;
    }
}

// Main execution
(async () => {
    try {
        console.log('🚀 Starting Base network balance check...\n');
        
        // Check current balance
        await checkBaseBalance();
        
        // Get recent transactions
        await getRecentTransactions();
        
        console.log('\n✅ Base network check completed!');
        
    } catch (error) {
        console.error('❌ Error in main execution:', error);
    }
})(); 