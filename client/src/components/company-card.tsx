import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompanyWithFounders } from '@/lib/types';
import { Link } from 'wouter';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { FounderList } from '@/components/founder-list';
import { Building2 } from 'lucide-react';

interface CompanyCardProps {
  company: CompanyWithFounders;
  variant?: 'full' | 'compact';
}

export function CompanyCard({ company, variant = 'compact' }: CompanyCardProps) {
  const topSectors = company.sector?.slice(0, 2) || [];
  const remainingSectors = (company.sector?.length || 0) - 2;

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

