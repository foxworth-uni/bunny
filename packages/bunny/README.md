# Bunny

Fast MDX v3 compiler for the browser. Compile MDX to JSX with WebAssembly for near-native performance.

## Features

- 🚀 **Fast** - Powered by Rust and WebAssembly
- 📦 **Small** - ~1.5MB WASM binary (~400KB gzipped)
- 🎯 **Type-safe** - Full TypeScript support
- ⚡ **Zero config** - Works out of the box
- 🔒 **Secure** - Sandboxed WASM execution
- 🌐 **Universal** - Works in all modern browsers

## Installation

```bash
npm install bunny
# or
pnpm add bunny
# or
yarn add bunny
```

## Quick Start

```typescript
import { compile } from 'bunny';

// Compile MDX to JSX
const result = await compile('# Hello **world**!');
console.log(result.code); // JSX code
```

## Usage

### Basic Compilation

```typescript
import { compile } from 'bunny';

const mdx = `
---
title: My Post
author: Jane Doe
---

# Hello World

This is **MDX** with *markdown* and JSX!

<Button>Click me</Button>
`;

const result = await compile(mdx, {
  gfm: true,        // GitHub Flavored Markdown
  math: true,       // Math expressions
  footnotes: true,  // Footnotes
  defaultPlugins: true
});

console.log(result.code);        // Compiled JSX
console.log(result.frontmatter); // { title: 'My Post', author: 'Jane Doe' }
console.log(result.images);      // Array of image URLs
```

### With Options

```typescript
const result = await compile(mdx, {
  // Enable GFM features (tables, strikethrough, task lists, autolinks)
  gfm: true,

  // Enable footnotes with backrefs
  footnotes: true,

  // Enable math expressions ($...$, $$...$$)
  math: true,

  // JSX runtime import path
  jsxRuntime: 'react/jsx-runtime',

  // Enable default plugins (heading IDs, image optimization)
  defaultPlugins: true,

  // File path for better error messages
  filepath: 'content/blog/post.mdx'
});
```

### Manual Initialization

By default, the WASM module is initialized automatically on first use. You can manually initialize it:

```typescript
import { initialize, compileSync } from 'bunny';

// Initialize once
await initialize();

// Then use sync version (faster for multiple compilations)
const result = compileSync('# Hello');
```

### Error Handling

```typescript
import { compile, CompileError } from 'bunny';

try {
  const result = await compile('import { x } fro "y"'); // Invalid syntax
} catch (error) {
  const err = error as CompileError;
  console.error(err.message);    // Error message
  console.error(err.file);       // File path (if provided)
  console.error(err.line);       // Line number
  console.error(err.column);     // Column number
  console.error(err.context);    // Source code context
  console.error(err.suggestion); // Fix suggestion
}
```

## API

### `compile(source, options?)`

Compile MDX source to JSX (async).

**Parameters:**
- `source: string` - MDX source code
- `options?: CompileOptions` - Compilation options

**Returns:** `Promise<CompileResult>`

### `compileSync(source, options?)`

Compile MDX source to JSX (sync). Requires prior initialization.

**Parameters:**
- `source: string` - MDX source code
- `options?: CompileOptions` - Compilation options

**Returns:** `CompileResult`

**Throws:** Error if WASM not initialized

### `initialize()`

Manually initialize the WASM module.

**Returns:** `Promise<void>`

### Types

#### `CompileOptions`

```typescript
interface CompileOptions {
  gfm?: boolean;           // GitHub Flavored Markdown
  footnotes?: boolean;     // Footnotes with backrefs
  math?: boolean;          // Math expressions
  jsxRuntime?: string;     // JSX runtime path
  defaultPlugins?: boolean; // Default plugins
  filepath?: string;       // File path for errors
}
```

#### `CompileResult`

```typescript
interface CompileResult {
  code: string;                    // Generated JSX
  frontmatter?: Record<string, unknown>; // Parsed frontmatter
  frontmatterFormat?: 'yaml' | 'toml';
  images: string[];                // Image URLs
  namedExports: string[];          // Named exports
  reexports: string[];             // Re-exports
  imports: string[];               // Imports
  defaultExport?: string;          // Default export
}
```

## Browser Support

- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Any browser with WebAssembly support

## Performance

Bunny uses WebAssembly for near-native performance:

- Small files (<10KB): 1-5ms
- Medium files (10-100KB): 5-50ms
- Large files (>100KB): 50-200ms

## License

MIT

## Credits

Built with [Rust](https://www.rust-lang.org/) and [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen).
