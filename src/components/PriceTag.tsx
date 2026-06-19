interface PriceTagProps {
  value: number;
  suffix?: string;
  className?: string;
  showSign?: boolean;
}

export function PriceTag({ value, suffix = '', className = '', showSign = false }: PriceTagProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? 'text-red-400' : isNegative ? 'text-blue-400' : 'text-gray-400';
  const sign = showSign && isPositive ? '+' : '';

  return (
    <span className={`${color} ${className}`}>
      {sign}{value.toLocaleString()}{suffix}
    </span>
  );
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + '조';
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(0) + '억';
  if (n >= 10_000) return (n / 10_000).toFixed(0) + '만';
  return n.toLocaleString();
}
