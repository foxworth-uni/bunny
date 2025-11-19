import Link from 'next/link';
import { FeatureCard } from '@/components/FeatureCard';

export default function HomePage() {
  const features = [
    { title: 'Remote MDX', description: 'serialize() + <MDXRemote /> for CMS/API content', href: '/remote', icon: '🌐' },
    { title: 'Server Components', description: '<MDXServerComponent /> for zero client JS', href: '/server', icon: '⚡' },
    { title: 'Cached MDX', description: 'serializeWithCache() with LRU caching', href: '/cached', icon: '💾' },
    { title: 'Dynamic Blog', description: 'File-based blog with frontmatter and routing', href: '/blog', icon: '📝' },
  ];

  return (
    <div>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐰 bunny-next</h1>
        <p style={{ fontSize: '1.25rem', color: '#666' }}>Fast Next.js MDX integration powered by Rust</p>
        <p style={{ marginTop: '1rem' }}>Next.js 16 + React 19 + Turbopack</p>
      </header>

      <section>
        <h2 style={{ marginBottom: '1.5rem' }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {features.map((feature) => (<FeatureCard key={feature.href} {...feature} />))}
        </div>
      </section>
    </div>
  );
}
