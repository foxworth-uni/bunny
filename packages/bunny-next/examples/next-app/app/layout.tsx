import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bunny Next.js Examples',
  description: 'Comprehensive examples of bunny-next MDX integration',
};

/**
 * Root layout for the Next.js 16 app
 *
 * Features:
 * - Uses App Router (Next.js 13+)
 * - Server Component by default
 * - Includes global navigation and styles
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
