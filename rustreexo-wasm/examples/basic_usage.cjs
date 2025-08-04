/**
 * Basic Rustreexo WASM Usage Example
 * 
 * This example demonstrates:
 * - Creating Stump and Pollard accumulators
 * - Adding elements to accumulators
 * - Generating proofs with Pollard
 * - Verifying proofs with Stump
 * - Basic accumulator operations
 */

const { WasmStump, WasmPollard } = require('../pkg-node/rustreexo_wasm.js');

async function basicUsageExample() {
  console.log('🚀 Rustreexo WASM Basic Usage Example\n');

  // Node.js target doesn't require initialization
  console.log('✅ WASM module ready');

  // Create accumulators
  const stump = new WasmStump();   // Lightweight accumulator
  const pollard = new WasmPollard(); // Full accumulator for proof generation
  console.log('✅ Created Stump and Pollard accumulators');

  // Test elements (these are SHA-256 hashes of bytes 0, 1, 2, 3)
  const elements = [
    "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d", // hash_from_u8(0)
    "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a", // hash_from_u8(1)
    "dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986", // hash_from_u8(2)
    "084fed08b978af4d7d196a7446a86b58009e636b611db16211b65a9aadff29c5"  // hash_from_u8(3)
  ];

  console.log(`📦 Adding ${elements.length} elements to accumulators`);

  // Empty proof for initial additions
  const emptyProof = JSON.stringify({ targets: [], hashes: [] });

  // Add elements to Stump
  stump.modify(emptyProof, elements, []);
  console.log(`   Stump: ${stump.num_leaves()} leaves, ${stump.roots().length} roots`);

  // Add elements to Pollard (using JSON format for additions)
  const additions = elements.map((hash, index) => ({ hash, remember: true }));
  const additionsJson = JSON.stringify(additions);
  pollard.modify(emptyProof, additionsJson, []);
  console.log(`   Pollard: ${pollard.num_leaves()} leaves, ${pollard.roots().length} roots`);

  // Verify both accumulators have the same state
  console.log('\n🔍 Verifying accumulator consistency:');
  console.log(`   Stump leaves: ${stump.num_leaves()}`);
  console.log(`   Pollard leaves: ${pollard.num_leaves()}`);
  console.log(`   States match: ${stump.num_leaves() === pollard.num_leaves() ? '✅' : '❌'}`);

  // Generate a proof for the first element using Pollard
  console.log('\n🔐 Generating and verifying proofs:');
  const targetElement = elements[0];
  const proof = pollard.prove_single(targetElement);
  console.log(`   Generated proof for: ${targetElement.substring(0, 16)}...`);
  console.log(`   Proof size: ${proof.length} characters`);

  // Verify the proof using Stump
  const isValid = stump.verify(proof, [targetElement]);
  console.log(`   Proof verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

  // Generate batch proof for multiple elements
  console.log('\n📊 Batch proof example:');
  const batchTargets = [elements[0], elements[2]]; // First and third elements
  const batchProof = pollard.batch_proof(batchTargets);
  const batchValid = stump.verify(batchProof, batchTargets);
  console.log(`   Batch proof for 2 elements: ${batchValid ? '✅ VALID' : '❌ INVALID'}`);

  // Demonstrate accumulator updates (remove an element)
  console.log('\n🔄 Accumulator update example:');
  const initialLeaves = stump.num_leaves();
  
  // Remove the second element (we need a proof for deletion)
  const elementToRemove = elements[1];
  const deletionProof = pollard.prove_single(elementToRemove);
  
  // Apply the deletion to both accumulators
  stump.modify(deletionProof, [], [elementToRemove]);
  pollard.modify(deletionProof, JSON.stringify([]), [elementToRemove]);
  
  console.log(`   Removed element: ${elementToRemove.substring(0, 16)}...`);
  console.log(`   Leaves before: ${initialLeaves}, after: ${stump.num_leaves()}`);
  console.log(`   States still match: ${stump.num_leaves() === pollard.num_leaves() ? '✅' : '❌'}`);

  // Serialize and deserialize Stump
  console.log('\n💾 Serialization example:');
  const stumpJson = stump.to_json();
  const recreatedStump = WasmStump.from_json(stumpJson);
  console.log(`   Serialized stump: ${stumpJson.length} characters`);
  console.log(`   Recreated stump leaves: ${recreatedStump.num_leaves()}`);
  console.log(`   Serialization successful: ${stump.num_leaves() === recreatedStump.num_leaves() ? '✅' : '❌'}`);

  // Display final state
  console.log('\n📈 Final accumulator state:');
  console.log(`   Total leaves: ${stump.num_leaves()}`);
  console.log(`   Root hashes: ${stump.roots().length}`);
  stump.roots().forEach((root, index) => {
    console.log(`     Root ${index + 1}: ${root.substring(0, 16)}...`);
  });

  console.log('\n🎉 Basic usage example completed successfully!');
  
  // Clean up
  stump.free();
  pollard.free();
  recreatedStump.free();
  console.log('🧹 Resources cleaned up');
}

// Run the example
basicUsageExample().catch(console.error);