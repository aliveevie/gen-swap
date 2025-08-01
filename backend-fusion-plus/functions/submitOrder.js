const { HashLock } = require("@1inch/cross-chain-sdk");
const { solidityPackedKeccak256, randomBytes } = require('ethers');

function getRandomBytes32() {
    return randomBytes(32);
}

function submitOrder(quote, sdk, approve, walletAddress) {
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