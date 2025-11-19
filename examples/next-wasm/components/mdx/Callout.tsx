import { type ReactNode } from 'react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  children: ReactNode;
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const colors = {
    info: { bg: '#e7f3ff', border: '#0070f3', icon: 'ℹ️' },
    warning: { bg: '#fff8e7', border: '#f59e0b', icon: '⚠️' },
    success: { bg: '#e7ffe7', border: '#10b981', icon: '✅' },
    error: { bg: '#ffe7e7', border: '#ef4444', icon: '❌' },
  };

  const { bg, border, icon } = colors[type];

  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: '8px', padding: '1rem', margin: '1rem 0', display: 'flex', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
