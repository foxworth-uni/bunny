# bunny-wasm

WebAssembly bindings for bunny-mdx - compile MDX v3 to JSX in the browser and WASM environments.

> **Note**: For Node.js applications, use [@fob/bunny-node](https://www.npmjs.com/package/@fob/bunny-node) (native NAPI module) for ~10-20% better performance. This WASM package is optimized for browsers and universal runtime compatibility.

## Features

- 🚀 Compile MDX v3 to JSX in the browser and WASM runtimes
- 🔒 Zero unsafe code - all FFI handled by wasm-bindgen
- 📦 Optimized for minimal WASM binary size (~1.5MB)
- 🎯 Full TypeScript type definitions
- ⚡ Near-native performance
- 🛡️ Structured error reporting with source context
- 🌐 Universal compatibility (browsers, Deno, Node.js, Bun)

## Installation

### JSR (Recommended for Deno)

```bash
# Deno
deno add @fob/bunny-wasm

# Node.js / npm (via jsr)
npx jsr add @fob/bunny-wasm

# pnpm
pnpm dlx jsr add @fob/bunny-wasm

# yarn
yarn dlx jsr add @fob/bunny-wasm
```

### npm (Alternative)

```bash
npm install bunny-wasm
```

## Usage

### Deno / JSR

```typescript
import { compile } from "@fob/bunny-wasm";

// Compile MDX to JSX
const result = compile('# Hello\n\nThis is **MDX**!', {
  gfm: true,
  math: true,
  footnotes: true,
  default_plugins: true
});

console.log(result.code);        // Compiled JSX
console.log(result.frontmatter); // Parsed frontmatter (JSON)
console.log(result.images);      // Collected images
```

### Browser (ESM)

```javascript
import { init_wasm, compile } from 'bunny-wasm';

// Initialize the WASM module
await init_wasm();

// Compile MDX to JSX
const result = compile('# Hello\n\nThis is **MDX**!', {
  gfm: true,
  math: true,
  footnotes: true,
  default_plugins: true
});

console.log(result.code);        // Compiled JSX
console.log(result.frontmatter); // Parsed frontmatter (JSON)
console.log(result.images);      // Collected images
```

### With Options

```javascript
const result = compile(mdxSource, {
  gfm: true,              // GitHub Flavored Markdown
  math: true,             // Math expressions ($...$)
  footnotes: true,        // Footnotes with backrefs
  jsx_runtime: 'react/jsx-runtime',  // JSX runtime path
  default_plugins: true,  // Heading IDs, image optimization
  filepath: 'blog.mdx'    // For error reporting
});
```

### Error Handling

```javascript
try {
  const result = compile(invalidMdx, {});
} catch (error) {
  console.error('Compilation failed:', error.message);
  if (error.line) console.error(`Line ${error.line}:${error.column}`);
  if (error.context) console.error(error.context);
  if (error.suggestion) console.error('Suggestion:', error.suggestion);
}
```

### Result Structure

```typescript
interface CompileResult {
  code: string;                    // Generated JSX code
  frontmatter?: string;            // Parsed frontmatter (JSON string)
  frontmatter_format?: 'yaml' | 'toml';
  images: string[];                // Image URLs
  named_exports: string[];         // ESM named exports
  reexports: string[];             // ESM re-exports
  imports: string[];               // ESM imports
  default_export?: string;         // Default export name
}
```

## Building from Source

```bash
# Development build (faster, larger)
wasm-pack build --target web --dev crates/bunny-wasm

# Production build (optimized)
wasm-pack build --target web --release crates/bunny-wasm

# Output in crates/bunny-wasm/pkg/
```

## Binary Size

- **Development**: ~2.4MB (includes debug info)
- **Release**: ~1.5MB (optimized)
- **Gzipped**: ~400-500KB (estimated)

## Browser Compatibility

Requires browsers with WebAssembly support:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Node.js 12+ (with wasm support)

## Security

- All inputs are validated by the markdown parser
- ESM syntax validated with OXC parser
- No unsafe code or dynamic code execution
- WASM provides sandboxed execution

## License

MIT
