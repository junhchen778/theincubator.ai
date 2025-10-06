import { useEffect, useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InterestWithDetails, CompanyWithFounders, InterestStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation } from '@/components/navigation';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { 
  ArrowLeft,
  Building2, 
  Loader2, 
  Star,
  User as UserIcon,
  Building,
  BadgeCheck,
  Mail,
  Download,
  Filter,
  TrendingUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';

export default function CompanyInterestsPage() {
  const [, params] = useRoute('/company/:id/interests');
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [company, setCompany] = useState<CompanyWithFounders | null>(null);
  const [interests, setInterests] = useState<InterestWithDetails[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<InterestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [stats, setStats] = useState<InterestStats>({
    total_count: 0,
    individual_count: 0,
    firm_count: 0,
    with_message_count: 0,
    recent_trend: 0,
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    async function loadData() {
      if (!params?.id || !currentUser) return;

      try {

        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select(`
            *,
            founders:company_founders(
              id,
              user_id,
              title,
              is_primary,
              user:users(*)
            )
          `)
          .eq('id', params.id)
          .single();

        if (companyError || !companyData) {
          setLocation('/404');
          return;
        }

        setCompany(companyData as CompanyWithFounders);

        // Check if current user is a founder
        if (user && companyData.founders) {
          const isUserFounder = companyData.founders.some(
            (f: any) => f.user_id === user.id
          );
          setIsFounder(isUserFounder);

          if (!isUserFounder) {
            setLocation(`/company/${params.id}`);
            return;
          }
        } else {
          setLocation(`/company/${params.id}`);
          return;
        }

        // Fetch interests with all related data
        const { data: interestsData, error: interestsError } = await supabase
          .from('company_interests')
          .select(`
            *,
            investor:users(*),
            firm:vc_firms(*)
          `)
          .eq('company_id', params.id)
          .order('created_at', { ascending: false });

        if (interestsError) throw interestsError;

        // For each interest, fetch additional investor data
        const enrichedInterests = await Promise.all(
          (interestsData || []).map(async (interest: any) => {
            // Get individual investor data if personal
            if (!interest.firm_id) {
              const { data: investorData } = await supabase
                .from('individual_investors')
                .select('*')
                .eq('user_id', interest.investor_id)
                .single();
              
              return { ...interest, investor_data: investorData };
            }
            
            // Get firm member data if as firm
            const { data: firmMemberData } = await supabase
              .from('firm_members')
              .select('*')
              .eq('user_id', interest.investor_id)
              .single();
            
            return { ...interest, firm_member_data: firmMemberData };
          })
        );

        setInterests(enrichedInterests as InterestWithDetails[]);
        setFilteredInterests(enrichedInterests as InterestWithDetails[]);

        // Calculate stats
        const totalCount = enrichedInterests.length;
        const individualCount = enrichedInterests.filter((i: any) => !i.firm_id).length;
        const firmCount = enrichedInterests.filter((i: any) => i.firm_id).length;
        const withMessageCount = enrichedInterests.filter((i: any) => i.message).length;
        
        // Recent trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = enrichedInterests.filter(
          (i: any) => new Date(i.created_at) >= sevenDaysAgo
        ).length;

        setStats({
          total_count: totalCount,
          individual_count: individualCount,
          firm_count: firmCount,
          with_message_count: withMessageCount,
          recent_trend: recentCount,
        });
      } catch (error) {
        console.error('Error loading interests:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params?.id, currentUser, setLocation]);

  useEffect(() => {
    let filtered = [...interests];

    // Apply filter
    if (filterType === 'individual') {
      filtered = filtered.filter(i => !i.firm_id);
    } else if (filterType === 'firm') {
      filtered = filtered.filter(i => i.firm_id);
    }

    // Apply sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'with_message') {
      filtered.sort((a, b) => {
        if (a.message && !b.message) return -1;
        if (!a.message && b.message) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    setFilteredInterests(filtered);
  }, [interests, filterType, sortBy]);

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

  if (!company || !isFounder) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link to={`/company/${company.id}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Company
              </Button>
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Investors Interested in {company.name}
                </h1>
                <p className="text-muted-foreground">
                  {stats.total_count} {stats.total_count === 1 ? 'investor has' : 'investors have'} expressed interest
                </p>
              </div>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.total_count}</p>
                  <p className="text-sm text-muted-foreground">Total Interests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.individual_count}</p>
                  <p className="text-sm text-muted-foreground">Individual Investors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.firm_count}</p>
                  <p className="text-sm text-muted-foreground">VC Firms</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{stats.recent_trend}</p>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Sort */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Interests</SelectItem>
                      <SelectItem value="individual">Individual Investors</SelectItem>
                      <SelectItem value="firm">VC Firms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="with_message">With Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests List */}
          {filteredInterests.length > 0 ? (
            <div className="space-y-4">
              {filteredInterests.map((interest) => (
                <Card key={interest.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Avatar/Logo */}
                      <Avatar className="h-16 w-16">
                        <AvatarImage 
                          src={interest.firm_id ? interest.firm?.logo_url || undefined : interest.investor.avatar_url || undefined} 
                        />
                        <AvatarFallback>
                          {interest.firm_id ? (
                            <Building className="h-8 w-8" />
                          ) : (
                            interest.investor.full_name?.split(' ').map(n => n[0]).join('') || 'U'
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Link 
                                to={interest.firm_id ? `/firm/${interest.firm?.id}` : `/profile/${interest.investor.id}`}
                              >
                                <h3 className="font-semibold text-lg hover:underline cursor-pointer">
                                  {interest.firm_id ? interest.firm?.name : interest.investor.full_name}
                                </h3>
                              </Link>
                              {interest.investor.verified && (
                                <BadgeCheck className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={interest.firm_id ? "default" : "secondary"}>
                                {interest.firm_id ? (
                                  <><Building className="h-3 w-3 mr-1" /> {interest.firm?.name}</>
                                ) : (
                                  <><UserIcon className="h-3 w-3 mr-1" /> Individual Investor</>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Investment Thesis Preview (for individuals) */}
                        {!interest.firm_id && interest.investor_data?.investment_thesis && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {interest.investor_data.investment_thesis.stages?.slice(0, 2).map((stage: string) => (
                              <StageBadge key={stage} stage={stage} />
                            ))}
                            {interest.investor_data.investment_thesis.sectors?.slice(0, 2).map((sector: string) => (
                              <SectorBadge key={sector} sector={sector} />
                            ))}
                            {interest.investor_data.investment_thesis.check_size && (
                              <Badge variant="outline">
                                {interest.investor_data.investment_thesis.check_size}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Message */}
                        {interest.message && (
                          <div className="mb-3 p-3 bg-muted rounded-lg border-l-4 border-primary">
                            <p className="text-sm font-medium mb-1">
                              Message from {interest.firm_id ? interest.firm?.name : interest.investor.full_name}:
                            </p>
                            <p className="text-sm">{interest.message}</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Expressed interest {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                          </p>
                          <div className="flex gap-2">
                            <Link to={interest.firm_id ? `/firm/${interest.firm?.id}` : `/profile/${interest.investor.id}`}>
                              <Button variant="outline" size="sm">
                                View Profile
                              </Button>
                            </Link>
                            <Button variant="default" size="sm" asChild>
                              <a href={`mailto:${interest.investor.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Contact
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Star}
                  title="No investors have expressed interest yet"
                  description="Keep sharing updates to attract investors!"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

