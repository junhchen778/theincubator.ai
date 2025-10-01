import { Badge } from '@/components/ui/badge';
import type { Stage } from '@/lib/types';
import { STAGE_DISPLAY_NAMES } from '@/lib/types';

interface StageBadgeProps {
  stage: Stage | string;
  className?: string;
}

const stageColors: Record<string, string> = {
  'pre-seed': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'seed': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  'series-a': 'bg-green-100 text-green-800 hover:bg-green-100',
  'series-b': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  'series-c+': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
};

export function StageBadge({ stage, className }: StageBadgeProps) {
  const colorClass = stageColors[stage] || 'bg-slate-100 text-slate-800';
  const displayName = STAGE_DISPLAY_NAMES[stage] || stage;
  
  return (
    <Badge variant="secondary" className={`${colorClass} ${className || ''}`}>
      {displayName}
    </Badge>
  );
}

