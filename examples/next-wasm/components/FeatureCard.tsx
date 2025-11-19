import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export function FeatureCard({ title, description, href, icon }: FeatureCardProps) {
  return (
    <Link href={href} style={{ display: 'block', padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s', textDecoration: 'none' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem', color: '#111' }}>{title}</h3>
      <p style={{ color: '#666', fontSize: '0.95rem' }}>{description}</p>
    </Link>
  );
}
