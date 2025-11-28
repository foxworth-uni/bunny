# @bunny/benchmarks

Performance benchmarks for Bunny MDX implementations.

## Overview

This package contains comprehensive benchmarks comparing the performance of different MDX compilation implementations:

- **@mdx-js/mdx** - Official JavaScript MDX compiler
- **@rspress/mdx-rs** - Rspress's Rust-based MDX compiler (via NAPI)

## Running Benchmarks

### From the workspace root

Run all benchmarks:
```bash
pnpm benchmark
```

Run specific benchmark suites:
```bash
pnpm benchmark:simple      # Simple MDX documents
pnpm benchmark:complex     # Complex MDX with components
pnpm benchmark:large       # Large MDX documents
pnpm benchmark:realworld   # Real-world MDX examples
```

### From the benchmarks package

```bash
cd packages/@bunny/benchmarks
pnpm benchmark              # Run all benchmarks
pnpm benchmark simple       # Run specific benchmark
```

### Using Turborepo filters

```bash
# Run only benchmarks package
turbo run benchmark --filter=@bunny/benchmarks

# Run specific benchmark on the benchmarks package
turbo run benchmark:complex --filter=@bunny/benchmarks
```

## Benchmark Fixtures

The `/fixtures` directory contains MDX test files of varying complexity:

- **simple.mdx** - Basic markdown with minimal MDX features
- **complex.mdx** - MDX with components, expressions, and advanced features
- **large.mdx** - Large document to test scalability
- **realworld.mdx** - Real-world documentation example

## Understanding Results

Benchmarks display:
- **Ops/sec** - Operations per second (higher is better)
- **Avg Time** - Average execution time in milliseconds
- **Margin** - Statistical margin of error
- **Relative** - Speed comparison relative to the fastest implementation

## Memory Profiling

The benchmarks run with the `--expose-gc` flag to enable accurate memory measurements. This allows the JavaScript garbage collector to be explicitly triggered between benchmark runs.

## Configuration

Benchmarks use similar compilation options across all implementations:
```javascript
{
  gfm: true,        // GitHub Flavored Markdown
  footnotes: true,  // Footnote support
  math: true        // Math expression support
}
```

## Adding New Benchmarks

1. Add a new MDX fixture file to `/fixtures`
2. Add the fixture to the `fixtures` object in `benchmark.js`
3. Add a new script to `package.json` if needed
4. Update `turbo.json` pipeline if adding new script names

## Notes

- Benchmarks are not cached by Turborepo to ensure fresh results
- All benchmarks depend on `^build` to ensure dependencies are built first
- Results may vary based on system performance and Node.js version
