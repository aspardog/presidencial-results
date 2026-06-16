'use client';

import { formatNumber } from '@/lib/formatters';

interface CardResumenProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: React.ReactNode;
}

export default function CardResumen({ label, value, subtext, icon }: CardResumenProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className="gb-card gb-stat">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-gb-teal-100 rounded-gb-md text-gb-teal-700">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="gb-eyebrow">
            {label}
          </p>
          <p className="n break-words">{displayValue}</p>
          {subtext && <p className="l">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
