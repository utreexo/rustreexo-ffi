# Rustreexo FFI

A consolidated repository for Foreign Function Interface (FFI) bindings to Rustreexo, providing high-performance Utreexo accumulator implementations for multiple programming languages and platforms.

<p>
    <a href="https://github.com/utreexo/rustreexo-ffi/blob/main/LICENSE"><img alt="MIT Licensed" src="https://img.shields.io/badge/license-MIT-blue.svg"/></a>
    <a href="https://blog.rust-lang.org/2022/05/19/Rust-1.63.0.html"><img alt="Rustc Version 1.63.0+" src="https://img.shields.io/badge/rustc-1.63.0%2B-lightgrey.svg"/></a>
</p>

## Overview

This repository consolidates various FFI implementations of [Rustreexo](https://github.com/mit-dci/rustreexo), a Rust implementation of the Utreexo cryptographic accumulator. Utreexo is a novel hash-based accumulator and UTXO set representation that allows for space-efficient Bitcoin nodes.

## Subprojects

### 🦀 WASM Bindings (`rustreexo-wasm/`)

High-performance WebAssembly bindings for web browsers, Node.js, and bundlers.

**Features:**
- **Cross-platform**: Works in browsers, Node.js, and bundlers (webpack, rollup, etc.)
- **TypeScript Support**: Full type definitions included  
- **Performance Optimized**: Native Rust speed in JavaScript environments
- **Memory Efficient**: Optimized for large datasets with proper cleanup
- **Comprehensive Testing**: Extensive test coverage with reference vectors

**NPM Packages:**
- `@rustreexo/rustreexo-wasm-web` - For web browsers
- `@rustreexo/rustreexo-wasm-nodejs` - For Node.js  
- `@rustreexo/rustreexo-wasm-bundler` - For bundlers

**Quick Start:**
```bash
# Install for your target environment
npm install @rustreexo/rustreexo-wasm-nodejs

# Basic usage
const { WasmStump, WasmPollard } = require('@rustreexo/rustreexo-wasm-nodejs');

const stump = new WasmStump();
const pollard = new WasmPollard();

// Add elements to accumulator
const elements = ['hash1', 'hash2', 'hash3'];
stump.modify('{"targets":[],"hashes":[]}', elements, []);

// Generate and verify proofs
const proof = pollard.prove_single('hash1');
const isValid = stump.verify(proof, ['hash1']);
console.log('Proof valid:', isValid);

// Clean up memory
stump.free();
pollard.free();
```

See [`rustreexo-wasm/README.md`](rustreexo-wasm/README.md) for detailed documentation.

## Supported Languages and Platforms

| Language | Platform | Published Package | Documentation |
| -------- | -------- | ----------------- | ------------- |
| WASM     | Web/Node.js/Bundlers | [@rustreexo/rustreexo-wasm-*](https://www.npmjs.com/search?q=%40rustreexo%2Frustreexo-wasm) | [WASM Readme](rustreexo-wasm/README.md) |

## GitHub Actions Workflows

This repository includes comprehensive CI/CD workflows for automated testing, building, and releasing:

### WASM Workflows
- **WASM CI** - Comprehensive testing across platforms (Linux, macOS, Windows)
- **WASM Build Artifacts** - Build and test WASM packages for all targets
- **WASM TypeScript Tests** - TypeScript reference tests and cross-platform validation
- **WASM Performance Benchmark** - Performance testing and metrics collection
- **WASM Release** - Automated NPM publishing and GitHub releases  
- **WASM Deploy to GitHub Pages** - Live demos and interactive documentation

All workflows are adapted for the consolidated repository structure and run from the appropriate subdirectories.

## Development

### Repository Structure
```
rustreexo-ffi/
├── .github/workflows/          # GitHub Actions workflows
│   ├── wasm-*.yml             # WASM-specific workflows  
│   └── dependabot.yml         # Dependency updates
├── rustreexo-wasm/            # WASM bindings subproject
│   ├── src/                   # Rust source code
│   ├── examples/              # Usage examples
│   ├── tests/                 # Test suites
│   └── pkg-*/                 # Built packages (generated)
└── README.md                  # This file
```

### Adding New FFI Bindings

When adding new language bindings (Python, Go, etc.):

1. Create a new subdirectory (e.g., `rustreexo-python/`)
2. Add language-specific workflows with appropriate prefixes (e.g., `python-ci.yml`)
3. Update this README with the new bindings documentation
4. Follow the established patterns for directory structure and CI/CD

### Workflow Development

All workflows are designed to:
- Run from appropriate working directories (`working-directory: subproject-name/`)
- Use consistent naming with prefixes (`wasm-`, `python-`, etc.)
- Handle artifacts with proper path structures
- Support the consolidated repository layout

## Minimum Supported Rust Version (MSRV)

This library should compile with any combination of features with Rust 1.63.0+.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate subproject directory
4. Ensure all tests pass in the relevant workflows
5. Submit a pull request

## License

This project is licensed under the MIT License - see the individual subproject LICENSE files for details.

## Related Projects

- [Rustreexo](https://github.com/mit-dci/rustreexo) - Core Rust implementation
- [Utreexo](https://github.com/mit-dci/utreexo) - Original specification and research
- [Bitcoin](https://github.com/bitcoin/bitcoin) - The Bitcoin protocol implementation

## Acknowledgments

- [MIT DCI](https://dci.mit.edu/) for the original Utreexo research
- The Rustreexo team for the excellent Rust implementation
- Contributors to all FFI binding implementations