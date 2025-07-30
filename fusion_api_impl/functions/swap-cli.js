#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get all arguments after the script name
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🚀 Cross-Chain Swapper CLI

Usage:
  npm run swap <fromNetwork> <fromToken> <toNetwork> <toToken> <amount>
  npm run check <network> [token]
  npm run test-setup

Examples:
  npm run swap arbitrum usdc base usdc 1.5
  npm run swap ethereum weth polygon usdc 0.1
  npm run swap polygon usdt arbitrum usdt 100
  npm run check arbitrum usdc
  npm run test-setup

Supported Networks: ethereum, arbitrum, base, polygon, bsc, avalanche, optimism, fantom
Supported Tokens: usdc, usdt, weth, dai, wbtc, eth, matic, bnb, avax, op, ftm

Amount should be human readable (e.g., 1.5 USDC, 0.1 WETH, 100 USDT)
  `);
  process.exit(0);
}

// Parse the command
const command = args[0];

if (command === 'swap') {
  // Format: npm run swap <fromNetwork> <fromToken> <toNetwork> <toToken> <amount>
  const fromNetwork = args[1];
  const fromToken = args[2];
  const toNetwork = args[3];
  const toToken = args[4];
  const humanAmount = args[5]; // Human readable amount like "1.5" or "0.1"

  if (!fromNetwork || !fromToken || !toNetwork || !toToken || !humanAmount) {
    console.error('❌ Missing parameters for swap command');
    console.error('Usage: npm run swap <fromNetwork> <fromToken> <toNetwork> <toToken> <amount>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run swap arbitrum usdc base usdc 1.5');
    console.error('  npm run swap ethereum weth polygon usdc 0.1');
    console.error('  npm run swap polygon usdt arbitrum usdt 100');
    console.error('');
    console.error('Amount should be human readable (e.g., 1.5 USDC, 0.1 WETH)');
    process.exit(1);
  }

  console.log(`🔄 Starting cross-chain swap...`);
  console.log(`📤 From: ${fromNetwork} ${fromToken.toUpperCase()}`);
  console.log(`📥 To: ${toNetwork} ${toToken.toUpperCase()}`);
  console.log(`💰 Amount: ${humanAmount} ${fromToken.toUpperCase()}`);

  // Execute the swap command with human amount
  const swapperPath = path.join(__dirname, 'functions', 'Swapper.js');
  const child = spawn('node', [swapperPath, 'swap', fromNetwork, toNetwork, fromToken.toUpperCase(), toToken.toUpperCase(), humanAmount], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('close', (code) => {
    process.exit(code);
  });

} else if (command === 'check') {
  // Format: npm run check <network> [token]
  const network = args[1];
  const token = args[2] || 'USDC';

  if (!network) {
    console.error('❌ Network parameter required for check command');
    console.error('Usage: npm run check <network> [token]');
    process.exit(1);
  }

  console.log(`🔍 Checking balance on ${network} for ${token}...`);

  // Execute the check-balance command
  const swapperPath = path.join(__dirname, 'functions', 'Swapper.js');
  const child = spawn('node', [swapperPath, 'check-balance', network, token.toUpperCase()], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('close', (code) => {
    process.exit(code);
  });

} else if (command === 'test-setup') {
  console.log(`🧪 Testing setup...`);

  // Execute the test-setup command
  const swapperPath = path.join(__dirname, 'functions', 'Swapper.js');
  const child = spawn('node', [swapperPath, 'test-setup'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('close', (code) => {
    process.exit(code);
  });

} else {
  console.error(`❌ Unknown command: ${command}`);
  console.error('Available commands: swap, check, test-setup');
  process.exit(1);
} 