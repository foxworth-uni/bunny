'use client';

import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

export function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', margin: '1rem 0' }}>
      <button onClick={() => setCount(count - 1)} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', border: 'none', background: '#0070f3', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>-</button>
      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '3rem', textAlign: 'center' }}>{count}</span>
      <button onClick={() => setCount(count + 1)} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem', border: 'none', background: '#0070f3', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>+</button>
    </div>
  );
}
