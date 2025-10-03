import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { Link } from 'wouter';

interface FounderData {
  id: string;
  user_id: string;
  title: string | null;
  is_primary: boolean | null;
  user: User;
}

interface FounderListProps {
  founders: FounderData[];
  maxDisplay?: number;
}

export function FounderList({ founders, maxDisplay }: FounderListProps) {
  const displayFounders = maxDisplay ? founders.slice(0, maxDisplay) : founders;
  const remainingCount = maxDisplay && founders.length > maxDisplay ? founders.length - maxDisplay : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayFounders.map((founder) => (
          <Link key={founder.id} href={`/profile/${founder.user_id}`}>
            <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110 cursor-pointer">
              <AvatarImage src={founder.user.avatar_url || undefined} />
              <AvatarFallback>
                {founder.user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        ))}
      </div>
      {remainingCount > 0 && (
        <span className="text-sm text-muted-foreground">+{remainingCount} more</span>
      )}
    </div>
  );
}

