# JavaScript/TypeScript Usage Guide

This guide covers how to use the Rustreexo WASM packages in JavaScript and TypeScript applications across different environments.

## 📦 Package Overview

Rustreexo WASM is available as three separate packages optimized for different environments:

| Package | Environment | Installation |
|---------|-------------|--------------|
| `@rustreexo/rustreexo-wasm-web` | Web browsers (ES modules) | `npm install @rustreexo/rustreexo-wasm-web` |
| `@rustreexo/rustreexo-wasm-nodejs` | Node.js applications | `npm install @rustreexo/rustreexo-wasm-nodejs` |
| `@rustreexo/rustreexo-wasm-bundler` | Webpack/Rollup/Vite | `npm install @rustreexo/rustreexo-wasm-bundler` |

## 🌐 Browser Usage

### Installation

```bash
npm install @rustreexo/rustreexo-wasm-web
```

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Rustreexo WASM Browser Example</title>
</head>
<body>
    <script type="module">
        import init, { WasmStump, WasmPollard, Hash } from './node_modules/@rustreexo/rustreexo-wasm-web/rustreexo_wasm.js';

        async function main() {
            // Initialize the WASM module
            await init();

            // Create accumulators
            const stump = new WasmStump();
            const pollard = new WasmPollard();

            // Add elements to the accumulator
            const elements = [
                "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
                "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
            ];

            const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
            
            // Method 1: Using string hashes (simple)
            stump.modify(emptyProof, elements, []);
            
            // Method 2: Using WASM Hash objects (advanced)
            const wasmHashes = elements.map(hash => new Hash(hash));
            const additions = wasmHashes.map(hash => ({ hash, remember: true }));
            pollard.modify(emptyProof, JSON.stringify(additions), []);

            console.log(`Accumulator has ${stump.num_leaves()} leaves`);
            console.log(`Root hashes:`, stump.roots());

            // Generate and verify a proof
            const proof = pollard.prove_single(elements[0]);
            const isValid = stump.verify(proof, [elements[0]]);
            console.log(`Proof is valid: ${isValid}`);

            // Clean up WASM objects
            wasmHashes.forEach(hash => hash.free());
            stump.free();
            pollard.free();
        }

        main().catch(console.error);
    </script>
</body>
</html>
```

### TypeScript Browser Example

```typescript
import init, { WasmStump, WasmPollard, Hash } from '@rustreexo/rustreexo-wasm-web';

interface AccumulatorManager {
    stump: WasmStump;
    pollard: WasmPollard;
    elements: string[];
}

class UtreexoManager implements AccumulatorManager {
    public stump: WasmStump;
    public pollard: WasmPollard;
    public elements: string[] = [];

    constructor() {
        this.stump = new WasmStump();
        this.pollard = new WasmPollard();
    }

    async initialize(): Promise<void> {
        await init();
        console.log('✅ Rustreexo WASM initialized');
    }

    addElements(hashes: string[]): void {
        const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
        
        try {
            // Try WASM Hash objects first
            const wasmHashes = hashes.map(hash => new Hash(hash));
            this.stump.modify(emptyProof, wasmHashes, []);
            
            const additions = wasmHashes.map(hash => ({ hash, remember: true }));
            this.pollard.modify(emptyProof, JSON.stringify(additions), []);
            
            // Clean up
            wasmHashes.forEach(hash => hash.free());
        } catch (error) {
            // Fallback to string API
            this.stump.modify(emptyProof, hashes, []);
            const additions = hashes.map(hash => ({ hash, remember: true }));
            this.pollard.modify(emptyProof, JSON.stringify(additions), []);
        }

        this.elements.push(...hashes);
    }

    generateProof(hash: string): string {
        return this.pollard.prove_single(hash);
    }

    verifyProof(proof: string, hashes: string[]): boolean {
        return this.stump.verify(proof, hashes);
    }

    getStatus(): { leaves: bigint; roots: string[] } {
        return {
            leaves: this.stump.num_leaves(),
            roots: this.stump.roots()
        };
    }

    cleanup(): void {
        this.stump.free();
        this.pollard.free();
    }
}

// Usage
async function example() {
    const manager = new UtreexoManager();
    await manager.initialize();

    const testHashes = [
        "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
        "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
    ];

    manager.addElements(testHashes);
    
    const proof = manager.generateProof(testHashes[0]);
    const isValid = manager.verifyProof(proof, [testHashes[0]]);
    
    console.log('Status:', manager.getStatus());
    console.log('Proof valid:', isValid);

    manager.cleanup();
}
```

## 🖥️ Node.js Usage

### Installation

```bash
npm install @rustreexo/rustreexo-wasm-nodejs
```

### CommonJS Example

```javascript
const { WasmStump, WasmPollard, Hash } = require('@rustreexo/rustreexo-wasm-nodejs');

function createAccumulator() {
    const stump = new WasmStump();
    const pollard = new WasmPollard();

    // Add elements
    const elements = [
        "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
        "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
    ];

    const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
    stump.modify(emptyProof, elements, []);

    const additions = elements.map(hash => ({ hash, remember: true }));
    pollard.modify(emptyProof, JSON.stringify(additions), []);

    console.log(`Created accumulator with ${stump.num_leaves()} leaves`);

    // Generate and verify proof
    const proof = pollard.prove_single(elements[0]);
    const isValid = stump.verify(proof, [elements[0]]);
    
    console.log(`Proof verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    return { stump, pollard, elements };
}

// Usage
try {
    const { stump, pollard } = createAccumulator();
    
    // Don't forget to clean up
    stump.free();
    pollard.free();
} catch (error) {
    console.error('Error:', error);
}
```

### ES Modules Example

```javascript
import { WasmStump, WasmPollard, Hash } from '@rustreexo/rustreexo-wasm-nodejs';

class NodeUtreexo {
    constructor() {
        this.stump = new WasmStump();
        this.pollard = new WasmPollard();
        this.elements = [];
    }

    addBatch(hashes) {
        const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
        
        // Add to stump
        this.stump.modify(emptyProof, hashes, []);
        
        // Add to pollard with remember flag
        const additions = hashes.map(hash => ({ hash, remember: true }));
        this.pollard.modify(emptyProof, JSON.stringify(additions), []);
        
        this.elements.push(...hashes);
        
        return {
            added: hashes.length,
            totalLeaves: Number(this.stump.num_leaves()),
            roots: this.stump.roots()
        };
    }

    batchProof(hashes) {
        return this.pollard.batch_proof(hashes);
    }

    verifyBatch(proof, hashes) {
        return this.stump.verify(proof, hashes);
    }

    serialize() {
        return this.stump.to_json();
    }

    static deserialize(json) {
        return WasmStump.from_json(json);
    }

    cleanup() {
        this.stump.free();
        this.pollard.free();
    }
}

// Usage example
const accumulator = new NodeUtreexo();

const hashes = [
    "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
    "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a",
    "dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986"
];

const result = accumulator.addBatch(hashes);
console.log('Batch added:', result);

const proof = accumulator.batchProof([hashes[0], hashes[2]]);
const isValid = accumulator.verifyBatch(proof, [hashes[0], hashes[2]]);
console.log('Batch proof valid:', isValid);

accumulator.cleanup();
```

### TypeScript Node.js Example

```typescript
import { WasmStump, WasmPollard, Hash } from '@rustreexo/rustreexo-wasm-nodejs';

interface UtreexoStats {
    leaves: number;
    roots: number;
    memoryUsage: NodeJS.MemoryUsage;
}

class PersistentUtreexo {
    private stump: WasmStump;
    private pollard: WasmPollard;
    private elementCount: number = 0;

    constructor() {
        this.stump = new WasmStump();
        this.pollard = new WasmPollard();
    }

    static fromExisting(roots: string[], leafCount: bigint): PersistentUtreexo {
        const instance = new PersistentUtreexo();
        instance.stump.free(); // Free the default one
        instance.pollard.free();
        
        instance.stump = WasmStump.from_json(JSON.stringify({ roots, leaves: leafCount }));
        instance.pollard = WasmPollard.from_roots(roots, leafCount);
        instance.elementCount = Number(leafCount);
        
        return instance;
    }

    addElements(hashes: string[]): void {
        const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
        
        // Add to both accumulators
        this.stump.modify(emptyProof, hashes, []);
        
        const additions = hashes.map(hash => ({ hash, remember: true }));
        this.pollard.modify(emptyProof, JSON.stringify(additions), []);
        
        this.elementCount += hashes.length;
    }

    removeElements(hashes: string[]): string {
        const proof = this.pollard.batch_proof(hashes);
        
        // Remove from both accumulators
        this.stump.modify(proof, [], hashes);
        this.pollard.modify(proof, '[]', hashes);
        
        this.elementCount -= hashes.length;
        
        return proof;
    }

    proveElements(hashes: string[]): string {
        return this.pollard.batch_proof(hashes);
    }

    verifyProof(proof: string, hashes: string[]): boolean {
        return this.stump.verify(proof, hashes);
    }

    getStats(): UtreexoStats {
        return {
            leaves: Number(this.stump.num_leaves()),
            roots: this.stump.roots().length,
            memoryUsage: process.memoryUsage()
        };
    }

    exportState(): { roots: string[]; leaves: bigint } {
        return {
            roots: this.stump.roots(),
            leaves: this.stump.num_leaves()
        };
    }

    cleanup(): void {
        this.stump.free();
        this.pollard.free();
    }
}

// Usage example with error handling
async function demonstrateUsage() {
    const accumulator = new PersistentUtreexo();
    
    try {
        // Add initial elements
        const initialHashes = [
            "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
            "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
        ];
        
        accumulator.addElements(initialHashes);
        console.log('Initial stats:', accumulator.getStats());
        
        // Generate proof
        const proof = accumulator.proveElements([initialHashes[0]]);
        console.log('Generated proof for first element');
        
        // Verify proof
        const isValid = accumulator.verifyProof(proof, [initialHashes[0]]);
        console.log('Proof is valid:', isValid);
        
        // Export state for persistence
        const state = accumulator.exportState();
        console.log('Exported state:', state);
        
        // Create new accumulator from existing state
        const restored = PersistentUtreexo.fromExisting(state.roots, state.leaves);
        console.log('Restored accumulator stats:', restored.getStats());
        
        restored.cleanup();
        
    } catch (error) {
        console.error('Error in demonstration:', error);
    } finally {
        accumulator.cleanup();
    }
}

demonstrateUsage();
```

## 📦 Bundler Usage (Webpack/Rollup/Vite)

### Installation

```bash
npm install @rustreexo/rustreexo-wasm-bundler
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@rustreexo/rustreexo-wasm-bundler']
  },
  server: {
    fs: {
      allow: ['..'] // Allow serving files from parent directories
    }
  }
});
```

### React Example

```tsx
import React, { useEffect, useState } from 'react';
import init, { WasmStump, WasmPollard } from '@rustreexo/rustreexo-wasm-bundler';

interface AccumulatorState {
  leaves: number;
  roots: string[];
  initialized: boolean;
}

const UtreexoComponent: React.FC = () => {
  const [state, setState] = useState<AccumulatorState>({
    leaves: 0,
    roots: [],
    initialized: false
  });
  
  const [stump, setStump] = useState<WasmStump | null>(null);
  const [pollard, setPollard] = useState<WasmPollard | null>(null);

  useEffect(() => {
    async function initializeWasm() {
      try {
        await init();
        const newStump = new WasmStump();
        const newPollard = new WasmPollard();
        
        setStump(newStump);
        setPollard(newPollard);
        setState(prev => ({ ...prev, initialized: true }));
        
        console.log('✅ WASM initialized');
      } catch (error) {
        console.error('Failed to initialize WASM:', error);
      }
    }

    initializeWasm();

    // Cleanup on unmount
    return () => {
      stump?.free();
      pollard?.free();
    };
  }, []);

  const addElements = (hashes: string[]) => {
    if (!stump || !pollard) return;

    try {
      const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
      stump.modify(emptyProof, hashes, []);
      
      const additions = hashes.map(hash => ({ hash, remember: true }));
      pollard.modify(emptyProof, JSON.stringify(additions), []);

      setState({
        leaves: Number(stump.num_leaves()),
        roots: stump.roots(),
        initialized: true
      });
    } catch (error) {
      console.error('Error adding elements:', error);
    }
  };

  const testAddition = () => {
    const testHashes = [
      "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
      "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
    ];
    addElements(testHashes);
  };

  if (!state.initialized) {
    return <div>Loading WASM module...</div>;
  }

  return (
    <div>
      <h2>Rustreexo Accumulator</h2>
      <p>Leaves: {state.leaves}</p>
      <p>Roots: {state.roots.length}</p>
      <button onClick={testAddition}>Add Test Elements</button>
      
      <div>
        <h3>Root Hashes:</h3>
        <ul>
          {state.roots.map((root, index) => (
            <li key={index} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {root}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UtreexoComponent;
```

### Vue.js Example

```vue
<template>
  <div class="utreexo-demo">
    <h2>Rustreexo WASM Demo</h2>
    
    <div v-if="!initialized" class="loading">
      Loading WASM module...
    </div>
    
    <div v-else>
      <div class="stats">
        <p><strong>Leaves:</strong> {{ stats.leaves }}</p>
        <p><strong>Roots:</strong> {{ stats.roots }}</p>
      </div>
      
      <div class="controls">
        <button @click="addRandomElements" :disabled="loading">
          Add Random Elements
        </button>
        <button @click="generateProof" :disabled="loading || stats.leaves === 0">
          Generate Proof
        </button>
      </div>
      
      <div v-if="lastProof" class="proof-result">
        <h3>Last Proof Result:</h3>
        <p><strong>Valid:</strong> {{ lastProofValid ? '✅' : '❌' }}</p>
        <details>
          <summary>Proof Data</summary>
          <pre>{{ lastProof }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import init, { WasmStump, WasmPollard } from '@rustreexo/rustreexo-wasm-bundler';

const initialized = ref(false);
const loading = ref(false);
const stats = ref({ leaves: 0, roots: 0 });
const lastProof = ref('');
const lastProofValid = ref(false);

let stump: WasmStump | null = null;
let pollard: WasmPollard | null = null;
let elements: string[] = [];

onMounted(async () => {
  try {
    await init();
    stump = new WasmStump();
    pollard = new WasmPollard();
    initialized.value = true;
    updateStats();
  } catch (error) {
    console.error('Failed to initialize WASM:', error);
  }
});

onUnmounted(() => {
  stump?.free();
  pollard?.free();
});

function updateStats() {
  if (stump) {
    stats.value = {
      leaves: Number(stump.num_leaves()),
      roots: stump.roots().length
    };
  }
}

function generateRandomHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function addRandomElements() {
  if (!stump || !pollard) return;
  
  loading.value = true;
  
  try {
    const newHashes = Array.from({ length: 5 }, () => generateRandomHash());
    const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
    
    stump.modify(emptyProof, newHashes, []);
    const additions = newHashes.map(hash => ({ hash, remember: true }));
    pollard.modify(emptyProof, JSON.stringify(additions), []);
    
    elements.push(...newHashes);
    updateStats();
  } catch (error) {
    console.error('Error adding elements:', error);
  } finally {
    loading.value = false;
  }
}

async function generateProof() {
  if (!stump || !pollard || elements.length === 0) return;
  
  loading.value = true;
  
  try {
    const targetHash = elements[Math.floor(Math.random() * elements.length)];
    const proof = pollard.prove_single(targetHash);
    const isValid = stump.verify(proof, [targetHash]);
    
    lastProof.value = proof;
    lastProofValid.value = isValid;
  } catch (error) {
    console.error('Error generating proof:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.utreexo-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
}

.stats {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.controls {
  margin: 20px 0;
}

.controls button {
  margin-right: 10px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.proof-result {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
```

## 🔧 Advanced Usage Patterns

### Memory Management

```typescript
import { WasmStump, WasmPollard, Hash } from '@rustreexo/rustreexo-wasm-nodejs';

class ManagedUtreexo {
    private stump: WasmStump;
    private pollard: WasmPollard;
    private hashObjects: Hash[] = [];
    private disposed = false;

    constructor() {
        this.stump = new WasmStump();
        this.pollard = new WasmPollard();
    }

    addElements(hashes: string[]): void {
        this.checkDisposed();
        
        const wasmHashes = hashes.map(hash => {
            const wasmHash = new Hash(hash);
            this.hashObjects.push(wasmHash); // Track for cleanup
            return wasmHash;
        });

        const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
        
        try {
            this.stump.modify(emptyProof, wasmHashes, []);
            const additions = wasmHashes.map(hash => ({ hash, remember: true }));
            this.pollard.modify(emptyProof, JSON.stringify(additions), []);
        } catch (error) {
            // Clean up on error
            wasmHashes.forEach(hash => hash.free());
            this.hashObjects = this.hashObjects.filter(h => !wasmHashes.includes(h));
            throw error;
        }
    }

    private checkDisposed(): void {
        if (this.disposed) {
            throw new Error('Accumulator has been disposed');
        }
    }

    dispose(): void {
        if (this.disposed) return;

        // Clean up all WASM objects
        this.hashObjects.forEach(hash => {
            try {
                hash.free();
            } catch (e) {
                // Ignore errors during cleanup
            }
        });

        this.stump.free();
        this.pollard.free();
        
        this.hashObjects = [];
        this.disposed = true;
    }
}

// Usage with automatic cleanup
function useUtreexo<T>(callback: (accumulator: ManagedUtreexo) => T): T {
    const accumulator = new ManagedUtreexo();
    try {
        return callback(accumulator);
    } finally {
        accumulator.dispose();
    }
}

// Example
const result = useUtreexo(acc => {
    acc.addElements(['hash1', 'hash2']);
    return acc.getStats();
});
```

### Performance Optimization

```typescript
import { WasmStump, WasmPollard } from '@rustreexo/rustreexo-wasm-nodejs';

class OptimizedUtreexo {
    private stump: WasmStump;
    private pollard: WasmPollard;
    private batchSize = 1000;
    private pendingHashes: string[] = [];

    constructor(batchSize = 1000) {
        this.stump = new WasmStump();
        this.pollard = new WasmPollard();
        this.batchSize = batchSize;
    }

    // Add elements with batching for better performance
    addElement(hash: string): void {
        this.pendingHashes.push(hash);
        
        if (this.pendingHashes.length >= this.batchSize) {
            this.flushPending();
        }
    }

    flushPending(): void {
        if (this.pendingHashes.length === 0) return;

        const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });
        
        // Batch operation for better performance
        this.stump.modify(emptyProof, this.pendingHashes, []);
        const additions = this.pendingHashes.map(hash => ({ hash, remember: true }));
        this.pollard.modify(emptyProof, JSON.stringify(additions), []);

        console.log(`Processed batch of ${this.pendingHashes.length} elements`);
        this.pendingHashes = [];
    }

    // Optimized proof generation with caching
    private proofCache = new Map<string, string>();

    generateProofCached(hash: string): string {
        if (this.proofCache.has(hash)) {
            return this.proofCache.get(hash)!;
        }

        const proof = this.pollard.prove_single(hash);
        this.proofCache.set(hash, proof);
        return proof;
    }

    clearCache(): void {
        this.proofCache.clear();
    }

    cleanup(): void {
        this.flushPending();
        this.clearCache();
        this.stump.free();
        this.pollard.free();
    }
}
```

## 📚 Complete Examples

### Working Examples Repository

For complete, runnable examples, check out the [examples](./examples/) directory in this repository:

- **[Browser Example](./examples/browser_example.html)** - Complete HTML page with real cryptographic hashing
- **[Node.js Basic Example](./examples/basic_usage.cjs)** - Simple CommonJS usage
- **[Node.js Comprehensive Example](./examples/nodejs_example.cjs)** - Advanced features and error handling
- **[Performance Benchmark](./tests/typescript/src/benchmark-node.ts)** - Performance testing across different scales

### Running Examples Locally

```bash
# Clone the repository
git clone https://github.com/AbdelStark/rustreexo-wasm.git
cd rustreexo-wasm

# Build the WASM packages
make build-all

# Install example dependencies
cd examples && npm install

# Run Node.js examples
node basic_usage.cjs
node nodejs_example.cjs

# Serve browser example (requires local server)
npx serve . # Then open browser_example.html
```

## 🔍 API Reference

### WasmStump Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `new WasmStump()` | - | `WasmStump` | Create new lightweight accumulator |
| `num_leaves()` | - | `bigint` | Get number of leaves |
| `roots()` | - | `string[]` | Get root hashes |
| `modify(proof, addHashes, delHashes)` | `string, string[], string[]` | `void` | Modify accumulator |
| `verify(proof, hashes)` | `string, string[]` | `boolean` | Verify inclusion proof |
| `to_json()` | - | `string` | Serialize to JSON |
| `from_json(json)` | `string` | `WasmStump` | Deserialize from JSON (static) |
| `free()` | - | `void` | Clean up memory |

### WasmPollard Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `new WasmPollard()` | - | `WasmPollard` | Create new full accumulator |
| `num_leaves()` | - | `bigint` | Get number of leaves |
| `roots()` | - | `string[]` | Get root hashes |
| `modify(proof, additions, delHashes)` | `string, string, string[]` | `void` | Modify accumulator |
| `prove_single(hash)` | `string` | `string` | Generate single proof |
| `batch_proof(hashes)` | `string[]` | `string` | Generate batch proof |
| `verify(proof, hashes)` | `string, string[]` | `boolean` | Verify inclusion proofs |
| `from_roots(roots, leaves)` | `string[], bigint` | `WasmPollard` | Create from existing state (static) |
| `free()` | - | `void` | Clean up memory |

### Hash Object Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `new Hash(hex)` | `string` | `Hash` | Create hash from hex string |
| `free()` | - | `void` | Clean up memory |

## ❗ Important Notes

### Memory Management
- Always call `.free()` on WASM objects when done
- Use try-finally blocks or automatic cleanup patterns
- Hash objects created with `new Hash()` must also be freed

### Error Handling
- WASM functions can throw exceptions
- Always wrap WASM calls in try-catch blocks
- Some APIs have fallback modes (WASM Hash objects vs string hashes)

### Performance Considerations
- Batch operations when possible (use arrays instead of single elements)
- Cache proofs if reusing them
- Consider using Web Workers for intensive operations in browsers

### Browser Compatibility
- Requires WebAssembly support (all modern browsers)
- ES modules required for web package
- Some features may need polyfills in older environments

## 🤝 Support

- **Documentation**: [GitHub Repository](https://github.com/AbdelStark/rustreexo-wasm)
- **Examples**: [examples/](./examples/) directory
- **Issues**: [GitHub Issues](https://github.com/AbdelStark/rustreexo-wasm/issues)
- **Performance**: Run benchmarks with `make benchmark-node`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.