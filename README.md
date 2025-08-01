# Rustreexo FFI

A consolidated repository for Foreign Function Interface (FFI) bindings to Rustreexo, providing high-performance Utreexo accumulator implementations for multiple programming languages and platforms.

<p>
    <a href="https://github.com/utreexo/rustreexo-ffi/blob/main/LICENSE"><img alt="MIT Licensed" src="https://img.shields.io/badge/license-MIT-blue.svg"/></a>
    <a href="https://blog.rust-lang.org/2022/05/19/Rust-1.63.0.html"><img alt="Rustc Version 1.63.0+" src="https://img.shields.io/badge/rustc-1.63.0%2B-lightgrey.svg"/></a>
</p>

## Overview

This repository consolidates various FFI implementations of [Rustreexo](https://github.com/mit-dci/rustreexo), a Rust implementation of the Utreexo cryptographic accumulator.

## Supported Languages and Platforms

| Language | Platform             | Published Package                                                  | Documentation                           |
| -------- | -------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| WASM     | Web/Node.js/Bundlers | [@rustreexo/rustreexo-wasm-*](https://www.npmjs.com/org/rustreexo) | [WASM Readme](rustreexo-wasm/README.md) |

## Subprojects

### 🦀 WASM Bindings (`rustreexo-wasm/`)

**NPM Packages:**
- `@rustreexo/rustreexo-wasm-web` - For web browsers
- `@rustreexo/rustreexo-wasm-nodejs` - For Node.js  
- `@rustreexo/rustreexo-wasm-bundler` - For bundlers

See [`rustreexo-wasm/README.md`](rustreexo-wasm/README.md) for detailed documentation.

## Minimum Supported Rust Version (MSRV)

This library should compile with any combination of features with Rust 1.63.0+.

## License

This project is licensed under the MIT License - see the individual subproject LICENSE files for details.
