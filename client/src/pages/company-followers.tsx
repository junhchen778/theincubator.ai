import { useEffect, useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Company, User, FollowerWithDetails, VCFirm, IndividualInvestor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation } from '@/components/navigation';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Loader2,
  ArrowLeft,
  Users,
  TrendingUp,
  Building,
  UserCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type FilterType = 'all' | 'individual' | 'firm';
type SortType = 'newest' | 'oldest';

interface FollowerData {
  id: string;
  company_id: string;
  follower_id: string;
  firm_id: string | null;
  created_at: string;
  follower: User;
  firm?: VCFirm | null;
  investor_data?: IndividualInvestor | null;
}

export default function CompanyFollowersPage() {
  const [, params] = useRoute('/company/:id/followers');
  const [, setLocation] = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<FollowerData[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');

  useEffect(() => {
    async function loadData() {
      if (!params?.id) return;

      try {
        // Get current user
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select(`
            *,
            founders:company_founders(user_id)
          `)
          .eq('id', params.id)
          .single();

        if (companyError || !companyData) {
          setLocation('/404');
          return;
        }

        setCompany(companyData as Company);

        // Check if current user is a founder
        if (user && companyData.founders) {
          const isUserFounder = companyData.founders.some(
            (f: any) => f.user_id === user.id
          );
          setIsFounder(isUserFounder);
        }

        // Fetch followers
        await loadFollowers(params.id);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params?.id, setLocation]);

  const loadFollowers = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_follows')
        .select(`
          *,
          follower:users(*),
          firm:vc_firms(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch investor data for each follower
      const followersWithInvestorData = await Promise.all(
        (data || []).map(async (follow: any) => {
          if (follow.follower.user_type === 'individual_investor') {
            const { data: investorData } = await supabase
              .from('individual_investors')
              .select('*')
              .eq('user_id', follow.follower_id)
              .single();
            
            return { ...follow, investor_data: investorData };
          }
          return follow;
        })
      );

      setFollowers(followersWithInvestorData);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const filteredFollowers = followers
    .filter((f) => {
      if (filter === 'all') return true;
      if (filter === 'individual') return f.follower.user_type === 'individual_investor' && !f.firm_id;
      if (filter === 'firm') return f.firm_id !== null;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const stats = {
    total: followers.length,
    individual: followers.filter(f => f.follower.user_type === 'individual_investor' && !f.firm_id).length,
    firms: followers.filter(f => f.firm_id !== null).length,
    recent: followers.filter(f => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(f.created_at).getTime() > weekAgo;
    }).length,
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <EmptyState
            icon={Building2}
            title="Company not found"
            description="The company you're looking for doesn't exist."
            action={{
              label: 'Search Companies',
              onClick: () => setLocation('/search?type=companies'),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/company/${company.id}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company
            </Button>

            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">Followers of {company.name}</h1>
            </div>
            <p className="text-muted-foreground">
              {stats.total} {stats.total === 1 ? 'follower' : 'followers'}
            </p>
          </div>

          {/* Founder Insights */}
          {isFounder && stats.total > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-3">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.individual}</p>
                      <p className="text-sm text-muted-foreground">Individual Investors</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.firms}</p>
                      <p className="text-sm text-muted-foreground">VC Firms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.recent}</p>
                      <p className="text-sm text-muted-foreground">Last 7 Days</p>
                    </div>
                  </div>
                </div>
                {stats.recent > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      🎉 You gained {stats.recent} new {stats.recent === 1 ? 'follower' : 'followers'} this week! 
                      Keep sharing updates to maintain momentum.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filters and Sorting */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filter:</span>
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="individual">Individual</TabsTrigger>
                      <TabsTrigger value="firm">Firms</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort:</span>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Followers List */}
          {filteredFollowers.length > 0 ? (
            <div className="space-y-4">
              {filteredFollowers.map((follow) => (
                <Card key={follow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => setLocation(`/profile/${follow.follower_id}`)}
                      >
                        <AvatarImage src={follow.follower.avatar_url || undefined} />
                        <AvatarFallback>
                          {follow.follower.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/profile/${follow.follower_id}`}>
                            <h3 className="font-semibold hover:underline cursor-pointer">
                              {follow.follower.full_name || 'Unnamed User'}
                            </h3>
                          </Link>
                          {follow.firm_id && follow.firm ? (
                            <Badge variant="secondary">
                              <Building className="h-3 w-3 mr-1" />
                              {follow.firm.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <UserCircle className="h-3 w-3 mr-1" />
                              Individual Investor
                            </Badge>
                          )}
                        </div>

                        {/* Investment Thesis Preview */}
                        {follow.investor_data?.investment_thesis && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {follow.investor_data.investment_thesis.stages?.slice(0, 2).map((stage: string) => (
                              <StageBadge key={stage} stage={stage} />
                            ))}
                            {follow.investor_data.investment_thesis.sectors?.slice(0, 2).map((sector: string) => (
                              <SectorBadge key={sector} sector={sector} />
                            ))}
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground mt-2">
                          Following since {format(new Date(follow.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <Link href={`/profile/${follow.follower_id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Users}
                  title="No followers yet"
                  description={
                    filter === 'all'
                      ? "Keep sharing updates to attract investors!"
                      : `No ${filter === 'individual' ? 'individual investors' : 'VC firms'} following yet.`
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

