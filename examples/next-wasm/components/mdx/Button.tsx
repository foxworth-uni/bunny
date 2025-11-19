'use client';

import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const variantStyle = variant === 'primary'
    ? { background: '#0070f3', color: 'white' }
    : { background: '#f5f5f5', color: '#333' };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      alert(`Button clicked: ${children}`);
    }
  };

  return (
    <button style={{ ...baseStyle, ...variantStyle }} onClick={handleClick}>
      {children}
    </button>
  );
}
