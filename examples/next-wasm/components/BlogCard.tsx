import Link from 'next/link';

interface BlogCardProps {
  slug: string;
  frontmatter: {
    title: string;
    description?: string;
    date: string;
    author: string;
    tags?: string[];
  };
}

export function BlogCard({ slug, frontmatter }: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} style={{ display: 'block', padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s', textDecoration: 'none' }}>
      <h2 style={{ marginBottom: '0.5rem', color: '#111' }}>{frontmatter.title}</h2>
      {frontmatter.description && <p style={{ color: '#666', marginBottom: '1rem' }}>{frontmatter.description}</p>}
      <div style={{ fontSize: '0.9rem', color: '#999' }}>
        {frontmatter.date} · {frontmatter.author}
      </div>
    </Link>
  );
}
