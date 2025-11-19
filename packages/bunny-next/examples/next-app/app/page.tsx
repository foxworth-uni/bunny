import Link from 'next/link';

/**
 * Home page - Overview of all bunny-next examples
 *
 * This is a Server Component (default in App Router)
 */
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Bunny Next.js Examples</h1>
      <p style={{ fontSize: '1.125rem', margin: '1rem 0', color: '#666' }}>
        A comprehensive demonstration of{' '}
        <code style={{ color: '#0070f3' }}>bunny-next</code>, the fast MDX
        integration for Next.js powered by Rust.
      </p>

      <section style={{ marginTop: '3rem' }}>
        <h2>Features</h2>
        <ul>
          <li>Blazing fast MDX compilation powered by Rust</li>
          <li>Full Next.js 16 support with Turbopack</li>
          <li>Server Components and Client Components</li>
          <li>Built-in caching for optimal performance</li>
          <li>GFM, footnotes, and math support</li>
        </ul>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Examples</h2>
        <div
          style={{
            display: 'grid',
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            marginTop: '1.5rem',
          }}
        >
          <ExampleCard
            href="/local"
            title="Local Import"
            description="Import .mdx files directly in your components. Build-time compilation with full type safety."
          />
          <ExampleCard
            href="/remote"
            title="Remote MDX"
            description="Use serialize() and <MDXRemote /> for runtime content from CMS, APIs, or databases."
          />
          <ExampleCard
            href="/server"
            title="Server Component"
            description="Pure Server Component rendering with <MDXServerComponent /> or evaluateRSC()."
          />
          <ExampleCard
            href="/cached"
            title="Cached Remote"
            description="Use serializeWithCache() for automatic caching and optimal performance."
          />
          <ExampleCard
            href="/blog"
            title="Dynamic Routes"
            description="Blog post system with dynamic routes, frontmatter, and static generation."
          />
        </div>
      </section>

      <section style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
        <h2>Quick Start</h2>
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto' }}>
          {`# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build`}
        </pre>
      </section>
    </div>
  );
}

function ExampleCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '1.5rem',
        border: '1px solid #ddd',
        borderRadius: '0.5rem',
        background: 'white',
        transition: 'all 0.2s',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#0070f3' }}>{title}</h3>
      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
        {description}
      </p>
    </Link>
  );
}
