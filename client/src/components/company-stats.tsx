import { Users, Heart, FileText, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

interface CompanyStatsProps {
  followers: number;
  interests: number;
  posts: number;
  companyId?: string;
  isFounder?: boolean;
}

export function CompanyStats({ followers, interests, posts, companyId, isFounder }: CompanyStatsProps) {
  const StarIcon = interests > 0 ? Star : Star;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-around divide-x">
          {/* Followers */}
          {companyId && followers > 0 ? (
            <Link href={`/company/${companyId}/followers`} className="flex items-center gap-2 flex-1 justify-center hover:bg-muted/50 rounded-lg py-2 transition-colors">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
            </div>
          )}
          
          {/* Interests */}
          {companyId && isFounder ? (
            <Link href={`/company/${companyId}/interests`} className="flex items-center gap-2 flex-1 justify-center hover:bg-muted/50 rounded-lg py-2 transition-colors">
              <StarIcon className={`h-5 w-5 ${interests > 0 ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{interests}</p>
                <p className="text-xs text-muted-foreground">Interests</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 flex-1 justify-center">
              <StarIcon className={`h-5 w-5 ${interests > 0 ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{interests}</p>
                <p className="text-xs text-muted-foreground">Interests</p>
              </div>
            </div>
          )}
          
          {/* Posts */}
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
