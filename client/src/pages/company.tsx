import { useEffect, useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyWithFounders, PostWithDetails } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CompanyStats } from '@/components/company-stats';
import { EmptyState } from '@/components/empty-state';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { ExpressInterestModal } from '@/components/express-interest-modal';
import { FollowChoiceModal } from '@/components/follow-choice-modal';
import { followCompany, unfollowCompany, checkFollowStatus } from '@/lib/follow-helper';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Loader2, 
  Edit, 
  Users,
  Sparkles,
  FileText,
  Heart,
  UserCheck,
  UserPlus,
  UserMinus,
  Star,
  CheckCircle,
} from 'lucide-react';
import { STAGE_DISPLAY_NAMES } from '@/lib/types';

export default function CompanyPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute('/company/:id');
  const [, setLocation] = useLocation();
  const [company, setCompany] = useState<CompanyWithFounders | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, interests: 0, posts: 0 });
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [userFirmId, setUserFirmId] = useState<string | null>(null);
  const [followAsFirm, setFollowAsFirm] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [firmData, setFirmData] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [firmAlreadyFollows, setFirmAlreadyFollows] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      if (!params?.id) return;

      try {
        if (!currentUser) {
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
          .eq('id', params.id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          setLocation('/404');
          return;
        }

        if (!companyData) {
          setLocation('/404');
          return;
        }

        setCompany(companyData as CompanyWithFounders);

        // Check if current user is a founder
        if (currentUser && companyData.founders) {
          const isUserFounder = companyData.founders.some(
            (f: any) => f.user_id === currentUser.id
          );
          setIsFounder(isUserFounder);
        }

        // Check if user is following this company
        if (currentUser && (currentUser.user_type === 'individual_investor' || currentUser.user_type === 'firm_member')) {
          // Get firm data if firm member
          let firmId: string | null = null;
          if (currentUser.user_type === 'firm_member') {
            const { data: firmMember } = await supabase
              .from('firm_members')
              .select('firm_id, firm:vc_firms(id, name, logo_url)')
              .eq('user_id', currentUser.id)
              .single();
            
            if (firmMember?.firm) {
              firmId = firmMember.firm_id;
              setUserFirmId(firmMember.firm_id);
              setFirmData(firmMember.firm as any);
            }
          }

          // Use helper to check follow status
          const followStatus = await checkFollowStatus(
            params.id,
            currentUser.id,
            firmId
          );

          setIsFollowing(followStatus.isFollowing);
          setFollowAsFirm(followStatus.followAsFirm);
          setFirmAlreadyFollows(followStatus.firmAlreadyFollows);

          // Check if user or their firm has expressed interest
          let hasInterest = false;
          
          // Check individual interest
          const { data: interestData } = await supabase
            .from('company_interests')
            .select('id')
            .eq('company_id', params.id)
            .eq('investor_id', currentUser.id)
            .maybeSingle();
          
          if (interestData) {
            hasInterest = true;
          }
          
          // If user is a firm member, also check if firm has expressed interest
          if (!hasInterest && firmId) {
            const { data: firmInterestData } = await supabase
              .from('company_interests')
              .select('id')
              .eq('company_id', params.id)
              .eq('firm_id', firmId)
              .maybeSingle();
            
            if (firmInterestData) {
              hasInterest = true;
            }
          }
          
          setHasExpressedInterest(hasInterest);
        }

        // Fetch stats
        const [followersRes, interestsRes, postsRes] = await Promise.all([
          supabase
            .from('company_follows')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', params.id),
          supabase
            .from('company_interests')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', params.id),
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', params.id)
        ]);

        setStats({
          followers: followersRes.count || 0,
          interests: interestsRes.count || 0,
          posts: postsRes.count || 0
        });

        // Fetch posts
        await loadPosts(params.id);
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [params?.id, currentUser, setLocation]);

  const loadPosts = async (companyId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          company:companies(*)
        `)
        .eq('company_id', companyId)
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

  const handleFollowToggle = async () => {
    if (!currentUser || !params?.id || isTogglingFollow) return;

    // If not following and is firm member and firm doesn't already follow, show modal
    if (!isFollowing && currentUser.user_type === 'firm_member' && !firmAlreadyFollows) {
      setShowFollowModal(true);
      return;
    }

    // Otherwise, handle follow/unfollow directly
    // For individuals, always pass null (personal follow)
    // For firm members who are unfollowing, check if it was a firm follow
    await executeFollowToggle(currentUser.user_type === 'individual_investor' ? null : followAsFirm);
  };

  const executeFollowToggle = async (asFirm: boolean | null = null) => {
    if (!currentUser || !params?.id || isTogglingFollow) return;

    setIsTogglingFollow(true);
    
    // Optimistic update
    const newFollowingState = !isFollowing;
    const newFollowerCount = newFollowingState ? stats.followers + 1 : stats.followers - 1;
    setIsFollowing(newFollowingState);
    setStats({ ...stats, followers: newFollowerCount });

    try {
      if (newFollowingState) {
        // Follow
        const firmIdToUse = asFirm !== null && asFirm && userFirmId ? userFirmId : null;
        const result = await followCompany(params.id, currentUser.id, firmIdToUse);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to follow');
        }

        if (firmIdToUse) {
          setFollowAsFirm(true);
          setFirmAlreadyFollows(true);
        }

        toast({
          title: "Following",
          description: `Now following ${company?.name}${firmIdToUse ? ' as your firm' : ''}`,
        });
      } else {
        // Unfollow
        const result = await unfollowCompany(params.id, currentUser.id, followAsFirm && userFirmId ? userFirmId : null);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to unfollow');
        }

        if (followAsFirm) {
          setFollowAsFirm(false);
          setFirmAlreadyFollows(false);
        }

        toast({
          title: "Unfollowed",
          description: `No longer following ${company?.name}`,
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(!newFollowingState);
      setStats({ ...stats, followers: stats.followers });
      console.error('Error toggling follow:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleFollowChoice = async (asFirm: boolean) => {
    setShowFollowModal(false);
    await executeFollowToggle(asFirm);
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
              label: "Search Companies",
              onClick: () => setLocation('/search?type=companies')
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                {/* Left Side */}
                <div className="flex gap-4 flex-1">
                  <Avatar className="h-[120px] w-[120px]">
                    <AvatarImage src={company.logo_url || undefined} />
                    <AvatarFallback>
                      <Building2 className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                    <p className="text-lg text-muted-foreground mb-4">
                      {company.one_line_pitch || 'No pitch available'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {company.stage && <StageBadge stage={company.stage} />}
                      {company.sector?.map((sector) => (
                        <SectorBadge key={sector} sector={sector} />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {company.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {company.location}
                        </div>
                      )}
                      {company.founded_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Founded {new Date(company.founded_date).getFullYear()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {!isFounder && (currentUser?.user_type === 'individual_investor' || currentUser?.user_type === 'firm_member') && (
                    <>
                      {isFollowing ? (
                        <Button
                          className="w-full group"
                          onClick={handleFollowToggle}
                          disabled={isTogglingFollow}
                        >
                          <UserCheck className="h-4 w-4 mr-2 group-hover:hidden" />
                          <UserMinus className="h-4 w-4 mr-2 hidden group-hover:block" />
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline">Unfollow</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleFollowToggle}
                          disabled={isTogglingFollow}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      )}
                      {hasExpressedInterest ? (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Interest Expressed
                        </Button>
                      ) : (
                        <Button 
                          className="w-full group hover:shadow-lg transition-shadow"
                          onClick={() => setShowInterestModal(true)}
                        >
                          <Star className="h-4 w-4 mr-2 group-hover:fill-current" />
                          Express Interest
                        </Button>
                      )}
                    </>
                  )}
                  {!currentUser && (
                    <Button variant="outline" disabled className="w-full">
                      <Star className="h-4 w-4 mr-2" />
                      Sign in to express interest
                    </Button>
                  )}
                  {isFounder && (
                    <Link href={`/company/${company.id}/edit`}>
                      <Button className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Company
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Bar */}
          <div className="mb-6">
            <CompanyStats 
              followers={stats.followers}
              interests={stats.interests}
              posts={stats.posts}
              companyId={company.id}
              isFounder={isFounder}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.website && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Website</h3>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {company.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    {company.description ? (
                      <p className="text-sm whitespace-pre-wrap">{company.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Posts Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Updates from {company.name}</CardTitle>
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
                      description="Check back soon for updates from this company."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Founders Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Founders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.founders && company.founders.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {company.founders.map((founder) => (
                          <Link key={founder.id} href={`/profile/${founder.user_id}`}>
                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                              <Avatar>
                                <AvatarImage src={founder.user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {founder.user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">
                                    {founder.user.full_name || 'Unnamed User'}
                                  </p>
                                  {founder.is_primary && (
                                    <Badge variant="secondary" className="text-xs">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                {founder.title && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {founder.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No founders listed"
                        description="Founder information is not available."
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">AI-generated summary will appear here</p>
                    <p className="text-xs text-muted-foreground">Powered by GPT-4, updates weekly</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {currentUser && company && (
        <ExpressInterestModal
          company={company}
          isOpen={showInterestModal}
          onClose={() => setShowInterestModal(false)}
          onSuccess={() => {
            setHasExpressedInterest(true);
            setStats({ ...stats, interests: stats.interests + 1 });
            // Auto-follow updates the follow status
            setIsFollowing(true);
            if (currentUser.user_type === 'firm_member' && userFirmId) {
              setFollowAsFirm(true);
              setFirmAlreadyFollows(true);
            }
          }}
        />
      )}

      {/* Follow Choice Modal */}
      {showFollowModal && currentUser && firmData && company && (
        <FollowChoiceModal
          isOpen={showFollowModal}
          onClose={() => setShowFollowModal(false)}
          onChoose={handleFollowChoice}
          userName={currentUser.full_name || 'You'}
          userAvatar={currentUser.avatar_url || undefined}
          firmName={firmData.name}
          firmLogo={firmData.logo_url || undefined}
          companyName={company.name}
        />
      )}
    </>
  );
}
