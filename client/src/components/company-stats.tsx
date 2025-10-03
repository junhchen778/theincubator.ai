import { Users, Heart, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CompanyStatsProps {
  followers: number;
  interests: number;
  posts: number;
}

export function CompanyStats({ followers, interests, posts }: CompanyStatsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-around divide-x">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Heart className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{interests}</p>
              <p className="text-xs text-muted-foreground">Interests</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

