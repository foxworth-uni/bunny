# bunny-next-wasm

Fast Next.js MDX integration powered by WebAssembly - optimized for Turbopack and modern bundlers.

## Installation

```bash
pnpm add bunny-next-wasm @bunny/mdx-runtime
```

## Setup

### 1. Initialize WASM in Next.js

Create `instrumentation.ts` in your project root:

```typescript
import { initialize } from '@bunny/mdx-wasm';

export async function register() {
  await initialize();
}
```

### 2. Configure Next.js

Update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
```

## Usage

### Server Components

```tsx
import { serialize } from 'bunny-next-wasm';
import { MDXRemote } from 'bunny-next-wasm/client';

export default async function Page() {
  const mdxSource = await serialize('# Hello **world**!', {
    scope: { timestamp: new Date().toISOString() },
    mdxOptions: { gfm: true },
  });

  return <MDXRemote {...mdxSource} components={{ Button }} />;
}
```

### Direct Server Component Rendering

```tsx
import { MDXServerComponent } from 'bunny-next-wasm/rsc';

export default function Page() {
  return (
    <MDXServerComponent
      source="# Hello **world**!"
      components={{ Button }}
    />
  );
}
```

## API

### `serialize(source, options?)`

Compile MDX to serializable format for client hydration.

### `evaluate(source, options?)`

Compile and evaluate MDX to a React component.

### `MDXRemote`

Client component for hydrating serialized MDX.

### `MDXServerComponent`

Server component for rendering MDX directly.

## License

MIT

