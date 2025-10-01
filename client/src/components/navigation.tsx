import { Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">incubator.ai</span>
          </div>

          {/* Search Bar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
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

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary"
              data-testid="button-sign-in"
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button 
              data-testid="button-sign-up"
              className="shadow-sm"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
