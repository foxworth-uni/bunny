# @bunny/mdx-wasm

WASM bindings for bunny-mdx compiler - optimized for bundlers (webpack, Turbopack, etc.)

## Installation

```bash
pnpm add @bunny/mdx-wasm
```

## Usage

### Async API (Auto-initializes)

```typescript
import { compile } from '@bunny/mdx-wasm';

const result = await compile('# Hello **world**!', {
  gfm: true,
  math: true,
});
```

### Sync API (Requires pre-initialization)

For Server Components in Next.js, initialize WASM once at startup:

**instrumentation.ts** (Next.js):
```typescript
import { initialize } from '@bunny/mdx-wasm';

export async function register() {
  await initialize();
}
```

Then use sync API in Server Components:

```typescript
import { compileSync } from '@bunny/mdx-wasm';

export default function Page() {
  const result = compileSync('# Hello **world**!', { gfm: true });
  // ...
}
```

## API

### `initialize(): Promise<void>`

Initialize the WASM module. Safe to call multiple times.

### `compile(source: string, options?: CompileOptions): Promise<CompileResult>`

Async compilation - auto-initializes if needed.

### `compileSync(source: string, options?: CompileOptions): CompileResult`

Synchronous compilation - requires WASM to be initialized first.

## Options

- `gfm?: boolean` - Enable GitHub Flavored Markdown
- `footnotes?: boolean` - Enable footnotes
- `math?: boolean` - Enable math support
- `jsxRuntime?: string` - JSX runtime import path (default: "react/jsx-runtime")
- `defaultPlugins?: boolean` - Enable default plugins
- `filepath?: string` - File path for error reporting

## License

MIT

