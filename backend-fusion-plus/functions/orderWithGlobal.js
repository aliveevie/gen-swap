// CommonJS syntax for orderWithGlobal.js
const { HashLock } = require("@1inch/cross-chain-sdk");
const { solidityPackedKeccak256, randomBytes } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

function getRandomBytes32() {
    return '0x' + randomBytes(32).toString('hex');
}

function Swapping(params, sdk, appove) {
    if (appove) {
    sdk.getQuote(params).then(quote => {
        const secretsCount = quote.getPreset().secretsCount;
        const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
        const secretHashes = secrets.map(x => HashLock.hashSecret(x));

        const hashLock = secretsCount === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(
                secretHashes.map((secretHash, i) =>
                    solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
                )
            );

        console.log("Received Fusion+ quote from 1inch API");

        sdk.placeOrder(quote, {
            walletAddress: params.walletAddress,
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
                        }
                    }
                ).catch(error =>
                    console.error(`Error: ${JSON.stringify(error, null, 2)}`)
                );

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
                            // The request was made and the server responded with a status code
                            // that falls out of the range of 2xx
                            console.error('Error getting ready to accept secret fills:', {
                                status: error.response.status,
                                statusText: error.response.statusText,
                                data: error.response.data
                            });
                        } else if (error.request) {
                            // The request was made but no response was received
                            console.error('No response received:', error.request);
                        } else {
                            // Something happened in setting up the request that triggered an Error
                            console.error('Error', error.message);
                        }
                    });
            }, 5000);
        }).catch((error) => {
            console.dir(error, { depth: null });
        });
    }).catch((error) => {
        console.dir(error, { depth: null });
    });
    } else {
        console.log("Approval is not required");
    }
}

module.exports = { Swapping };
