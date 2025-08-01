require('dotenv').config();
const axios = require("axios");

async function httpCall() {
  const url =
    "https://api.1inch.dev/fusion-plus/orders/v1.0/order/status/0x1ab8831b1d01cd4741dea6df32f41f347ea5592f74646487b1db6cfcfa446030";

  // Debug: Check if API key is loaded
  console.log("API Key loaded:", process.env.DEV_PORTAL_KEY ? "Yes" : "No");
  if (!process.env.DEV_PORTAL_KEY) {
    console.error("DEV_PORTAL_KEY environment variable is not set!");
    return;
  }

  const config = {
    headers: {
      Authorization: `Bearer ${process.env.DEV_PORTAL_KEY}`,
    },
    params: {},
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    const response = await axios.get(url, config);
    console.log(response.data);
  } catch (error) {
    console.error("Error response:", error.response?.data || error.message);
  }
}

httpCall();