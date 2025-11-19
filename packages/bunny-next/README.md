# bunny-next

Fast Next.js MDX integration powered by Rust. 10x faster compilation than JavaScript-based alternatives.

## Features

- **Blazing Fast**: Rust-based MDX compiler for 10x faster builds
- **Dual Mode**: Support for both local (build-time) and remote (runtime) MDX
- **Router Agnostic**: Works with Pages Router and App Router
- **Server Components**: First-class React Server Components support
- **Type Safe**: Full TypeScript support with generics
- **Smart Caching**: Built-in SHA-256 based compilation cache
- **Webpack + Turbopack**: Support for both bundlers

## Installation

```bash
npm install bunny-next bunny-mdx-runtime bunny-mdx-node
```

## Quick Start

### Remote MDX (from CMS, API, Database)

```tsx
// app/blog/[slug]/page.tsx
import { serialize } from 'bunny-next';
import { MDXRemote } from 'bunny-next';

export default async function BlogPost({ params }) {
  const post = await fetchPostFromCMS(params.slug);
  const mdxSource = await serialize(post.content);

  return (
    <article>
      <h1>{post.title}</h1>
      <MDXRemote {...mdxSource} />
    </article>
  );
}
```

### Local MDX Files

```ts
// next.config.ts
import { withMDX } from 'bunny-next/config';

export default withMDX({
  mdxOptions: {
    gfm: true,
    math: true,
  },
})({
  // ...other Next.js config
});
```

```tsx
// app/page.tsx
import Content from './content.mdx';

export default function Page() {
  return <Content />;
}
```

## API Reference

### `serialize(source, options)`

Compile remote MDX content into a serializable format.

```tsx
import { serialize } from 'bunny-next';

const mdxSource = await serialize(content, {
  scope: { count: 42 },
  mdxOptions: {
    gfm: true,
    footnotes: true,
    math: false,
  },
  parseFrontmatter: true,
});
```

**Options:**
- `scope?: Record<string, unknown>` - Variables to pass to MDX
- `mdxOptions?: CompileOptions` - Compilation options
- `parseFrontmatter?: boolean` - Parse YAML frontmatter (default: true)

**Returns:** `SerializeResult<TScope, TFrontmatter>`

### `MDXRemote`

Client component to hydrate serialized MDX.

```tsx
import { MDXRemote } from 'bunny-next';

<MDXRemote
  compiledSource={mdxSource.compiledSource}
  components={{ Button, Card }}
  scope={mdxSource.scope}
  lazy={false}
/>
```

**Props:**
- `compiledSource: string` - Output from serialize()
- `components?: MDXComponents` - Component overrides
- `scope?: Record<string, unknown>` - Variables
- `lazy?: boolean` - Lazy load with Suspense

### `evaluate(source, options)`

Server-side MDX evaluation. Returns a React component immediately.

```tsx
import { evaluate } from 'bunny-next';

const { default: Content } = await evaluate(source, {
  scope: { name: 'World' },
  components: { Button },
});

return <Content />;
```

### React Server Components

```tsx
import { MDXServerComponent } from 'bunny-next/rsc';

export default async function Page() {
  const content = await fetchContent();

  return (
    <MDXServerComponent
      source={content}
      components={{ Button }}
    />
  );
}
```

Or use `evaluateRSC` for more control:

```tsx
import { evaluateRSC } from 'bunny-next/rsc';

const Content = await evaluateRSC(source, {
  scope: { version: '2.0' }
});

return <Content />;
```

### Caching

Use `serializeWithCache` for automatic caching:

```tsx
import { serializeWithCache, configureMDXCache } from 'bunny-next';

// Configure cache (optional)
configureMDXCache({
  maxSize: 1000,
  ttl: 1000 * 60 * 30, // 30 minutes
});

// Use cached serialization
const mdxSource = await serializeWithCache(content);
```

## Configuration

### With Pages Router

```tsx
// pages/blog/[slug].tsx
import { serialize } from 'bunny-next';
import { MDXRemote } from 'bunny-next';

export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);
  const mdxSource = await serialize(post.content);

  return {
    props: { mdxSource, frontmatter: mdxSource.frontmatter }
  };
}

export default function BlogPost({ mdxSource }) {
  return <MDXRemote {...mdxSource} />;
}
```

### With App Router

```tsx
// app/blog/[slug]/page.tsx
import { serialize } from 'bunny-next';
import { MDXRemote } from 'bunny-next';

export default async function Page({ params }) {
  const post = await fetchPost(params.slug);
  const mdxSource = await serialize(post.content);

  return <MDXRemote {...mdxSource} />;
}
```

### Custom Components

```tsx
const components = {
  h1: ({ children }) => <h1 className="text-4xl">{children}</h1>,
  Button: ({ children }) => <button className="btn">{children}</button>,
};

<MDXRemote {...mdxSource} components={components} />
```

## TypeScript

Full type safety with generics:

```tsx
interface Frontmatter {
  title: string;
  date: string;
  tags: string[];
}

interface Scope {
  count: number;
  name: string;
}

const mdxSource = await serialize<Scope, Frontmatter>(content, {
  scope: { count: 42, name: 'John' }
});

// mdxSource.frontmatter is typed as Frontmatter
// mdxSource.scope is typed as Scope
```

## Performance

Bunny Next leverages a Rust-based MDX compiler for exceptional performance:

- **10x faster** compilation vs `@mdx-js/mdx`
- **Built-in caching** reduces repeated compilations
- **Small bundle size** (<10KB gzipped)
- **Zero runtime overhead** for local MDX files

## Migration

### From `next-mdx-remote`

Bunny Next is a drop-in replacement:

```diff
-import { serialize } from 'next-mdx-remote/serialize';
-import { MDXRemote } from 'next-mdx-remote';
+import { serialize } from 'bunny-next';
+import { MDXRemote } from 'bunny-next';
```

### From `@next/mdx`

```diff
-import withMDX from '@next/mdx';
+import { withMDX } from 'bunny-next/config';

-export default withMDX()(nextConfig);
+export default withMDX({
+  mdxOptions: { gfm: true }
+})(nextConfig);
```

## License

MIT
