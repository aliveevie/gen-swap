const { HashLock } = require("@1inch/cross-chain-sdk");
const { solidityPackedKeccak256 } = require('ethers');
const crypto = require('crypto');
const axios = require("axios");

function getRandomBytes32() {
    const bytes = crypto.randomBytes(32);
    const hexString = bytes.toString('hex');
    console.log('🔐 Raw bytes:', bytes);
    console.log('🔐 Hex string:', hexString);
    console.log('🔐 Final hex with 0x:', '0x' + hexString);
    return '0x' + hexString;
}

function submitOrder(quote, approve, walletAddress, eip712Signature, userRpcUrl) {
    console.log('🔐 Starting order submission with direct API...');
    console.log('🔐 Quote:', quote);
    console.log('🔐 Approve:', approve);
    console.log('🔐 Wallet address:', walletAddress);
    console.log('🔐 EIP-712 Signature:', eip712Signature ? 'Present' : 'Missing');
    console.log('The signature is:', eip712Signature);
    console.log('🔐 User RPC URL:', userRpcUrl);

    return new Promise(async (resolve, reject) => {
        try {
            if (!approve) {
                console.log("Approval is not required");
                resolve({ success: false, message: "Approval is not required" });
                return;
            }

            // Validate inputs
            if (!quote || typeof quote.getPreset !== 'function') {
                throw new Error('Invalid quote object - missing getPreset method');
            }

            if (!eip712Signature) {
                throw new Error('EIP-712 signature is required for order submission');
            }

            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            // Extract order details from quote
            const preset = quote.getPreset();
            console.log('🔐 Preset:', preset);
            
            if (!preset || typeof preset.secretsCount !== 'number') {
                throw new Error('Invalid preset - missing secretsCount');
            }
            
            const secretsCount = preset.secretsCount;
            console.log('🔐 Secrets count:', secretsCount);
            
            // Generate secrets and hashes
            const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
            console.log('🔐 Generated secrets array length:', secrets.length);
            
            const secretHashes = secrets.map((x, index) => {
                console.log(`🔐 Hashing secret ${index}:`, x);
                
                // Validate hex format
                if (!x.startsWith('0x') || x.length !== 66) {
                    throw new Error(`Invalid hex format for secret ${index}: ${x}`);
                }
                
                const hash = HashLock.hashSecret(x);
                console.log(`🔐 Secret ${index} hash:`, hash);
                return hash;
            });

            // Create hash lock
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

            // Extract order data from quote
            const orderData = {
                salt: preset.salt || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
                makerAsset: quote.srcTokenAddress,
                takerAsset: quote.dstTokenAddress,
                maker: walletAddress,
                receiver: '0x0000000000000000000000000000000000000000', // Zero address for receiver
                makingAmount: quote.srcTokenAmount.toString(),
                takingAmount: quote.dstTokenAmount.toString(),
                makerTraits: preset.makerTraits || '0'
            };

            console.log('🔐 Order data extracted:', orderData);

            // Prepare API request body
            const requestBody = {
                order: orderData,
                srcChainId: parseInt(quote.srcChainId || '1'),
                signature: eip712Signature,
                extension: "0x",
                quoteId: quote.quoteId || "string",
                secretHashes: secretHashes.map(hash => hash.toString())
            };

            console.log('🔐 API Request Body:', JSON.stringify(requestBody, null, 2));

            // Make API call to 1inch Fusion+ relayer
            const url = "https://api.1inch.dev/fusion-plus/relayer/v1.0/submit";
            
            const config = {
                headers: {
                    Authorization: `Bearer ${process.env.DEV_PORTAL_KEY}`,
                    'Content-Type': 'application/json'
                }
            };

            console.log('🔐 Making API call to:', url);
            console.log('🔐 Using auth key:', process.env.DEV_PORTAL_KEY ? 'Present' : 'Missing');

            const response = await axios.post(url, requestBody, config);
            
            console.log('✅ Order submitted successfully!');
            console.log('✅ Response:', response.data);
            
            const orderHash = response.data.orderHash || response.data.hash;
            
            // Start polling for order status
            console.log('🔍 Starting order status polling...');
            
            const pollOrderStatus = async () => {
                try {
                    const statusUrl = `https://api.1inch.dev/fusion-plus/relayer/v1.0/order/${orderHash}`;
                    const statusResponse = await axios.get(statusUrl, config);
                    
                    console.log('🔍 Order status:', statusResponse.data);
                    
                    if (statusResponse.data.status === 'executed') {
                        console.log('✅ Order executed successfully!');
                        resolve({ success: true, orderHash, status: 'executed', data: statusResponse.data });
                        return;
                    } else if (statusResponse.data.status === 'failed') {
                        console.error('❌ Order failed:', statusResponse.data);
                        reject(new Error(`Order failed: ${JSON.stringify(statusResponse.data)}`));
                        return;
                    }
                    
                    // Continue polling
                    setTimeout(pollOrderStatus, 5000);
                    
                } catch (error) {
                    console.error('❌ Error polling order status:', error);
                    // Continue polling even if there's an error
                    setTimeout(pollOrderStatus, 5000);
                }
            };
            
            // Start polling after 5 seconds
            setTimeout(pollOrderStatus, 5000);
            
            resolve({ success: true, orderHash, status: 'placed', data: response.data });
            
        } catch (error) {
            console.error('❌ Error in submitOrder:', error);
            
            if (error.response) {
                console.error('❌ API Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            
            reject(error);
        }
    });
}

module.exports = { submitOrder };