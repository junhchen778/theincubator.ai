import { Sparkles, Zap, TrendingUp, Rocket, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export function HeroSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float-slow"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M0 32V.5H32" fill="none" stroke="currentColor" strokeWidth="1"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)"></rect>
          </svg>
        </div>
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="text-center">
          
          {/* Badge with animation */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <Badge 
              variant="outline" 
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white/80 backdrop-blur-sm rounded-full border-2 border-primary/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              data-testid="badge-revolutionary"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text">
                Revolutionizing Venture Capital
              </span>
            </Badge>
          </div>

          {/* Main Heading with enhanced gradient */}
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl mb-8 animate-fade-in-up animation-delay-100 leading-tight">
            The social feed where{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                founders share
              </span>
            </span>
            ,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-gradient-x">
                investors discover
              </span>
            </span>
            , and venture deals are born
          </h1>

          {/* Subheading with better styling */}
          <p className="mx-auto max-w-3xl text-xl sm:text-2xl text-gray-600 mb-12 animate-fade-in-up animation-delay-200 font-medium">
            Stop creating pitch decks. Start sharing progress.<br/>
            <span className="text-lg text-muted-foreground">Join the future of fundraising.</span>
          </p>

          {/* CTA Buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-300">
            <Button 
              size="lg"
              onClick={() => setLocation('/auth/sign-up')}
              data-testid="button-founder-cta"
              className="group relative inline-flex items-center justify-center px-10 py-6 text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <Zap className="w-6 h-6 mr-2 relative z-10 group-hover:animate-pulse" />
              <span className="relative z-10">I'm a Founder</span>
            </Button>
            <Button 
              size="lg"
              onClick={() => setLocation('/auth/sign-up')}
              variant="outline"
              data-testid="button-investor-cta"
              className="group inline-flex items-center justify-center px-10 py-6 text-lg font-bold bg-white hover:bg-gray-50 border-2 border-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              <TrendingUp className="w-6 h-6 mr-2 group-hover:text-primary transition-colors" />
              I'm an Investor
            </Button>
          </div>

          {/* Value Props - New Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20 animate-fade-in-up animation-delay-400">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Build in Public</h3>
              <p className="text-sm text-gray-600 text-center">Share your journey and attract investors organically</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Find Hidden Gems</h3>
              <p className="text-sm text-gray-600 text-center">Discover promising startups before the crowd</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Connect Directly</h3>
              <p className="text-sm text-gray-600 text-center">Skip the middleman, build real relationships</p>
            </div>
          </div>

          {/*}
          <div className="mt-20 pt-10 border-t border-gray-300/50 animate-fade-in-up animation-delay-500">
            <p className="text-sm font-semibold text-gray-500 mb-8 uppercase tracking-wider">Trusted by founders and investors from</p>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
              <div className="text-2xl sm:text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110 transform" data-testid="text-trust-yc">Y Combinator</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110 transform" data-testid="text-trust-500">500 Startups</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110 transform" data-testid="text-trust-techstars">Techstars</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110 transform" data-testid="text-trust-a16z">a16z</div>
            </div>
          </div>
          */}
        </div>
      </div>
    </section>
  );
}
