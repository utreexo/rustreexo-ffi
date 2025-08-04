/**
 * Node.js Rustreexo WASM Example
 * 
 * Demonstrates using Rustreexo WASM in a Node.js environment
 * Run with: node nodejs_example.js
 */

const { WasmStump, WasmPollard } = require('../pkg-node/rustreexo_wasm.js');

function createTestData(count) {
  // Generate test elements (mock SHA-256 hashes)
  const elements = [];
  for (let i = 0; i < count; i++) {
    // Create deterministic test hashes
    const hash = Buffer.alloc(32);
    hash.writeUInt32BE(i, 28); // Put counter in last 4 bytes
    elements.push(hash.toString('hex'));
  }
  return elements;
}

async function nodeJsExample() {
  console.log('🔧 Rustreexo WASM Node.js Example\n');

  try {
    // Create accumulators
    const stump = new WasmStump();
    const pollard = new WasmPollard();
    console.log('✅ Created accumulators');

    // Generate test data
    const elements = createTestData(100);
    console.log(`📦 Generated ${elements.length} test elements`);

    // Add elements in batches
    const batchSize = 10;
    const emptyProof = JSON.stringify({ targets: [], hashes: [] });

    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      // Add to Stump
      stump.modify(emptyProof, batch, []);
      
      // Add to Pollard
      const additions = batch.map(hash => ({ hash, remember: true }));
      pollard.modify(emptyProof, JSON.stringify(additions), []);
      
      console.log(`   Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(elements.length / batchSize)}`);
    }

    console.log(`\n📊 Final state: ${stump.num_leaves()} leaves, ${stump.roots().length} roots`);

    // Performance test: Generate and verify multiple proofs
    console.log('\n⚡ Performance test:');
    const testElements = elements.slice(0, 10); // Test first 10 elements
    
    const startTime = process.hrtime.bigint();
    
    for (const element of testElements) {
      const proof = pollard.prove_single(element);
      const isValid = stump.verify(proof, [element]);
      
      if (!isValid) {
        throw new Error(`Proof verification failed for ${element}`);
      }
    }
    
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    
    console.log(`   Generated and verified ${testElements.length} proofs in ${durationMs.toFixed(2)}ms`);
    console.log(`   Average: ${(durationMs / testElements.length).toFixed(2)}ms per proof`);

    // Memory usage estimation
    console.log('\n💾 Memory usage:');
    const stumpJson = stump.to_json();
    console.log(`   Stump serialized size: ${stumpJson.length} bytes`);
    console.log(`   Compression ratio: ${(elements.length * 64 / stumpJson.length).toFixed(1)}:1`);

    // Test batch operations
    console.log('\n📦 Batch operations test:');
    const batchTargets = elements.slice(50, 55); // Elements 50-54
    const batchProof = pollard.batch_proof(batchTargets);
    const batchValid = stump.verify(batchProof, batchTargets);
    
    console.log(`   Batch proof for ${batchTargets.length} elements: ${batchValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`   Batch proof size: ${batchProof.length} bytes`);

    // UTXO simulation demonstration (basic addition only)
    console.log('\n🪙 UTXO simulation:');
    console.log('   Demonstrating addition of new UTXOs...');
    
    // Add new elements (simulating new UTXOs)
    const newUtxos = createTestData(3).map((hash, i) => 'f' + hash.substring(1)); // Make them different
    console.log(`   Adding ${newUtxos.length} new UTXOs...`);
    
    stump.modify(emptyProof, newUtxos, []);
    const newAdditions = newUtxos.map(hash => ({ hash, remember: true }));
    pollard.modify(emptyProof, JSON.stringify(newAdditions), []);
    
    console.log(`   Final UTXO count: ${stump.num_leaves()}`);
    console.log(`   Net change: +${newUtxos.length} UTXOs`);

    // Export accumulator state
    console.log('\n📤 State export:');
    const exportedState = {
      timestamp: new Date().toISOString(),
      leaves: Number(stump.num_leaves()),
      roots: stump.roots(),
      version: '1.0.0'
    };
    
    console.log(`   Exported state: ${JSON.stringify(exportedState).length} bytes`);
    
    // Clean up
    stump.free();
    pollard.free();
    console.log('\n🧹 Cleanup completed');
    
    console.log('🎉 Node.js example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the example
nodeJsExample();