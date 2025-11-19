import { defineConfig } from 'tsup';

export default defineConfig([
  // Server-only entry (default export)
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react/jsx-runtime',
      'next',
      '@bunny/mdx-wasm',
      '@bunny/mdx-runtime',
    ],
    // NO 'use client' banner for server code
  },

  // Client-only entry
  {
    entry: {
      client: 'src/client.tsx',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false, // Don't clean, we're adding to the dist folder
    external: [
      'react',
      'react/jsx-runtime',
      'next',
      '@bunny/mdx-wasm',
      '@bunny/mdx-runtime',
    ],
    banner: {
      js: "'use client';", // Add 'use client' directive to client.js
    },
  },

  // Server Component entry
  {
    entry: {
      rsc: 'src/rsc.tsx',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    external: [
      'react',
      'react/jsx-runtime',
      'next',
      '@bunny/mdx-wasm',
      '@bunny/mdx-runtime',
    ],
    // NO 'use client' banner for RSC
  },
]);

