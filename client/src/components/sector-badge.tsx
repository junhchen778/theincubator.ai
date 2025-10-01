import { Badge } from '@/components/ui/badge';
import type { Sector } from '@/lib/types';

interface SectorBadgeProps {
  sector: Sector | string;
  className?: string;
}

const sectorColors: Record<string, string> = {
  'AI/ML': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  'Fintech': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  'Healthcare': 'bg-red-100 text-red-800 hover:bg-red-100',
  'Climate': 'bg-green-100 text-green-800 hover:bg-green-100',
  'SaaS': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  'Hardware': 'bg-slate-100 text-slate-800 hover:bg-slate-100',
  'Consumer': 'bg-pink-100 text-pink-800 hover:bg-pink-100',
  'Enterprise': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'Other': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

export function SectorBadge({ sector, className }: SectorBadgeProps) {
  const colorClass = sectorColors[sector] || 'bg-slate-100 text-slate-800';
  
  return (
    <Badge variant="secondary" className={`${colorClass} ${className || ''}`}>
      {sector}
    </Badge>
  );
}


