// Export all functions from their respective modules
const config = require('./config');
const swap = require('./swap');
const fusion = require('./fusion');
const tokens = require('./tokens');
const crosschain = require('./crosschain');

module.exports = {
  // Configuration
  ...config,
  
  // Swap functions
  ...swap,
  
  // Fusion (Intent-based swap) functions
  ...fusion,
  
  // Token functions
  ...tokens,
  
  // Cross-chain functions
  ...crosschain
}; 