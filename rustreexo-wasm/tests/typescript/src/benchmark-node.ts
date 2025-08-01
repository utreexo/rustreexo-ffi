/**
 * Node.js Performance Benchmark for Rustreexo WASM
 *
 * This benchmark suite tests the performance of Utreexo operations using real cryptographic hashing
 * across different scales (10, 100, 1000 leaves) to measure scalability and performance characteristics.
 */
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

// WASM module and objects
let wasmModule: any;
const wasmObjects: any[] = [];

// Benchmark configuration
const BENCHMARK_SIZES = [10, 100, 1000, 10000, 100000];
const PROOF_SAMPLES = 10; // Number of proofs to generate/verify per size
const WARMUP_ITERATIONS = 3; // Warmup runs to stabilize performance

// Performance tracking
interface BenchmarkResult {
  size: number;
  additionTime: number;
  additionThroughput: number;
  proofGenerationTime: number;
  proofGenerationThroughput: number;
  proofVerificationTime: number;
  proofVerificationThroughput: number;
  memoryUsage: any;
  averageProofSize: number;
}

/**
 * Real cryptographic hash functions matching the reference tests
 */
function hashFromU8(preimage: number): string {
  if (preimage < 0 || preimage > 255 || !Number.isInteger(preimage)) {
    throw new Error(`Invalid u8 value: ${preimage}. Must be an integer between 0-255.`);
  }

  const singleByteArray = new Uint8Array([preimage]);
  const wordArray = CryptoJS.lib.WordArray.create(Array.from(singleByteArray));
  const sha256Hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);

  return sha256Hash;
}

/**
 * Generate cryptographically secure test hashes
 */
function generateTestHashes(count: number): string[] {
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Use modulo to cycle through u8 values for deterministic but varied hashes
    hashes.push(hashFromU8(i % 256));
  }
  return hashes;
}

/**
 * Clean up all WASM objects
 */
function cleanup(): void {
  wasmObjects.forEach((obj) => {
    try {
      obj.free();
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  wasmObjects.length = 0;
}

/**
 * Measure memory usage
 */
function measureMemory(): any {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage();
}

/**
 * Run warmup iterations to stabilize performance
 */
async function warmup(): Promise<void> {
  console.log('🔥 Running warmup iterations...');

  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    const stump = new wasmModule.WasmStump();
    const pollard = new wasmModule.WasmPollard();
    wasmObjects.push(stump, pollard);

    const testHashes = generateTestHashes(10);
    const wasmHashes = testHashes.map((hash) => {
      const wasmHash = new wasmModule.Hash(hash);
      wasmObjects.push(wasmHash);
      return wasmHash;
    });

    const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });

    try {
      stump.modify(emptyProof, wasmHashes, []);

      const additions = wasmHashes.map((wasmHash) => ({ hash: wasmHash, remember: true }));
      pollard.modify(emptyProof, JSON.stringify(additions), []);

      // Generate and verify a proof
      if (testHashes.length > 0) {
        const proof = pollard.prove_single(testHashes[0]!);
        stump.verify(proof, [testHashes[0]!]);
      }
    } catch (error) {
      // Warmup with fallback API
      stump.modify(emptyProof, testHashes, []);
      const additions = testHashes.map((hash) => ({ hash, remember: true }));
      pollard.modify(emptyProof, JSON.stringify(additions), []);
    }

    cleanup();
  }

  console.log('✅ Warmup completed\n');
}

/**
 * Benchmark accumulator operations for a given size
 */
async function benchmarkSize(size: number): Promise<BenchmarkResult> {
  console.log(`📊 Benchmarking with ${size} leaves...`);

  // Generate test data
  const testHashes = generateTestHashes(size);
  console.log(`   Generated ${testHashes.length} cryptographic hashes`);

  // Create fresh accumulators
  const stump = new wasmModule.WasmStump();
  const pollard = new wasmModule.WasmPollard();
  wasmObjects.push(stump, pollard);

  const memoryBefore = measureMemory();

  // Benchmark: Addition
  console.log('   🔧 Benchmarking additions...');
  const additionStart = performance.now();

  const wasmHashes = testHashes.map((hash) => {
    const wasmHash = new wasmModule.Hash(hash);
    wasmObjects.push(wasmHash);
    return wasmHash;
  });

  const emptyProof = JSON.stringify({ targets: [], proof: [], hashes: [] });

  let useFallbackAPI = false;
  try {
    // Try WASM Hash object API first
    stump.modify(emptyProof, wasmHashes, []);
    const additions = wasmHashes.map((wasmHash) => ({ hash: wasmHash, remember: true }));
    pollard.modify(emptyProof, JSON.stringify(additions), []);
  } catch (error) {
    // Fallback to string API
    useFallbackAPI = true;
    stump.modify(emptyProof, testHashes, []);
    const additions = testHashes.map((hash) => ({ hash, remember: true }));
    pollard.modify(emptyProof, JSON.stringify(additions), []);
  }

  const additionEnd = performance.now();
  const additionTime = additionEnd - additionStart;
  const additionThroughput = size / (additionTime / 1000); // ops/sec

  console.log(
    `   ✅ Addition: ${additionTime.toFixed(2)}ms (${additionThroughput.toFixed(0)} leaves/sec)`
  );
  console.log(`      API mode: ${useFallbackAPI ? 'String fallback' : 'WASM Hash objects'}`);
  console.log(`      Accumulator leaves: ${stump.num_leaves()}`);
  console.log(`      Root hashes: ${stump.roots().length}`);

  // Benchmark: Proof Generation
  console.log('   🔐 Benchmarking proof generation...');
  const proofCount = Math.min(PROOF_SAMPLES, size);
  const proofs: Array<{ proof: string; target: string }> = [];

  const proofGenStart = performance.now();

  for (let i = 0; i < proofCount; i++) {
    const targetIndex = Math.floor((i / proofCount) * size);
    const targetHash = testHashes[targetIndex]!;
    const proof = pollard.prove_single(targetHash);
    proofs.push({ proof, target: targetHash });
  }

  const proofGenEnd = performance.now();
  const proofGenerationTime = proofGenEnd - proofGenStart;
  const proofGenerationThroughput = proofCount / (proofGenerationTime / 1000); // proofs/sec

  // Calculate average proof size
  const totalProofSize = proofs.reduce((sum, p) => sum + p.proof.length, 0);
  const averageProofSize = totalProofSize / proofs.length;

  console.log(
    `   ✅ Proof generation: ${proofGenerationTime.toFixed(2)}ms for ${proofCount} proofs`
  );
  console.log(`      Throughput: ${proofGenerationThroughput.toFixed(1)} proofs/sec`);
  console.log(`      Average proof size: ${averageProofSize.toFixed(0)} characters`);

  // Benchmark: Proof Verification
  console.log('   🔍 Benchmarking proof verification...');

  const verificationStart = performance.now();
  let validProofs = 0;

  for (const { proof, target } of proofs) {
    const isValid = stump.verify(proof, [target]);
    if (isValid) validProofs++;
  }

  const verificationEnd = performance.now();
  const proofVerificationTime = verificationEnd - verificationStart;
  const proofVerificationThroughput = proofCount / (proofVerificationTime / 1000); // verifications/sec

  console.log(
    `   ✅ Proof verification: ${proofVerificationTime.toFixed(2)}ms for ${proofCount} proofs`
  );
  console.log(`      Throughput: ${proofVerificationThroughput.toFixed(1)} verifications/sec`);
  console.log(
    `      Valid proofs: ${validProofs}/${proofCount} (${((validProofs / proofCount) * 100).toFixed(1)}%)`
  );

  const memoryAfter = measureMemory();
  const memoryDelta = {
    rss: memoryAfter.rss - memoryBefore.rss,
    heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
    heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
    external: memoryAfter.external - memoryBefore.external,
    arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
  };

  console.log(
    `   📊 Memory delta: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB heap, ${(memoryDelta.rss / 1024 / 1024).toFixed(2)}MB RSS`
  );

  cleanup();

  return {
    size,
    additionTime,
    additionThroughput,
    proofGenerationTime,
    proofGenerationThroughput,
    proofVerificationTime,
    proofVerificationThroughput,
    memoryUsage: memoryDelta,
    averageProofSize,
  };
}

/**
 * Print comprehensive benchmark results
 */
function printResults(results: BenchmarkResult[]): void {
  console.log('\n📈 BENCHMARK RESULTS SUMMARY');
  console.log('='.repeat(80));

  // Performance table
  console.log('\n🚀 PERFORMANCE METRICS');
  console.log('-'.repeat(80));
  console.log(
    'Size'.padEnd(8) +
      'Addition'.padEnd(12) +
      'Add/sec'.padEnd(10) +
      'ProofGen'.padEnd(12) +
      'Proof/sec'.padEnd(11) +
      'Verify'.padEnd(12) +
      'Ver/sec'.padEnd(10)
  );
  console.log('-'.repeat(80));

  for (const result of results) {
    console.log(
      result.size.toString().padEnd(8) +
        `${result.additionTime.toFixed(1)}ms`.padEnd(12) +
        `${result.additionThroughput.toFixed(0)}`.padEnd(10) +
        `${result.proofGenerationTime.toFixed(1)}ms`.padEnd(12) +
        `${result.proofGenerationThroughput.toFixed(1)}`.padEnd(11) +
        `${result.proofVerificationTime.toFixed(1)}ms`.padEnd(12) +
        `${result.proofVerificationThroughput.toFixed(1)}`.padEnd(10)
    );
  }

  // Memory usage table
  console.log('\n💾 MEMORY USAGE');
  console.log('-'.repeat(50));
  console.log('Size'.padEnd(8) + 'Heap (MB)'.padEnd(12) + 'RSS (MB)'.padEnd(12) + 'Proof Size');
  console.log('-'.repeat(50));

  for (const result of results) {
    console.log(
      result.size.toString().padEnd(8) +
        `${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}`.padEnd(12) +
        `${(result.memoryUsage.rss / 1024 / 1024).toFixed(2)}`.padEnd(12) +
        `${result.averageProofSize.toFixed(0)} chars`
    );
  }

  // Scalability analysis
  console.log('\n📊 SCALABILITY ANALYSIS');
  console.log('-'.repeat(50));

  if (results.length >= 2) {
    const small = results[0]!;
    const large = results[results.length - 1]!;
    const sizeRatio = large.size / small.size;
    const addTimeRatio = large.additionTime / small.additionTime;
    const proofTimeRatio = large.proofGenerationTime / small.proofGenerationTime;

    console.log(`Size scaling: ${small.size} → ${large.size} (${sizeRatio}x)`);
    console.log(`Addition time scaling: ${addTimeRatio.toFixed(2)}x`);
    console.log(`Proof generation scaling: ${proofTimeRatio.toFixed(2)}x`);
    console.log(
      `Addition efficiency: ${((sizeRatio / addTimeRatio) * 100).toFixed(1)}% (100% = linear)`
    );
    console.log(
      `Proof efficiency: ${((sizeRatio / proofTimeRatio) * 100).toFixed(1)}% (100% = linear)`
    );
  }

  console.log('\n🎯 PERFORMANCE SUMMARY');
  console.log('-'.repeat(50));
  console.log(
    `Best addition throughput: ${Math.max(...results.map((r) => r.additionThroughput)).toFixed(0)} leaves/sec`
  );
  console.log(
    `Best proof generation: ${Math.max(...results.map((r) => r.proofGenerationThroughput)).toFixed(1)} proofs/sec`
  );
  console.log(
    `Best proof verification: ${Math.max(...results.map((r) => r.proofVerificationThroughput)).toFixed(1)} verifications/sec`
  );
  console.log(
    `Memory efficiency: ${(results[results.length - 1]!.memoryUsage.heapUsed / results[results.length - 1]!.size / 1024).toFixed(1)} KB/leaf`
  );
}

/**
 * Main benchmark runner
 */
async function runBenchmark(): Promise<void> {
  console.log('🚀 Rustreexo WASM Node.js Performance Benchmark');
  console.log('='.repeat(80));
  console.log(`🔐 Using real SHA-256/SHA-512-256 cryptographic hashing`);
  console.log(`📏 Testing sizes: ${BENCHMARK_SIZES.join(', ')} leaves`);
  console.log(`🔬 Proof samples: ${PROOF_SAMPLES} per size`);
  console.log(`⚡ Node.js version: ${process.version}`);
  console.log(
    `🧠 Memory limit: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(0)}MB initial RSS`
  );

  try {
    // Load WASM module
    console.log('\n📦 Loading WASM module...');
    wasmModule = await import('../../../pkg-node/rustreexo_wasm.js');
    console.log(`✅ WASM module loaded, version: ${wasmModule.version()}`);

    // Run warmup
    await warmup();

    // Run benchmarks
    const results: BenchmarkResult[] = [];

    for (const size of BENCHMARK_SIZES) {
      const result = await benchmarkSize(size);
      results.push(result);
      console.log(''); // Add spacing between benchmark runs
    }

    // Print comprehensive results
    printResults(results);

    console.log('\n🎉 Benchmark completed successfully!');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    cleanup();
  }
}

// Run benchmark if this file is executed directly
const __filename = fileURLToPath(import.meta.url);

// Check if this is the main module (ES module compatible)
const isMainModule =
  process.argv[1] === __filename || process.argv[1]?.endsWith('benchmark-node.ts');

if (isMainModule) {
  // Enable garbage collection if available
  if (global.gc) {
    console.log('🗑️  Garbage collection enabled for accurate memory measurements');
  } else {
    console.log('ℹ️  Run with --expose-gc flag for more accurate memory measurements');
  }

  runBenchmark().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { runBenchmark, BenchmarkResult };
