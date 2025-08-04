/**
 * Debug test to understand the actual hash values produced by the WASM implementation
 */
import { describe, it, beforeAll, afterEach } from 'vitest';

let wasmModule: any;
const wasmObjects: any[] = [];

describe('Debug Hash Values', () => {
  beforeAll(async () => {
    wasmModule = await import('../../../pkg-node/rustreexo_wasm.js');
  });

  afterEach(() => {
    wasmObjects.forEach(obj => {
      try {
        obj.free();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    wasmObjects.length = 0;
  });

  it('should show actual hash values from WASM for first 8 preimages', () => {
    console.log('Actual WASM hash values:');
    
    // First, let's see what we can compute by hashing single bytes with CryptoJS
    const CryptoJS = require('crypto-js');
    
    for (let i = 0; i < 8; i++) {
      // Method 1: Hash the single byte directly with SHA-256
      const singleByte = new Uint8Array([i]);
      const wordArray = CryptoJS.lib.WordArray.create(Array.from(singleByte));
      const sha256Hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
      
      console.log(`SHA256(${i}): ${sha256Hash}`);
      
      try {
        // Try to create a WASM hash from the computed SHA-256
        const wasmHash = new wasmModule.Hash(sha256Hash);
        wasmObjects.push(wasmHash);
        console.log(`WASM Hash created from SHA256(${i}): ${wasmHash.to_hex()}`);
      } catch (error) {
        console.log(`Failed to create WASM hash: ${error}`);
      }
    }
  });

  it('should show parent hash calculation', () => {
    const CryptoJS = require('crypto-js');
    
    // Create SHA-256 hashes for bytes 0 and 1
    const hash0Hex = CryptoJS.SHA256(CryptoJS.lib.WordArray.create([0])).toString(CryptoJS.enc.Hex);
    const hash1Hex = CryptoJS.SHA256(CryptoJS.lib.WordArray.create([1])).toString(CryptoJS.enc.Hex);
    
    try {
      const hash0 = new wasmModule.Hash(hash0Hex);
      const hash1 = new wasmModule.Hash(hash1Hex);
      wasmObjects.push(hash0, hash1);
      
      const parent = wasmModule.Hash.parent_hash(hash0, hash1);
      wasmObjects.push(parent);
      
      console.log('Parent hash calculation:');
      console.log(`hash(0): ${hash0.to_hex()}`);
      console.log(`hash(1): ${hash1.to_hex()}`);
      console.log(`parent_hash(hash(0), hash(1)): ${parent.to_hex()}`);
    } catch (error) {
      console.log(`Parent hash calculation failed: ${error}`);
    }
  });
});