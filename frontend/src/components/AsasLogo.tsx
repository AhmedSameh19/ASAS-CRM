'use client';

import React from 'react';

interface AsasLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AsasLogo({ className = '', size = 'md' }: AsasLogoProps) {
  // Brand dimensions maintaining high-quality aspect ratios
  const dimensions = {
    sm: { width: 100, height: 25 },
    md: { width: 140, height: 35 },
    lg: { width: 180, height: 45 },
    xl: { width: 220, height: 55 },
  };

  const { width, height } = dimensions[size];

  return (
    <img
      src="/logo.png"
      alt="ASAS Logo"
      className={`object-contain select-none transition-transform duration-300 ${className}`}
      style={{ width, height }}
    />
  );
}
