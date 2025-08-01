# Rustreexo WASM Makefile

.PHONY: all build build-web build-node build-bundler test clean clean-all help examples test-reference test-reference-all test-coverage benchmark-node

# Default target
all: build test

# Build for web (ES modules)
build-web:
	@echo "🔨 Building WASM for web target..."
	wasm-pack build --target web --out-dir pkg

# Build for Node.js (CommonJS)
build-node:
	@echo "🔨 Building WASM for Node.js target..."
	wasm-pack build --target nodejs --out-dir pkg-node

# Build for bundlers (webpack/rollup)
build-bundler:
	@echo "🔨 Building WASM for bundler target..."
	wasm-pack build --target bundler --out-dir pkg-bundler

# Build all targets
build: build-web build-node build-bundler
	@echo "✅ All WASM targets built successfully!"

# Build in development mode (with debug symbols)
build-dev:
	@echo "🔨 Building WASM in development mode..."
	wasm-pack build --dev --target web --out-dir pkg-dev

# Run Rust tests
test:
	@echo "🧪 Running Rust tests..."
	cargo test

# Run WASM tests in browser
test-browser:
	@echo "🧪 Running WASM tests in browser..."
	wasm-pack test --chrome --headless

# Run WASM tests in Node.js
test-node:
	@echo "🧪 Running WASM tests in Node.js..."
	wasm-pack test --node

# Run TypeScript reference tests
test-reference: build-node
	@echo "🧪 Running TypeScript reference tests..."
	cd tests/typescript && npm install && npm run test:reference

# Run all TypeScript test suites
test-reference-all: build-node
	@echo "🧪 Running all TypeScript test suites..."
	cd tests/typescript && npm install && npm run test:all

# Run TypeScript tests with coverage
test-coverage: build-node
	@echo "📊 Running TypeScript tests with coverage..."
	cd tests/typescript && npm install && npm run test:coverage

# Run Node.js performance benchmark
benchmark-node: build-node
	@echo "⚡ Running Node.js performance benchmark..."
	cd tests/typescript && npm install && npm run benchmark

# Run all tests
test-all: test test-browser test-node test-reference
	@echo "✅ All tests completed!"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf pkg pkg-node pkg-bundler pkg-dev target/
	cargo clean

# Clean all artifacts including dependencies
clean-all: clean
	@echo "🧹 Cleaning all artifacts and dependencies..."
	rm -rf examples/node_modules examples/package-lock.json
	rm -rf tests/typescript/node_modules tests/typescript/package-lock.json

# Install dependencies and tools
install:
	@echo "📦 Installing dependencies..."
	@if ! command -v wasm-pack > /dev/null; then \
		echo "Installing wasm-pack..."; \
		curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh; \
	fi
	@echo "✅ Dependencies installed!"

# Run examples
examples:
	@echo "🚀 Setting up examples..."
	cd examples && npm install
	@echo "Examples ready! Run 'make example-basic' or 'make example-browser'"

# Run basic Node.js example
example-basic: build-node
	@echo "🚀 Running basic Node.js example..."
	cd examples && node nodejs_example.cjs

# Serve browser example
example-browser: build-web
	@echo "🌐 Starting web server for browser example..."
	@echo "Open http://localhost:8000/examples/browser_example.html in your browser"
	python -m http.server 8000 || npx serve . -p 8000

# Check code formatting
fmt:
	@echo "🎨 Formatting Rust code..."
	cargo fmt

# Run clippy lints
clippy:
	@echo "🔍 Running clippy lints..."
	cargo clippy -- -D warnings

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	cargo doc --no-deps --open

# Publish to npm (requires authentication)
publish: build test
	@echo "📦 Publishing to npm..."
	cd pkg && npm publish

# Check package size
size: build-web
	@echo "📏 Checking package size..."
	@echo "WASM binary size:"
	@ls -lh pkg/*.wasm | awk '{print $$9 ": " $$5}'
	@echo "JS bindings size:"
	@ls -lh pkg/*.js | awk '{print $$9 ": " $$5}'

# Benchmark performance
benchmark: build-node
	@echo "⚡ Running performance benchmarks..."
	cd examples && node -e "require('./nodejs_example.js')"

# Help target
help:
	@echo "Rustreexo WASM Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build all WASM targets"
	@echo "  build-web      - Build for web browsers (ES modules)"
	@echo "  build-node     - Build for Node.js (CommonJS)"
	@echo "  build-bundler  - Build for bundlers (webpack/rollup)"
	@echo "  build-dev      - Build in development mode"
	@echo ""
	@echo "  test           - Run Rust tests"
	@echo "  test-browser   - Run WASM tests in browser"
	@echo "  test-node      - Run WASM tests in Node.js"
	@echo "  test-reference - Run TypeScript reference tests"
	@echo "  test-reference-all - Run all TypeScript test suites"
	@echo "  test-coverage  - Run TypeScript tests with coverage"
	@echo "  test-all       - Run all tests (Rust + WASM + TypeScript)"
	@echo ""
	@echo "  benchmark-node - Run Node.js performance benchmark"
	@echo ""
	@echo "  examples       - Set up examples"
	@echo "  example-basic  - Run basic Node.js example"
	@echo "  example-browser- Serve browser example"
	@echo ""
	@echo "  fmt            - Format code"
	@echo "  clippy         - Run lints"
	@echo "  docs           - Generate documentation"
	@echo "  clean          - Clean build artifacts"
	@echo "  clean-all      - Clean all artifacts and dependencies"
	@echo "  install        - Install dependencies"
	@echo "  size           - Check package size"
	@echo "  benchmark      - Run performance benchmarks"
	@echo "  publish        - Publish to npm"
	@echo "  help           - Show this help"