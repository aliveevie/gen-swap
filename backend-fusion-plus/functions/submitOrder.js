const { HashLock } = require("@1inch/cross-chain-sdk");
const { solidityPackedKeccak256 } = require('ethers');
const crypto = require('crypto');

function getRandomBytes32() {
    const bytes = crypto.randomBytes(32);
    const hexString = bytes.toString('hex');
    console.log('🔐 Raw bytes:', bytes);
    console.log('🔐 Hex string:', hexString);
    console.log('🔐 Final hex with 0x:', '0x' + hexString);
    return '0x' + hexString;
}

function submitOrder(quote, approve, walletAddress, eip712Signature, userRpcUrl) {
    console.log('🔐 Starting order submission...');
    console.log('🔐 Quote:', quote);
    console.log('🔐 Approve:', approve);
    console.log('🔐 Wallet address:', walletAddress);
    console.log('🔐 EIP-712 Signature:', eip712Signature ? 'Present' : 'Missing');
    console.log('🔐 User RPC URL:', userRpcUrl);

    // Validate quote object
    if (!quote || typeof quote.getPreset !== 'function') {
        throw new Error('Invalid quote object - missing getPreset method');
    }
    
    // Create a new SDK instance with signed data provider
    console.log('🔧 Creating new SDK instance with signed data provider');
    
    const { SDK } = require("@1inch/cross-chain-sdk");
    const { ethers } = require('ethers');
    
    // Create a provider that uses the user's RPC URL
    if (!userRpcUrl) {
        throw new Error('User RPC URL is required for order placement');
    }
    
    console.log('🌐 Creating provider with user RPC URL:', userRpcUrl);
    const provider = new ethers.JsonRpcProvider(userRpcUrl);
    
    // Create a signer that uses the pre-signed data
    const signer = {
        signTypedData: async (domain, types, value) => {
            console.log('🔐 Using pre-signed EIP-712 data');
            if (!eip712Signature) {
                throw new Error('EIP-712 signature is required for order placement');
            }
            return eip712Signature;
        },
        getAddress: async () => walletAddress
    };
    
    // Create a new SDK instance with the signer
    const sdk = new SDK({
        url: "https://api.1inch.dev/fusion-plus",
        authKey: process.env.DEV_PORTAL_KEY,
        blockchainProvider: provider,
        signer: signer
    });
    
    console.log('✅ Created new SDK instance with signed data provider');

    const preset = quote.getPreset();
    console.log('🔐 Preset:', preset);
    
    if (!preset || typeof preset.secretsCount !== 'number') {
        throw new Error('Invalid preset - missing secretsCount');
    }
    
    const secretsCount = preset.secretsCount;
    console.log('🔐 Secrets count:', secretsCount);
    
    const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
    console.log('🔐 Generated secrets array length:', secrets.length);
    secrets.forEach((secret, index) => {
        console.log(`🔐 Secret ${index}:`, secret);
        console.log(`🔐 Secret ${index} length:`, secret.length);
        console.log(`🔐 Secret ${index} starts with 0x:`, secret.startsWith('0x'));
        console.log(`🔐 Secret ${index} hex chars:`, secret.substring(2).length);
    });
    
    const secretHashes = secrets.map((x, index) => {
        console.log(`🔐 Hashing secret ${index}:`, x);
        console.log(`🔐 Secret ${index} type:`, typeof x);
        console.log(`🔐 Secret ${index} length:`, x.length);
        
        // Validate hex format
        if (!x.startsWith('0x') || x.length !== 66) { // 0x + 64 hex chars = 66
            throw new Error(`Invalid hex format for secret ${index}: ${x}`);
        }
        
        const hash = HashLock.hashSecret(x);
        console.log(`🔐 Secret ${index} hash:`, hash);
        return hash;
    });

    let hashLock;
    try {
        if (secretsCount === 1) {
            console.log('🔐 Creating single fill hash lock with secret:', secrets[0]);
            hashLock = HashLock.forSingleFill(secrets[0]);
        } else {
            console.log('🔐 Creating multiple fills hash lock');
            const packedHashes = secretHashes.map((secretHash, i) => {
                console.log(`🔐 Packing hash ${i}:`, secretHash);
                return solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()]);
            });
            console.log('🔐 Packed hashes:', packedHashes);
            hashLock = HashLock.forMultipleFills(packedHashes);
        }
        console.log('🔐 Hash lock created successfully:', hashLock);
    } catch (error) {
        console.error('❌ Error creating hash lock:', error);
        throw error;
    }

    return new Promise((resolve, reject) => {
        if (approve) {
            sdk.placeOrder(quote, {
                walletAddress: walletAddress,
                hashLock,
                secretHashes
            }).then(quoteResponse => {
                const orderHash = quoteResponse.orderHash;
                console.log(`Order successfully placed`);

                const intervalId = setInterval(() => {
                    console.log(`Polling for fills until order status is set to "executed"...`);
                    sdk.getOrderStatus(orderHash).then(order => {
                        if (order.status === 'executed') {
                            console.log(`Order is complete. Exiting.`);
                            clearInterval(intervalId);
                            resolve({ success: true, orderHash, status: 'executed' });
                        }
                    }).catch(error => {
                        console.error(`Error: ${JSON.stringify(error, null, 2)}`);
                        reject(error);
                    });

                    sdk.getReadyToAcceptSecretFills(orderHash)
                        .then((fillsObject) => {
                            if (fillsObject.fills.length > 0) {
                                fillsObject.fills.forEach(fill => {
                                    sdk.submitSecret(orderHash, secrets[fill.idx])
                                        .then(() => {
                                            console.log(`Fill order found! Secret submitted: ${JSON.stringify(secretHashes[fill.idx], null, 2)}`);
                                        })
                                        .catch((error) => {
                                            console.error(`Error submitting secret: ${JSON.stringify(error, null, 2)}`);
                                        });
                                });
                            }
                        })
                        .catch((error) => {
                            if (error.response) {
                                console.error('Error getting ready to accept secret fills:', {
                                    status: error.response.status,
                                    statusText: error.response.statusText,
                                    data: error.response.data
                                });
                            } else if (error.request) {
                                console.error('No response received:', error.request);
                            } else {
                                console.error('Error', error.message);
                            }
                        });
                }, 5000);

                resolve({ success: true, orderHash, status: 'placed' });
            }).catch((error) => {
                console.dir(error, { depth: null });
                reject(error);
            });
        } else {
            console.log("Approval is not required");
            resolve({ success: false, message: "Approval is not required" });
        }
    });
}

module.exports = { submitOrder };