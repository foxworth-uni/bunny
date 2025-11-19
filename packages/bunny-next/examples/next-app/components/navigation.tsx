import Link from 'next/link';

const examples = [
  { href: '/', label: 'Home' },
  { href: '/local', label: 'Local Import' },
  { href: '/remote', label: 'Remote MDX' },
  { href: '/server', label: 'Server Component' },
  { href: '/cached', label: 'Cached Remote' },
  { href: '/blog', label: 'Blog (Dynamic)' },
];

export function Navigation() {
  return (
    <nav
      style={{
        borderBottom: '1px solid #ddd',
        padding: '1rem',
        marginBottom: '2rem',
        background: 'white',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
          Bunny Next.js Examples
        </h1>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {examples.map((example) => (
            <li key={example.href}>
              <Link
                href={example.href}
                style={{
                  fontWeight: 500,
                  color: '#0070f3',
                }}
              >
                {example.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
