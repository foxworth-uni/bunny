import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import './global.css';

export const metadata: Metadata = {
  title: 'bunny-next Example',
  description: 'Next.js 16 + React 19 example demonstrating bunny-next features',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="container">{children}</main>
        <footer className="footer">
          <p>Built with bunny-next - Fast MDX for Next.js powered by Rust</p>
        </footer>
      </body>
    </html>
  );
}
