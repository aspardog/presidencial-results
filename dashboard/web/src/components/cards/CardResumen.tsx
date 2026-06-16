'use client';

import { formatNumber } from '@/lib/formatters';

interface CardResumenProps {
  label: string;
  value: number | string;
}

export default function CardResumen({ label, value }: CardResumenProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className="gb-card gb-stat">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="gb-eyebrow">
            {label}
          </p>
          <p className="n break-words">{displayValue}</p>
        </div>
      </div>
    </div>
  );
}
