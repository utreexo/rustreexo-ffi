# Node.js Performance Benchmark

This benchmark suite measures the performance of Rustreexo WASM operations using real cryptographic hashing across different scales to evaluate scalability and performance characteristics.

## 🚀 Quick Start

### Run Benchmark

```bash
# With garbage collection enabled (recommended)
npm run benchmark

# Basic run without GC
npm run benchmark:basic

# Via Makefile (builds WASM first)
make benchmark-node
```

## 📊 What It Measures

### Test Scales
- **10 leaves**: Small scale performance baseline
- **100 leaves**: Medium scale realistic usage
- **1000 leaves**: Large scale stress testing

### Operations Benchmarked

1. **Element Addition**: Adding cryptographic hashes to accumulators
   - Measures throughput in leaves/second
   - Tests both Stump and Pollard implementations

2. **Proof Generation**: Creating cryptographic proofs for elements
   - Measures throughput in proofs/second
   - Tests 10 proof samples per scale

3. **Proof Verification**: Validating proofs against accumulators
   - Measures throughput in verifications/second
   - Validates 100% proof success rate

### Real Cryptography
- **SHA-256 hashing**: Uses CryptoJS for authentic leaf hash generation
- **Real test vectors**: Generates cryptographically secure hashes, not dummy data
- **WASM compatibility**: Hash functions match the reference implementation exactly

## 📈 Performance Metrics

### Typical Results (Node.js v23)

```
Size    Addition    Add/sec   ProofGen    Proof/sec  Verify      Ver/sec   
------------------------------------------------------------------------
10      0.2ms       54920     0.5ms       20916.9    0.7ms       14042.5   
100     0.8ms       131327    0.1ms       77220.1    0.2ms       43779.6   
1000    6.0ms       167463    0.1ms       90327.7    0.2ms       40609.1   
```

### Scalability Analysis
- **Addition efficiency**: ~300% (better than linear scaling)
- **Proof efficiency**: ~43000% (significantly better than linear)
- **Memory efficiency**: ~0.5 KB per leaf

## 🔧 Technical Details

### Hash Generation
```typescript
function hashFromU8(preimage: number): string {
  const singleByteArray = new Uint8Array([preimage]);
  const wordArray = CryptoJS.lib.WordArray.create(Array.from(singleByteArray));
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}
```

### Benchmark Process
1. **Warmup**: 3 iterations to stabilize performance
2. **Memory tracking**: Before/after measurements with GC
3. **API testing**: Automatic fallback between WASM Hash objects and strings
4. **Proof validation**: Ensures 100% proof verification success

### Memory Management
- **Automatic cleanup**: All WASM objects properly freed
- **GC integration**: Optional garbage collection for accuracy
- **Memory delta tracking**: Measures actual memory usage per scale

## 🎯 Use Cases

### Development
```bash
# Quick performance check during development
npm run benchmark:basic
```

### CI/CD Integration
```bash
# Full benchmark with WASM rebuild
make benchmark-node
```

### Performance Regression Detection
- Compare results across versions
- Monitor memory usage trends
- Validate scalability characteristics

## 📋 Configuration

### Benchmark Parameters
```typescript
const BENCHMARK_SIZES = [10, 100, 1000];    // Test scales
const PROOF_SAMPLES = 10;                    // Proofs per scale
const WARMUP_ITERATIONS = 3;                 // Warmup runs
```

### Environment Variables
- **`--expose-gc`**: Enable garbage collection for accurate memory measurements
- Node.js 18+ required for optimal ES module support

## 🔍 Interpreting Results

### Performance Indicators
- **Higher throughput**: Better performance (operations/second)
- **Lower latency**: Faster individual operations (milliseconds)
- **Scalability efficiency**: >100% indicates better than linear scaling

### Memory Metrics
- **Heap usage**: JavaScript memory consumption
- **RSS usage**: Total process memory
- **Memory per leaf**: Efficiency indicator

### Proof Metrics
- **Proof size**: Larger proofs for deeper trees
- **Verification rate**: Should maintain high throughput
- **Success rate**: Must be 100% for valid implementation

## 🚨 Troubleshooting

### Common Issues

**Module import errors**
```bash
# Ensure WASM is built
make build-node
```

**Memory measurement warnings**
```bash
# Run with garbage collection
npm run benchmark  # Uses --expose-gc flag
```

**Performance variations**
- System load affects results
- First run may be slower (JIT warmup)
- Use multiple runs for average performance

### Debug Mode
```bash
# Enable verbose output
DEBUG=* npm run benchmark
```

## 🎉 Results Interpretation

The benchmark provides comprehensive performance analysis:

1. **Absolute Performance**: Raw throughput numbers
2. **Scalability Analysis**: How performance scales with size
3. **Memory Efficiency**: Resource usage per operation
4. **Proof Characteristics**: Cryptographic proof properties

Use these metrics to:
- Validate performance requirements
- Compare different implementations
- Identify performance regressions
- Optimize critical operations