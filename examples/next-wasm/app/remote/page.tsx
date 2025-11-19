import { serialize } from 'bunny-next-wasm';
import { MDXRemote } from 'bunny-next-wasm/client';
import { mdxComponents } from '@/components/mdx';

const mdxContent = `---
title: Remote MDX Content
---

# Content from Remote Source

This MDX comes from a **remote source** like a CMS or API.

<Callout type="success">
Perfect for content that changes frequently!
</Callout>

<Counter initialCount={10} />

<Button variant="secondary">Remote Button</Button>
`;

export default async function RemotePage() {
  const mdxSource = await serialize(mdxContent, {
    scope: { timestamp: new Date().toISOString() },
    mdxOptions: { gfm: true },
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Remote MDX Content</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Render MDX from CMS, API, or database</p>
      </div>
      <div className="mdx-content">
        <MDXRemote {...mdxSource} components={mdxComponents} />
      </div>
    </div>
  );
}
