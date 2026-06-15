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
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="break-words text-xl font-bold text-gray-900">{displayValue}</p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
