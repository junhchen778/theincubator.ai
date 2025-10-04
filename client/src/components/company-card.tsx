import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompanyWithFounders } from '@/lib/types';
import { Link } from 'wouter';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { FounderList } from '@/components/founder-list';
import { Building2, Users, FileText, Star } from 'lucide-react';

interface CompanyCardProps {
  company: CompanyWithFounders;
  variant?: 'full' | 'compact';
  currentUserId?: string;
}

export function CompanyCard({ company, variant = 'compact', currentUserId }: CompanyCardProps) {
  const topSectors = company.sector?.slice(0, 2) || [];
  const remainingSectors = (company.sector?.length || 0) - 2;
  
  // Check if current user is a founder of this company
  const isFounder = currentUserId && company.founders?.some((f: any) => f.user_id === currentUserId);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 hover:-translate-y-1">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={company.logo_url || undefined} />
            <AvatarFallback>
              <Building2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link href={`/company/${company.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer truncate">
                {company.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {company.one_line_pitch || 'No pitch available'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {company.stage && <StageBadge stage={company.stage} />}
          {topSectors.map((sector) => (
            <SectorBadge key={sector} sector={sector} />
          ))}
          {remainingSectors > 0 && (
            <Badge variant="outline" className="text-xs">
              +{remainingSectors} more
            </Badge>
          )}
        </div>

        {/* Engagement Stats */}
        {(company.follower_count || company.post_count || (isFounder && company.interest_count)) && (
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            {company.follower_count !== undefined && company.follower_count > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{company.follower_count} {company.follower_count === 1 ? 'follower' : 'followers'}</span>
              </div>
            )}
            {isFounder && company.interest_count !== undefined && company.interest_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{company.interest_count} interested</span>
              </div>
            )}
            {company.post_count !== undefined && company.post_count > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{company.post_count} {company.post_count === 1 ? 'post' : 'posts'}</span>
              </div>
            )}
          </div>
        )}

        {company.founders && company.founders.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <span className="text-xs text-muted-foreground">Team:</span>
            <FounderList founders={company.founders} maxDisplay={3} />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link href={`/company/${company.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Company
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
