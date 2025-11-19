import { MDXServerComponent } from 'bunny-next-wasm/rsc';
import { mdxComponents } from '@/components/mdx';

const mdxContent = `---
title: Server Component Example
---

# MDX Server Component

Rendered **entirely on the server** with zero client JS!

<Callout type="warning">
Zero JavaScript sent to the client for MDX rendering!
</Callout>

<Button variant="primary">Server-Rendered Button</Button>
`;

export default async function ServerPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Server Component MDX</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Pure server-side rendering with zero client-side JavaScript!</p>
      </div>
      <div className="mdx-content">
        <MDXServerComponent source={mdxContent} components={mdxComponents} mdxOptions={{ gfm: true }} />
      </div>
    </div>
  );
}
