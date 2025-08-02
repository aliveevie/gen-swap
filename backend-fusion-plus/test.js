require('dotenv').config();
const axios = require("axios");



async function httpCall() {
  const url = "https://api.1inch.dev/fusion-plus/relayer/v1.0/submit";

  const config = {
    headers: {
      Authorization: `Bearer ${process.env.DEV_PORTAL_KEY}`,
    },
    params: {},
    paramsSerializer: {
      indexes: null,
    },
  };
  const body = {
    order: {
      salt: "8868121686286005",
      maker: "0x6DBC17c7e398807dba3a7E0f80Ea686dEED35Eba",
      receiver: "0x0000000000000000000000000000000000000000",
      makingAmount: "1200000",
      takingAmount: "1140835",
      makerTraits: "0",
    },
    srcChainId: 42161,
    signature:
      "0x35579273903701e38fa5c5abaf7bb431e3a057e3295ac342ded1dcc3eee4fd667a04a1c4d216e0dd4fe53edf8c15cc18cc85ede0b7943e298ddfb9029bb8a3521b",
    extension: "0x",
    quoteId: "358a24d0-6033-4364-91f1-7127e4396ad4",
    secretHashes: [
      "0x3783a008c0f14652f03b5997abc2cb2f1ddebe74f944428bec7f909d15d69829",
    ],
  };

  try {
    const response = await axios.post(url, body, config);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

httpCall();
