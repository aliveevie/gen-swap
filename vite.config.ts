import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Node.js polyfills for 1inch SDK
      "assert": "assert",
      "buffer": "buffer", 
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "util": "util"
    },
  },
  define: {
    global: 'globalThis',
    process: {
      env: {}
    }
  },
  optimizeDeps: {
    include: ['@1inch/cross-chain-sdk', 'assert', 'buffer', 'crypto-browserify', 'stream-browserify', 'util']
  }
}));
