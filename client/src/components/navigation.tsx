import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Zap, User, LogOut, Home, Settings, Sparkles, Briefcase, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { checkOnboardingProgress, type OnboardingProgress } from "@/lib/onboarding";
import type { User as UserType } from "@/lib/supabase";
import { searchAll, type SearchResults } from "@/lib/search";
import { STAGE_DISPLAY_NAMES } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export function Navigation() {
  const { user } = useAuth();
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [location, setLocation] = useLocation();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Re-check onboarding when location changes (after completing onboarding)
  useEffect(() => {
    // Debounce to avoid excessive checks
    const timer = setTimeout(async () => {
      if (user) {
        const progress = await checkOnboardingProgress(user);
        setOnboardingProgress(progress);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location, user]);

  useEffect(() => {
    // Check onboarding progress when user changes
    const checkProgress = async () => {
      if (user) {
        const progress = await checkOnboardingProgress(user);
        setOnboardingProgress(progress);
      } else {
        setOnboardingProgress(null);
      }
    };
    
    checkProgress();
  }, [user]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAll(searchQuery, 3); // Get top 3 of each type for autocomplete
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const handleSearchResultClick = (path: string) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    setLocation(path);
  };

  const handleViewAllResults = () => {
    setShowSearchDropdown(false);
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const totalResults = searchResults
    ? searchResults.companies.length + searchResults.investors.length + searchResults.posts.length
    : 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Left Section: Logo + Search */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">incubator.ai</span>
            </button>

            {/* Search Bar with Autocomplete */}
            {user && (
              <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <input 
                    type="search" 
                    data-testid="input-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.length >= 2) {
                        handleViewAllResults();
                      }
                    }}
                    placeholder="Search companies, investors, posts..." 
                    className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
                
                {/* Autocomplete Dropdown */}
                {showSearchDropdown && searchResults && totalResults > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50">
                    {/* Companies */}
                    {searchResults.companies.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          Companies
                        </div>
                        {searchResults.companies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => handleSearchResultClick(`/company/${company.id}`)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={company.logo_url || undefined} />
                              <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{company.name}</span>
                                {company.stage && (
                                  <Badge variant="outline" className="text-xs">
                                    {STAGE_DISPLAY_NAMES[company.stage] || company.stage}
                                  </Badge>
                                )}
                              </div>
                              {company.one_line_pitch && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {company.one_line_pitch}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Investors */}
                    {searchResults.investors.length > 0 && (
                      <div className="p-2 border-t border-border">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          Investors
                        </div>
                        {searchResults.investors.map((investor) => (
                          <button
                            key={investor.id}
                            onClick={() => handleSearchResultClick(`/profile/${investor.id}`)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={investor.avatar_url || undefined} />
                              <AvatarFallback>
                                {investor.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {investor.full_name || 'Anonymous'}
                                </span>
                                {investor.verified && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    ✓ Verified
                                  </Badge>
                                )}
                              </div>
                              {investor.investment_thesis && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {investor.investment_thesis.stages?.join(', ')} • {investor.investment_thesis.sectors?.join(', ')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Posts */}
                    {searchResults.posts.length > 0 && (
                      <div className="p-2 border-t border-border">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          Posts
                        </div>
                        {searchResults.posts.map((post) => (
                          <button
                            key={post.id}
                            onClick={() => handleSearchResultClick(`/feed`)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={post.company?.logo_url || post.author.avatar_url || undefined} />
                              <AvatarFallback>
                                {post.company?.name.charAt(0) || post.author.full_name?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <span className="font-medium">{post.author.full_name}</span>
                                {post.company && (
                                  <>
                                    <span>·</span>
                                    <span>{post.company.name}</span>
                                  </>
                                )}
                                <span>·</span>
                                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                              </div>
                              <p className="text-xs text-foreground line-clamp-2">
                                {post.content}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Footer - View All Results */}
                    <div className="p-2 border-t border-border">
                      <button
                        onClick={handleViewAllResults}
                        className="w-full text-center py-2 text-sm text-primary hover:bg-accent rounded-md transition-colors font-medium"
                      >
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {showSearchDropdown && searchResults && totalResults === 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl p-6 z-50 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No results found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try searching for AI, Fintech, or Seed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Navigation + Auth */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    variant={location === '/feed' ? 'secondary' : 'ghost'}
                    onClick={() => setLocation('/feed')}
                    className="flex flex-col items-center gap-1 h-14 px-3 py-1"
                  >
                    <Home className="h-5 w-5" />
                    <span className="text-xs">Feed</span>
                  </Button>
                  
                  {user.user_type === 'founder' && (
                    <Button
                      variant={location.startsWith('/dashboard/company') ? 'secondary' : 'ghost'}
                      onClick={() => setLocation('/dashboard/company')}
                      className="flex flex-col items-center gap-1 h-14 px-3 py-1"
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs">Company</span>
                    </Button>
                  )}
                  
                  {user.user_type === 'firm_member' && (
                    <Button
                      variant={location.startsWith('/firm') ? 'secondary' : 'ghost'}
                      onClick={() => setLocation('/firm/dashboard')}
                      className="flex flex-col items-center gap-1 h-14 px-3 py-1"
                    >
                      <Briefcase className="h-5 w-5" />
                      <span className="text-xs">Firm</span>
                    </Button>
                  )}
                </div>

                {/* Onboarding Button - only show if incomplete */}
                {onboardingProgress && !onboardingProgress.isComplete && (
                  <Button
                    onClick={() => setLocation(onboardingProgress.nextStep)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hidden lg:flex"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Complete Setup
                  </Button>
                )}

                {/* Notification Bell */}
                <NotificationBell />
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                      <AvatarFallback>
                        {user.full_name 
                          ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                          : <User className="h-5 w-5" />
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                          {user.user_type.replace('_', ' ')}
                        </span>
                        {user.verified && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation(`/profile/${user.id}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {user.user_type !== 'firm_member' && (
                    <DropdownMenuItem onClick={() => setLocation('/profile/edit')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="secondary"
                  data-testid="button-sign-in"
                  className="hidden sm:inline-flex"
                  onClick={() => setLocation('/auth/sign-in')}
                >
                  Sign In
                </Button>
                <Button 
                  data-testid="button-sign-up"
                  className="shadow-sm"
                  onClick={() => setLocation('/auth/sign-up')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
