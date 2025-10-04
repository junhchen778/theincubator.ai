import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { CompanyWithFounders, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { Navigation } from '@/components/navigation';
import {
  Building2,
  Loader2,
  Eye,
  Edit,
  Users,
  Heart,
  FileText,
  PlusCircle,
  UserPlus,
  ExternalLink,
  ArrowRight,
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FounderDashboardPage() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [company, setCompany] = useState<CompanyWithFounders | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, interests: 0, posts: 0 });
  const [recentFollowers, setRecentFollowers] = useState<any[]>([]);
  const [recentInterests, setRecentInterests] = useState<any[]>([]);
  const [recentInterestsTrend, setRecentInterestsTrend] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          setLocation('/auth/sign-in');
          return;
        }

        // Check if user is a founder
        if (user.user_type !== 'founder') {
          setLocation('/feed');
          return;
        }

        setCurrentUser(user);

        // Get founder's company
        const { data: founderData, error: founderError } = await supabase
          .from('company_founders')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (founderError || !founderData) {
          // User is a founder but hasn't created a company yet
          setLoading(false);
          return;
        }

        // Fetch company with founders
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
          .eq('id', founderData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          return;
        }

        setCompany(companyData as CompanyWithFounders);

        // Fetch stats
        const [followersRes, interestsRes] = await Promise.all([
          supabase
            .from('company_follows')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', founderData.company_id),
          supabase
            .from('company_interests')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', founderData.company_id),
        ]);

        // Fetch recent followers with firm data
        const { data: followersData } = await supabase
          .from('company_follows')
          .select(`
            *,
            follower:users(*),
            firm:vc_firms(*)
          `)
          .eq('company_id', founderData.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentFollowers(followersData || []);

        // Get post count
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', founderData.company_id);

        setStats({
          followers: followersRes.count || 0,
          interests: interestsRes.count || 0,
          posts: postCount || 0,
        });

        // Fetch recent interests with firm data
        const { data: interestsData } = await supabase
          .from('company_interests')
          .select(`
            *,
            investor:users(*),
            firm:vc_firms(*)
          `)
          .eq('company_id', founderData.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentInterests(interestsData || []);

        // Calculate recent trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = (interestsData || []).filter(
          (i: any) => new Date(i.created_at) >= sevenDaysAgo
        ).length;
        setRecentInterestsTrend(recentCount);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [setLocation]);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Building2}
                  title="No company profile"
                  description="You haven't created a company profile yet. Complete your onboarding to get started."
                  action={{
                    label: "Complete Onboarding",
                    onClick: () => setLocation('/onboarding/company')
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Company Dashboard</h1>

          {/* Company Overview Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={company.logo_url || undefined} />
                  <AvatarFallback>
                    <Building2 className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{company.name}</h2>
                  <p className="text-muted-foreground mb-4">
                    {company.one_line_pitch || 'No pitch available'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.stage && <StageBadge stage={company.stage} />}
                    {company.sector?.slice(0, 3).map((sector) => (
                      <SectorBadge key={sector} sector={sector} />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/company/${company.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Public Page
                      </Button>
                    </Link>
                    <Link href={`/company/${company.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Company
                      </Button>
                    </Link>
                    <Link href={`/company/${company.id}/founders/manage`}>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Manage Co-Founders
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
                    <p className="text-3xl font-bold">{stats.followers}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <Link href={`/company/${company.id}/followers`}>
                  <Button variant="link" className="mt-4 p-0 h-auto">
                    View All
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Interests</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{stats.interests}</p>
                      {recentInterestsTrend > 0 && (
                        <Badge variant="secondary" className="text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{recentInterestsTrend}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500 fill-current" />
                </div>
                <Link href={`/company/${company.id}/interests`}>
                  <Button variant="link" className="mt-4 p-0 h-auto">
                    View All
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Posts</p>
                    <p className="text-3xl font-bold">{stats.posts}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <Link href="/feed">
                  <Button variant="link" className="mt-4 p-0 h-auto">
                    View Posts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="followers">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="followers">Recent Followers</TabsTrigger>
                  <TabsTrigger value="interests">Recent Interests</TabsTrigger>
                </TabsList>

                <TabsContent value="followers" className="mt-6">
                  {recentFollowers.length > 0 ? (
                    <div className="space-y-4">
                      {recentFollowers.map((follow) => (
                        <div key={follow.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={follow.follower?.avatar_url || undefined} />
                            <AvatarFallback>
                              {follow.follower?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {follow.follower?.full_name || 'Unnamed User'}
                              </p>
                              {follow.firm_id && follow.firm && (
                                <Badge variant="secondary" className="text-xs">
                                  {follow.firm.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(follow.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Link href={`/profile/${follow.follower_id}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No followers yet"
                      description="Share your progress to attract investors!"
                    />
                  )}
                </TabsContent>

                <TabsContent value="interests" className="mt-6">
                  {recentInterests.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {recentInterests.map((interest) => (
                          <div key={interest.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Avatar>
                              <AvatarImage 
                                src={interest.firm_id ? interest.firm?.logo_url : interest.investor?.avatar_url || undefined} 
                              />
                              <AvatarFallback>
                                {interest.investor?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {interest.firm_id ? interest.firm?.name : interest.investor?.full_name || 'Unnamed User'}
                                </p>
                                {interest.firm_id && (
                                  <Badge variant="default" className="text-xs">Firm</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Interested {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
                              </p>
                              {interest.message && (
                                <p className="text-sm mt-1 text-muted-foreground line-clamp-1">
                                  "{interest.message.slice(0, 50)}{interest.message.length > 50 ? '...' : ''}"
                                </p>
                              )}
                            </div>
                            <Link href={`/company/${company.id}/interests`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                      <Link href={`/company/${company.id}/interests`}>
                        <Button variant="link" className="mt-4 w-full">
                          View All {stats.interests} Interests
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <EmptyState
                      icon={Star}
                      title="No interests yet"
                      description="Keep building and sharing your progress to attract investors!"
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button disabled>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Post
              </Button>
              <Link href={`/company/${company.id}/founders/manage`}>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Co-Founders
                </Button>
              </Link>
              <Link href={`/company/${company.id}`}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Company Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

