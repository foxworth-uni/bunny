import Link from 'next/link';

export function Navigation() {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/remote', label: 'Remote' },
    { href: '/server', label: 'Server' },
    { href: '/cached', label: 'Cached' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid #eee', padding: '1rem 0', marginBottom: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>🐰 bunny-next</Link>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: '#666', transition: 'color 0.2s' }}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
