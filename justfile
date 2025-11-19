# Bunny MDX Benchmark Fixtures Management

# Default recipe lists all available commands
default:
    @just --list

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
