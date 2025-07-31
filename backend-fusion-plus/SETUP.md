# Backend Setup Guide

## Environment Variables

Create a `.env` file in the `backend-fusion-plus` directory:

```env
# Server Configuration
PORT=9056

# 1inch API Configuration (Optional - for server-side quotes)
# Get your API key from: https://portal.1inch.dev/
DEV_PORTAL_KEY=your_1inch_api_key_here

# Wallet Configuration (Optional - for server-side execution)
# WARNING: Only use for testing, never in production
WALLET_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here
```

## Important Notes

1. **DEV_PORTAL_KEY**: Optional. If not provided, the server will use realistic mock quotes
2. **WALLET_KEY & WALLET_ADDRESS**: Optional. The application is designed for user wallet approval, not server-side execution
3. **User Approval Flow**: Users will approve transactions through their own wallets (MetaMask, etc.)

## Security

- ✅ **No Private Keys on Frontend**: All sensitive operations are server-side
- ✅ **User Wallet Approvals**: Users control their own transactions
- ✅ **Environment Variables**: Sensitive data stored securely
- ✅ **Client-Server Separation**: Clean architecture with proper separation of concerns 