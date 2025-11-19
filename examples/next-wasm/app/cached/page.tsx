import { serializeWithCache, mdxCache } from 'bunny-next-wasm';
import { MDXRemote } from 'bunny-next-wasm/client';
import { mdxComponents } from '@/components/mdx';

const mdxContent = `---
title: Cached MDX
---

# Cached MDX Compilation

This content uses \`serializeWithCache()\` for better performance.

<Callout type="info">
Subsequent renders with the same content use the cached version!
</Callout>

<Counter initialCount={20} />

Cache size: {cacheSize}
`;

export default async function CachedPage() {
  const mdxSource = await serializeWithCache(mdxContent, {
    scope: { cacheSize: mdxCache.size },
    mdxOptions: { gfm: true },
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Cached MDX</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Use serializeWithCache() for repeated content</p>
        <p>Compiled successfully! Source length: {mdxSource.compiledSource.length}</p>
      </div>
      {/* <div className="mdx-content">
        <MDXRemote {...mdxSource} components={mdxComponents} />
      </div> */}
    </div>
  );
}
