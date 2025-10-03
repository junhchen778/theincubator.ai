import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { PostCard } from '@/components/post-card';
import { EmptyState } from '@/components/empty-state';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Loader2, ExternalLink, Edit, Users, FileText } from 'lucide-react';
import type { User, Company, InvestmentThesis, VCFirm, PostWithDetails } from '@/lib/types';

interface ProfileData {
  user: User;
  company?: Company;
  investmentThesis?: InvestmentThesis;
  firm?: VCFirm;
  firmMembers?: Array<{
    user: User;
    title: string | null;
  }>;
  isOwn: boolean;
  isAdmin: boolean;
}

export default function ProfilePage() {
  const [match, params] = useRoute('/profile/:id');
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (match && params?.id) {
      loadProfile(params.id);
    }
  }, [match, params?.id]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const loggedInUser = await getCurrentUser();
      setCurrentUser(loggedInUser);

      // Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const isOwn = loggedInUser?.id === userId;
      let company: Company | undefined;
      let investmentThesis: InvestmentThesis | undefined;
      let firm: VCFirm | undefined;
      let firmMembers: ProfileData['firmMembers'] = [];
      let isAdmin = false;

      // Load data based on user type
      if (user.user_type === 'founder') {
        // Get company
        const { data: founderData } = await supabase
          .from('company_founders')
          .select('company_id, companies(*)')
          .eq('user_id', userId)
          .single();

        if (founderData && founderData.companies) {
          company = founderData.companies as any;
        }
      } else if (user.user_type === 'individual_investor') {
        // Get investment thesis
        const { data: investorData } = await supabase
          .from('individual_investors')
          .select('investment_thesis')
          .eq('user_id', userId)
          .single();

        if (investorData?.investment_thesis) {
          investmentThesis = investorData.investment_thesis as InvestmentThesis;
        }
      } else if (user.user_type === 'firm_member') {
        // Get firm and members
        const { data: memberData } = await supabase
          .from('firm_members')
          .select('firm_id, role, vc_firms(*)')
          .eq('user_id', userId)
          .single();

        if (memberData && memberData.vc_firms) {
          firm = memberData.vc_firms as any;
          isAdmin = memberData.role === 'admin';

          // Get all firm members
          const { data: members } = await supabase
            .from('firm_members')
            .select('user_id, title, users(*)')
            .eq('firm_id', memberData.firm_id);

          if (members) {
            firmMembers = members.map((m: any) => ({
              user: m.users,
              title: m.title,
            }));
          }

          // Get investment thesis
          if (firm?.investment_thesis) {
            investmentThesis = firm.investment_thesis as InvestmentThesis;
          }
        }
      }

      setProfileData({
        user,
        company,
        investmentThesis,
        firm,
        firmMembers,
        isOwn,
        isAdmin,
      });

      // Load user's posts
      await loadPosts(userId);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          company:companies(*)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setPosts(data as unknown as PostWithDetails[]);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (!match) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-slate-600">Profile not found</p>
        </div>
      </div>
    );
  }

  const { user, company, investmentThesis, firm, firmMembers, isOwn, isAdmin } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-20 max-w-4xl">
        {/* User Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{user.full_name || 'Anonymous'}</h1>
                    <p className="text-slate-600">{user.email}</p>
                  </div>
                  {isOwn && (
                    <Button onClick={() => setLocation('/profile/edit')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                {user.bio && <p className="mt-3 text-slate-700">{user.bio}</p>}
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                  >
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founder Profile */}
        {user.user_type === 'founder' && company && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{company.name}</h2>
                  <p className="text-slate-600 mt-1">{company.one_line_pitch}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <StageBadge stage={company.stage} />
                    {company.sector.map((sector) => (
                      <SectorBadge key={sector} sector={sector} />
                    ))}
                  </div>
                  {company.description && (
                    <p className="mt-4 text-slate-700">{company.description}</p>
                  )}
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    {company.website && (
                      <div>
                        <strong>Website:</strong>{' '}
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {company.location && (
                      <div>
                        <strong>Location:</strong> {company.location}
                      </div>
                    )}
                    {company.founded_date && (
                      <div>
                        <strong>Founded:</strong>{' '}
                        {new Date(company.founded_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investor Profile */}
        {user.user_type === 'individual_investor' && investmentThesis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Investment Thesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Investment Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {investmentThesis.stages.map((stage) => (
                    <StageBadge key={stage} stage={stage} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Sectors</h3>
                <div className="flex flex-wrap gap-2">
                  {investmentThesis.sectors.map((sector) => (
                    <SectorBadge key={sector} sector={sector} />
                  ))}
                </div>
              </div>
              {investmentThesis.geography && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">Geography</h3>
                  <p className="text-slate-700">{investmentThesis.geography}</p>
                </div>
              )}
              {investmentThesis.check_size && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">Check Size</h3>
                  <p className="text-slate-700">{investmentThesis.check_size}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Firm Profile */}
        {user.user_type === 'firm_member' && firm && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>Firm</CardTitle>
                  {isOwn && isAdmin && (
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {firm.logo_url && (
                    <img
                      src={firm.logo_url}
                      alt={firm.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{firm.name}</h2>
                    {firm.website && (
                      <a
                        href={firm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        {firm.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {investmentThesis && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Investment Thesis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Investment Stages</h3>
                    <div className="flex flex-wrap gap-2">
                      {investmentThesis.stages.map((stage) => (
                        <StageBadge key={stage} stage={stage} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Sectors</h3>
                    <div className="flex flex-wrap gap-2">
                      {investmentThesis.sectors.map((sector) => (
                        <SectorBadge key={sector} sector={sector} />
                      ))}
                    </div>
                  </div>
                  {investmentThesis.geography && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Geography</h3>
                      <p className="text-slate-700">{investmentThesis.geography}</p>
                    </div>
                  )}
                  {investmentThesis.check_size && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Check Size</h3>
                      <p className="text-slate-700">{investmentThesis.check_size}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {firmMembers && firmMembers.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {firmMembers.map((member) => (
                      <div key={member.user.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.user.full_name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.full_name || 'Anonymous'}</p>
                          {member.title && (
                            <p className="text-sm text-slate-600">{member.title}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Posts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No posts yet"
                description={isOwn ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


