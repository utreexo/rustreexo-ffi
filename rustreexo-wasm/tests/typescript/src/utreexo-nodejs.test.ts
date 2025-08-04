/**
 * Node.js specific comprehensive tests for Rustreexo WASM bindings
 * 
 * These tests focus on the nodejs WASM target which is most suitable for
 * CI/CD testing environments.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';

// Import the Node.js WASM module directly
let wasmModule: any;
const wasmObjects: any[] = [];

describe('Rustreexo WASM Node.js Tests', () => {
  beforeAll(async () => {
    try {
      wasmModule = await import('../../../pkg-node/rustreexo_wasm.js');
      console.log(`WASM module version: ${wasmModule.version()}`);
    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw error;
    }
  });

  afterEach(() => {
    // Clean up all created WASM objects to prevent memory leaks
    wasmObjects.forEach(obj => {
      try {
        obj.free();
      } catch (error) {
        // Ignore errors during cleanup
      }
    });
    wasmObjects.length = 0;
  });

  describe('Basic API Tests', () => {
    it('should return version information', () => {
      const version = wasmModule.version();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toBe('0.4.0');
    });

    it('should create and manage Hash objects', () => {
      const hexString = 'deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef';
      const hash = new wasmModule.Hash(hexString);
      wasmObjects.push(hash);
      
      expect(hash).toBeDefined();
      expect(hash.to_hex()).toBe(hexString);
      
      const bytes = hash.to_bytes();
      expect(bytes).toHaveLength(32);
      
      const reconstructed = wasmModule.Hash.from_bytes(new Uint8Array(bytes));
      wasmObjects.push(reconstructed);
      expect(reconstructed.to_hex()).toBe(hexString);
    });

    it('should create and manage WasmStump objects', () => {
      const stump = new wasmModule.WasmStump();
      wasmObjects.push(stump);
      
      expect(stump).toBeDefined();
      expect(stump.num_leaves()).toBe(0n);
      expect(Array.isArray(stump.roots())).toBe(true);
      expect(stump.roots()).toHaveLength(0);
      
      // Test JSON serialization
      const json = stump.to_json();
      expect(typeof json).toBe('string');
      
      const reconstructed = wasmModule.WasmStump.from_json(json);
      wasmObjects.push(reconstructed);
      expect(reconstructed.num_leaves()).toBe(stump.num_leaves());
    });

    it('should create and manage WasmPollard objects', () => {
      const pollard = new wasmModule.WasmPollard();
      wasmObjects.push(pollard);
      
      expect(pollard).toBeDefined();
      expect(pollard.num_leaves()).toBe(0n);
      expect(Array.isArray(pollard.roots())).toBe(true);
      expect(pollard.roots()).toHaveLength(0);
      
      // Test creating from roots
      const emptyPollard = wasmModule.WasmPollard.from_roots([], 0n);
      wasmObjects.push(emptyPollard);
      expect(emptyPollard.num_leaves()).toBe(0n);
    });
  });

  describe('Hash Operations', () => {
    it('should handle various hash formats', () => {
      const testVectors = [
        {
          hex: '0000000000000000000000000000000000000000000000000000000000000000',
          description: 'zero hash'
        },
        {
          hex: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          description: 'max hash'
        },
        {
          hex: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
          description: 'valid 64-char hex'
        }
      ];

      testVectors.forEach(({ hex, description: _description }) => {
        const hash = new wasmModule.Hash(hex);
        wasmObjects.push(hash);
        
        expect(hash.to_hex()).toBe(hex);
        expect(hash.to_bytes()).toHaveLength(32);
      });
    });

    it('should calculate parent hashes correctly', () => {
      const left = new wasmModule.Hash('0'.repeat(64));
      const right = new wasmModule.Hash('1'.repeat(64));
      wasmObjects.push(left, right);
      
      const parent = wasmModule.Hash.parent_hash(left, right);
      wasmObjects.push(parent);
      
      expect(parent.to_hex()).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(parent.to_hex())).toBe(true);
    });

    it('should reject invalid hash inputs', () => {
      const invalidInputs = [
        'invalid_hex',
        '123', // too short
        'g'.repeat(64), // invalid characters
        '' // empty
      ];

      invalidInputs.forEach(input => {
        expect(() => new wasmModule.Hash(input)).toThrow();
      });
    });
  });

  describe('Proof Operations', () => {
    it('should handle proof generation on empty pollard', () => {
      const pollard = new wasmModule.WasmPollard();
      wasmObjects.push(pollard);
      
      // Empty pollard should return empty proof
      const proof = pollard.batch_proof([]);
      expect(typeof proof).toBe('string');
      
      const parsed = JSON.parse(proof);
      console.log('Batch proof structure:', parsed);
      expect(parsed).toBeDefined();
      
      // Check the actual structure returned
      if (parsed.targets !== undefined) {
        expect(Array.isArray(parsed.targets)).toBe(true);
      }
      if (parsed.proof !== undefined) {
        expect(Array.isArray(parsed.proof)).toBe(true);
      }
    });

    it('should handle proof verification on empty stump', () => {
      const stump = new wasmModule.WasmStump();
      wasmObjects.push(stump);
      
      // Empty proof should verify successfully on empty stump
      const emptyProof = JSON.stringify({
        targets: [],
        proof: [],
        hashes: []
      });
      
      const result = stump.verify(emptyProof, []);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should fail when proving non-existent element', () => {
      const pollard = new wasmModule.WasmPollard();
      wasmObjects.push(pollard);
      
      const nonExistentHash = 'deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef';
      
      expect(() => {
        pollard.prove_single(nonExistentHash);
      }).toThrow(/Leaf not found/);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in stump operations', () => {
      expect(() => {
        wasmModule.WasmStump.from_json('invalid json');
      }).toThrow();
      
      expect(() => {
        wasmModule.WasmStump.from_json('{}'); // Missing required fields
      }).toThrow();
    });

    it('should handle invalid proof formats', () => {
      const stump = new wasmModule.WasmStump();
      const pollard = new wasmModule.WasmPollard();
      wasmObjects.push(stump, pollard);
      
      const invalidProofs = [
        'invalid json',
        '{}', // Missing required fields
        '{"targets": []}', // Missing other fields
        '{"proof": []}' // Missing other fields
      ];
      
      invalidProofs.forEach(invalidProof => {
        expect(() => {
          stump.verify(invalidProof, []);
        }).toThrow();
        
        expect(() => {
          pollard.verify(invalidProof, []);
        }).toThrow();
      });
    });
  });

  describe('Memory Management', () => {
    it('should handle multiple object creation and cleanup', () => {
      const objects = [];
      
      // Create many objects
      for (let i = 0; i < 50; i++) {
        const stump = new wasmModule.WasmStump();
        const pollard = new wasmModule.WasmPollard();
        objects.push(stump, pollard);
        
        expect(stump.num_leaves()).toBe(0n);
        expect(pollard.num_leaves()).toBe(0n);
      }
      
      expect(objects).toHaveLength(100);
      
      // Clean up
      objects.forEach(obj => obj.free());
    });

    it('should handle repeated creation/destruction cycles', () => {
      for (let cycle = 0; cycle < 10; cycle++) {
        const stump = new wasmModule.WasmStump();
        const pollard = new wasmModule.WasmPollard();
        
        expect(stump.num_leaves()).toBe(0n);
        expect(pollard.num_leaves()).toBe(0n);
        
        stump.free();
        pollard.free();
      }
    });
  });

  describe('Accumulator Modifications', () => {
    it('should handle empty modifications without errors', () => {
      const stump = new wasmModule.WasmStump();
      const pollard = new wasmModule.WasmPollard();
      wasmObjects.push(stump, pollard);
      
      const emptyProof = JSON.stringify({
        targets: [],
        proof: [],
        hashes: []
      });
      
      // These operations should not change the state
      const initialStumpLeaves = stump.num_leaves();
      const initialPollardLeaves = pollard.num_leaves();
      
      // For stump: modify(proof_json, add_hashes, del_hashes)
      stump.modify(emptyProof, [], []);
      
      // For pollard: modify(proof_json, additions_json, del_hashes)
      pollard.modify(emptyProof, JSON.stringify([]), []);
      
      expect(stump.num_leaves()).toBe(initialStumpLeaves);
      expect(pollard.num_leaves()).toBe(initialPollardLeaves);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should simulate a basic accumulator workflow', () => {
      const pollard = new wasmModule.WasmPollard();
      const stump = new wasmModule.WasmStump();
      wasmObjects.push(pollard, stump);
      
      // Both start empty
      expect(pollard.num_leaves()).toBe(0n);
      expect(stump.num_leaves()).toBe(0n);
      
      // Both should have consistent root states
      expect(pollard.roots()).toEqual(stump.roots());
      
      // Test serialization roundtrip
      const stumpJson = stump.to_json();
      const reconstructedStump = wasmModule.WasmStump.from_json(stumpJson);
      wasmObjects.push(reconstructedStump);
      
      expect(reconstructedStump.num_leaves()).toBe(stump.num_leaves());
      expect(reconstructedStump.roots()).toEqual(stump.roots());
    });

    it('should handle hash tree operations', () => {
      // Create a small tree of hashes
      const leaves = [
        new wasmModule.Hash('0'.repeat(64)),
        new wasmModule.Hash('1'.repeat(64)),
        new wasmModule.Hash('2'.repeat(64)),
        new wasmModule.Hash('3'.repeat(64))
      ];
      wasmObjects.push(...leaves);
      
      // Build intermediate nodes
      const level1 = [
        wasmModule.Hash.parent_hash(leaves[0], leaves[1]),
        wasmModule.Hash.parent_hash(leaves[2], leaves[3])
      ];
      wasmObjects.push(...level1);
      
      // Build root
      const root = wasmModule.Hash.parent_hash(level1[0], level1[1]);
      wasmObjects.push(root);
      
      expect(root.to_hex()).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(root.to_hex())).toBe(true);
    });
  });
});