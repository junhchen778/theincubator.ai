import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search, Zap, User, LogOut, Home, Settings, Sparkles, Building2, LayoutDashboard, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser, signOut, onAuthStateChange } from "@/lib/auth";
import { checkOnboardingProgress, type OnboardingProgress } from "@/lib/onboarding";
import type { User as UserType } from "@/lib/supabase";

export function Navigation() {
  const [user, setUser] = useState<UserType | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [location, setLocation] = useLocation();

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
    // Load initial user and check onboarding
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const progress = await checkOnboardingProgress(currentUser);
        setOnboardingProgress(progress);
      }
    };
    
    loadUser();

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        const progress = await checkOnboardingProgress(user);
        setOnboardingProgress(progress);
      } else {
        setOnboardingProgress(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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

            {/* Search Bar */}
            {user && (
              <div className="hidden md:flex flex-1 max-w-md">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <input 
                    type="search" 
                    data-testid="input-search"
                    placeholder="Search founders, investors, or ideas..." 
                    className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>
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
                  
                  <Button
                    variant={location === '/companies' ? 'secondary' : 'ghost'}
                    onClick={() => setLocation('/companies')}
                    className="flex flex-col items-center gap-1 h-14 px-3 py-1"
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">Discover</span>
                  </Button>
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
                  {user.user_type === 'founder' && (
                    <DropdownMenuItem onClick={() => setLocation('/dashboard/company')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Company Dashboard</span>
                    </DropdownMenuItem>
                  )}
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
