import { useEffect, useState } from 'react';
import { useLocation as useWouterLocation } from 'wouter';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostCard } from '@/components/post-card';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/supabase';
import {
  searchCompanies,
  searchInvestors,
  searchPosts,
  type SearchFilters,
  type SortOption,
  type SearchCompanyResult,
  type SearchUserResult,
  type SearchPostResult,
} from '@/lib/search';
import { STAGES, SECTORS, STAGE_DISPLAY_NAMES, MILESTONE_TAGS } from '@/lib/types';
import { Search, Loader2, Filter, X, Building2, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TabType = 'all' | 'companies' | 'investors' | 'posts';

export default function SearchPage() {
  const [, setLocation] = useWouterLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialType = (urlParams.get('type') as TabType) || 'all';

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>(initialType);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Results
  const [companyResults, setCompanyResults] = useState<SearchCompanyResult[]>([]);
  const [investorResults, setInvestorResults] = useState<SearchUserResult[]>([]);
  const [postResults, setPostResults] = useState<SearchPostResult[]>([]);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({});
  const [companySort, setCompanySort] = useState<SortOption>('relevance');
  const [investorSort, setInvestorSort] = useState<SortOption>('relevance');
  const [postSort, setPostSort] = useState<SortOption>('relevance');

  // Load user
  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLocation('/auth/sign-in');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    }
    loadUser();
  }, [setLocation]);

  // Perform search when query or filters change
  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setCompanyResults([]);
      setInvestorResults([]);
      setPostResults([]);
    }
  }, [searchQuery, filters, companySort, investorSort, postSort]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const [companies, investors, posts] = await Promise.all([
        searchCompanies(searchQuery, filters, companySort, 20),
        searchInvestors(searchQuery, filters, investorSort, 20),
        searchPosts(searchQuery, filters, postSort, 20),
      ]);

      setCompanyResults(companies);
      setInvestorResults(investors);
      setPostResults(posts);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const toggleStageFilter = (stage: string) => {
    const current = filters.stages || [];
    if (current.includes(stage)) {
      handleFilterChange('stages', current.filter((s) => s !== stage));
    } else {
      handleFilterChange('stages', [...current, stage]);
    }
  };

  const toggleSectorFilter = (sector: string) => {
    const current = filters.sectors || [];
    if (current.includes(sector)) {
      handleFilterChange('sectors', current.filter((s) => s !== sector));
    } else {
      handleFilterChange('sectors', [...current, sector]);
    }
  };

  const toggleInvestingStageFilter = (stage: string) => {
    const current = filters.investing_stages || [];
    if (current.includes(stage)) {
      handleFilterChange('investing_stages', current.filter((s) => s !== stage));
    } else {
      handleFilterChange('investing_stages', [...current, stage]);
    }
  };

  const toggleInvestingSectorFilter = (sector: string) => {
    const current = filters.investing_sectors || [];
    if (current.includes(sector)) {
      handleFilterChange('investing_sectors', current.filter((s) => s !== sector));
    } else {
      handleFilterChange('investing_sectors', [...current, sector]);
    }
  };

  const togglePostTypeFilter = (type: string) => {
    const current = filters.post_types || [];
    if (current.includes(type)) {
      handleFilterChange('post_types', current.filter((t) => t !== type));
    } else {
      handleFilterChange('post_types', [...current, type]);
    }
  };

  const toggleMilestoneTagFilter = (tag: string) => {
    const current = filters.milestone_tags || [];
    if (current.includes(tag)) {
      handleFilterChange('milestone_tags', current.filter((t) => t !== tag));
    } else {
      handleFilterChange('milestone_tags', [...current, tag]);
    }
  };

  const totalResults = companyResults.length + investorResults.length + postResults.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Search Results</h1>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground">
                    {isSearching ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </span>
                    ) : (
                      `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(filters).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden md:flex"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="hidden md:block w-64 flex-shrink-0">
                <Card className="sticky top-20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Filters</h3>

                    {/* Company Filters */}
                    {(activeTab === 'all' || activeTab === 'companies') && (
                      <div className="space-y-4 mb-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Stage</Label>
                          <div className="space-y-2">
                            {STAGES.map((stage) => (
                              <div key={stage} className="flex items-center">
                                <Checkbox
                                  id={`stage-${stage}`}
                                  checked={filters.stages?.includes(stage)}
                                  onCheckedChange={() => toggleStageFilter(stage)}
                                />
                                <label
                                  htmlFor={`stage-${stage}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {STAGE_DISPLAY_NAMES[stage]}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Sector</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {SECTORS.map((sector) => (
                              <div key={sector} className="flex items-center">
                                <Checkbox
                                  id={`sector-${sector}`}
                                  checked={filters.sectors?.includes(sector)}
                                  onCheckedChange={() => toggleSectorFilter(sector)}
                                />
                                <label
                                  htmlFor={`sector-${sector}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {sector}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Location</Label>
                          <Input
                            placeholder="Enter location..."
                            value={filters.location || ''}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center">
                          <Checkbox
                            id="has-posts"
                            checked={filters.has_posts || false}
                            onCheckedChange={(checked) =>
                              handleFilterChange('has_posts', checked)
                            }
                          />
                          <label htmlFor="has-posts" className="ml-2 text-sm cursor-pointer">
                            Has Posts
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Investor Filters */}
                    {(activeTab === 'all' || activeTab === 'investors') && (
                      <div className="space-y-4 mb-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Investing Stages
                          </Label>
                          <div className="space-y-2">
                            {STAGES.map((stage) => (
                              <div key={stage} className="flex items-center">
                                <Checkbox
                                  id={`inv-stage-${stage}`}
                                  checked={filters.investing_stages?.includes(stage)}
                                  onCheckedChange={() => toggleInvestingStageFilter(stage)}
                                />
                                <label
                                  htmlFor={`inv-stage-${stage}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {STAGE_DISPLAY_NAMES[stage]}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Investing Sectors
                          </Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {SECTORS.map((sector) => (
                              <div key={sector} className="flex items-center">
                                <Checkbox
                                  id={`inv-sector-${sector}`}
                                  checked={filters.investing_sectors?.includes(sector)}
                                  onCheckedChange={() => toggleInvestingSectorFilter(sector)}
                                />
                                <label
                                  htmlFor={`inv-sector-${sector}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {sector}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Geography</Label>
                          <Input
                            placeholder="Enter geography..."
                            value={filters.geography || ''}
                            onChange={(e) => handleFilterChange('geography', e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center">
                          <Checkbox
                            id="verified-only"
                            checked={filters.verified_only || false}
                            onCheckedChange={(checked) =>
                              handleFilterChange('verified_only', checked)
                            }
                          />
                          <label htmlFor="verified-only" className="ml-2 text-sm cursor-pointer">
                            Verified Only
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Post Filters */}
                    {(activeTab === 'all' || activeTab === 'posts') && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Post Type</Label>
                          <div className="space-y-2">
                            {['general', 'milestone', 'demo'].map((type) => (
                              <div key={type} className="flex items-center">
                                <Checkbox
                                  id={`post-type-${type}`}
                                  checked={filters.post_types?.includes(type)}
                                  onCheckedChange={() => togglePostTypeFilter(type)}
                                />
                                <label
                                  htmlFor={`post-type-${type}`}
                                  className="ml-2 text-sm cursor-pointer capitalize"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Milestone Tags
                          </Label>
                          <div className="space-y-2">
                            {Object.keys(MILESTONE_TAGS).map((tag) => (
                              <div key={tag} className="flex items-center">
                                <Checkbox
                                  id={`milestone-${tag}`}
                                  checked={filters.milestone_tags?.includes(tag)}
                                  onCheckedChange={() => toggleMilestoneTagFilter(tag)}
                                />
                                <label
                                  htmlFor={`milestone-${tag}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {MILESTONE_TAGS[tag as keyof typeof MILESTONE_TAGS].label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center">
                          <Checkbox
                            id="has-media"
                            checked={filters.has_media || false}
                            onCheckedChange={(checked) =>
                              handleFilterChange('has_media', checked)
                            }
                          />
                          <label htmlFor="has-media" className="ml-2 text-sm cursor-pointer">
                            Has Media
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </aside>
            )}

            {/* Results Section */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                <TabsList className="w-full justify-start mb-6">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All
                    {totalResults > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {totalResults}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="companies" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Companies
                    {companyResults.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {companyResults.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="investors" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Investors
                    {investorResults.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {investorResults.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Posts
                    {postResults.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {postResults.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* All Tab */}
                <TabsContent value="all" className="space-y-8">
                  {!searchQuery ? (
                    <div className="text-center py-12">
                      <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Start searching</h3>
                      <p className="text-muted-foreground">
                        Search for companies, investors, or posts
                      </p>
                    </div>
                  ) : totalResults === 0 && !isSearching ? (
                    <div className="text-center py-12">
                      <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Companies Section */}
                      {companyResults.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Companies</h2>
                            {companyResults.length >= 5 && (
                              <Button
                                variant="link"
                                onClick={() => setActiveTab('companies')}
                              >
                                View all companies →
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {companyResults.slice(0, 5).map((company) => (
                              <CompanyCard key={company.id} company={company} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Investors Section */}
                      {investorResults.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Investors</h2>
                            {investorResults.length >= 5 && (
                              <Button
                                variant="link"
                                onClick={() => setActiveTab('investors')}
                              >
                                View all investors →
                              </Button>
                            )}
                          </div>
                          <div className="space-y-4">
                            {investorResults.slice(0, 5).map((investor) => (
                              <InvestorCard key={investor.id} investor={investor} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posts Section */}
                      {postResults.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Posts</h2>
                            {postResults.length >= 5 && (
                              <Button variant="link" onClick={() => setActiveTab('posts')}>
                                View all posts →
                              </Button>
                            )}
                          </div>
                          <div className="space-y-4">
                            {postResults.slice(0, 5).map((post) => (
                              <PostCard
                                key={post.id}
                                post={post as any}
                                currentUserId={user?.id}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Companies Tab */}
                <TabsContent value="companies">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {companyResults.length} compan{companyResults.length !== 1 ? 'ies' : 'y'}
                    </p>
                    <Select
                      value={companySort}
                      onValueChange={(v) => setCompanySort(v as SortOption)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="followers">Most Followers</SelectItem>
                        <SelectItem value="posts">Most Posts</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {companyResults.length === 0 && !isSearching ? (
                    <div className="text-center py-12">
                      <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No companies found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {companyResults.map((company) => (
                        <CompanyCard key={company.id} company={company} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Investors Tab */}
                <TabsContent value="investors">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {investorResults.length} investor{investorResults.length !== 1 ? 's' : ''}
                    </p>
                    <Select
                      value={investorSort}
                      onValueChange={(v) => setInvestorSort(v as SortOption)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {investorResults.length === 0 && !isSearching ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No investors found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {investorResults.map((investor) => (
                        <InvestorCard key={investor.id} investor={investor} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts">
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {postResults.length} post{postResults.length !== 1 ? 's' : ''}
                    </p>
                    <Select
                      value={postSort}
                      onValueChange={(v) => setPostSort(v as SortOption)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="engagement">Most Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {postResults.length === 0 && !isSearching ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No posts found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {postResults.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post as any}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Company Card Component
function CompanyCard({ company }: { company: SearchCompanyResult }) {
  const [, setLocation] = useWouterLocation();

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setLocation(`/company/${company.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={company.logo_url || undefined} />
            <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{company.name}</h3>
            <div className="flex gap-1 mt-1 flex-wrap">
              {company.stage && (
                <Badge variant="outline" className="text-xs">
                  {STAGE_DISPLAY_NAMES[company.stage]}
                </Badge>
              )}
              {company.sector?.slice(0, 2).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {company.one_line_pitch && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {company.one_line_pitch}
          </p>
        )}

        {company.founders && company.founders.length > 0 && (
          <div className="flex -space-x-2 mb-3">
            {company.founders.slice(0, 3).map((founder) => (
              <Avatar key={founder.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={founder.user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {founder.user?.full_name?.charAt(0) || 'F'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {company.follower_count !== undefined && (
            <span>{company.follower_count} followers</span>
          )}
          {company.post_count !== undefined && (
            <span>{company.post_count} posts</span>
          )}
          {company.interest_count !== undefined && company.interest_count > 0 && (
            <span>{company.interest_count} interests</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Investor Card Component
function InvestorCard({ investor }: { investor: SearchUserResult }) {
  const [, setLocation] = useWouterLocation();

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setLocation(`/profile/${investor.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={investor.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {investor.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                {investor.full_name || 'Anonymous'}
              </h3>
              {investor.verified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ Verified
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {investor.user_type.replace('_', ' ')}
              </Badge>
              {investor.firm && (
                <span className="text-sm text-muted-foreground">at {investor.firm.name}</span>
              )}
            </div>

            {investor.investment_thesis && (
              <div className="space-y-1 mb-2">
                {investor.investment_thesis.stages && (
                  <p className="text-sm">
                    <span className="font-medium">Stages:</span>{' '}
                    {investor.investment_thesis.stages
                      .map((s) => STAGE_DISPLAY_NAMES[s] || s)
                      .join(', ')}
                  </p>
                )}
                {investor.investment_thesis.sectors && (
                  <p className="text-sm">
                    <span className="font-medium">Sectors:</span>{' '}
                    {investor.investment_thesis.sectors.join(', ')}
                  </p>
                )}
                {investor.investment_thesis.geography && (
                  <p className="text-sm">
                    <span className="font-medium">Geography:</span>{' '}
                    {investor.investment_thesis.geography}
                  </p>
                )}
                {investor.investment_thesis.check_size && (
                  <p className="text-sm">
                    <span className="font-medium">Check Size:</span>{' '}
                    {investor.investment_thesis.check_size}
                  </p>
                )}
              </div>
            )}

            {investor.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{investor.bio}</p>
            )}
          </div>

          <Button size="sm" variant="outline">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


