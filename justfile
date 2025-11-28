# Bunny MDX Benchmark Fixtures Management

# Default recipe lists all available commands
default:
    @just --list

# Format Rust code
fmt:
    cargo fmt --all

# Lint Rust code
lint:
    cargo clippy --all-targets --all-features -- -D warnings

# Run tests
test:
    cargo test --all-targets --all-features

# Check code quality (format check + lint + tests)
check:
    cargo fmt --all --check
    cargo clippy --all-targets --all-features -- -D warnings
    cargo test --all-targets --all-features

# WASM Build Commands
# ===================

# Build WASM for browser (Rust -> WASM)
wasm-build-web:
    cd crates/bunny-wasm && wasm-pack build --target web --release --out-dir ../../packages/bunny-wasm/pkg

# Build WASM for Node.js (Rust -> WASM)
wasm-build-node:
    cd crates/bunny-wasm && wasm-pack build --target nodejs --release --out-dir ../../packages/bunny-wasm/pkg-node

# Build WASM package (TypeScript compilation)
wasm-build-js:
    cd packages/bunny-wasm && pnpm build:js

# Build complete WASM (Rust + TypeScript + optimization) - browser + Node.js
wasm-build:
    just wasm-build-web
    cd packages/bunny-wasm && wasm-opt -Os ./pkg/bunny_wasm_bg.wasm -o ./pkg/bunny_wasm_bg.wasm
    just wasm-build-node
    just wasm-build-js

# Build browser WASM only (faster for development)
wasm-build-dev:
    cd crates/bunny-wasm && wasm-pack build --target web --dev --out-dir ../../packages/bunny-wasm/pkg
    cd packages/bunny-wasm && pnpm build:js

# WASM Test Commands
# ==================

# Run Rust WASM tests (wasm-bindgen-test)
wasm-test-rust:
    cd crates/bunny-wasm && wasm-pack test --headless --firefox

# Run TypeScript WASM tests
wasm-test-js:
    cd packages/bunny-wasm && pnpm test:run

# Run all WASM tests
wasm-test:
    just wasm-test-rust
    just wasm-test-js

# Run WASM tests with coverage
wasm-test-coverage:
    cd packages/bunny-wasm && pnpm test:coverage

# WASM Check Commands
# ===================

# Check WASM code quality (format + lint + typecheck)
wasm-check:
    cargo fmt --all --check
    cd crates/bunny-wasm && cargo clippy --all-targets --all-features -- -D warnings
    cd packages/bunny-wasm && tsc --noEmit

# Clean WASM artifacts
wasm-clean:
    cd crates/bunny-wasm && cargo clean
    rm -rf packages/bunny-wasm/pkg
    rm -rf packages/bunny-wasm/dist

# Example Commands
# ================

# Run the Axum blog example
example-blog:
    cd examples/blog-axum && cargo run --release

# Build the Axum blog example
example-blog-build:
    cd examples/blog-axum && cargo build --release

# Check the Axum blog example
example-blog-check:
    cd examples/blog-axum && cargo check

# Clone Next.js docs (sparse checkout of docs folder only)
fetch-nextjs-docs:
    #!/usr/bin/env bash
    set -euo pipefail

    FIXTURES_DIR="packages/benchmarks/fixtures/nextjs"

    echo "Fetching Next.js documentation from GitHub..."

    # Remove existing directory if present
    if [ -d "$FIXTURES_DIR" ]; then
        echo "Removing existing Next.js fixtures..."
        rm -rf "$FIXTURES_DIR"
    fi

    # Create temporary clone directory
    mkdir -p "$FIXTURES_DIR"
    cd "$FIXTURES_DIR"

    # Initialize git repo with sparse checkout
    git init
    git remote add origin https://github.com/vercel/next.js.git
    git config core.sparseCheckout true

    # Configure sparse checkout to only fetch docs folder
    echo "docs/" >> .git/info/sparse-checkout

    # Fetch only the canary branch with depth 1 (shallow clone)
    git fetch --depth 1 origin canary
    git checkout canary

    echo "✅ Next.js docs fetched successfully to $FIXTURES_DIR"
    echo "📊 Available MDX files:"
    find docs -name "*.mdx" -type f | head -20

# Clean downloaded Next.js fixtures
clean-fixtures:
    #!/usr/bin/env bash
    echo "Cleaning Next.js fixtures..."
    rm -rf packages/benchmarks/fixtures/nextjs
    echo "✅ Fixtures cleaned"

# Show info about current fixtures
info-fixtures:
    #!/usr/bin/env bash
    FIXTURES_DIR="packages/benchmarks/fixtures"

    echo "📋 Current Fixtures Status"
    echo "=========================="
    echo ""
    echo "Original fixtures:"
    ls -lh "$FIXTURES_DIR"/{simple,complex,large,realworld}.mdx 2>/dev/null || echo "  Not found"
    echo ""

    if [ -d "$FIXTURES_DIR/nextjs" ]; then
        echo "Next.js docs repository:"
        echo "  Location: $FIXTURES_DIR/nextjs"
        echo "  Total MDX files: $(find "$FIXTURES_DIR/nextjs/docs" -name "*.mdx" -type f 2>/dev/null | wc -l)"
        echo ""
        echo "File sizes:"
        find "$FIXTURES_DIR/nextjs/docs" -name "*.mdx" -type f -exec wc -c {} \; | \
            awk '{sum+=$1; count++} END {printf "  Average: %.1f KB\n  Total files: %d\n", sum/count/1024, count}'
    else
        echo "Next.js fixtures: Not found (run 'just fetch-nextjs-docs')"
    fi
