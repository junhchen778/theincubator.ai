import { Sparkles, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-bg opacity-5"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          
          {/* Badge */}
          <Badge 
            variant="outline" 
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20"
            data-testid="badge-revolutionary"
          >
            <Sparkles className="w-4 h-4" />
            <span>Revolutionizing Venture Capital</span>
          </Badge>

          {/* Main Heading */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
            The social feed where{" "}
            <span className="text-gradient">founders share</span>,{" "}
            <span className="text-gradient">investors discover</span>, 
            and venture deals are born
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
            Stop creating pitch decks. Start sharing progress.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              data-testid="button-founder-cta"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <Zap className="w-5 h-5 mr-2" />
              I'm a Founder
            </Button>
            <Button 
              size="lg"
              variant="outline"
              data-testid="button-investor-cta"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              I'm an Investor
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-6">Trusted by founders and investors from</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60">
              <div className="text-2xl font-bold text-foreground" data-testid="text-trust-yc">Y Combinator</div>
              <div className="text-2xl font-bold text-foreground" data-testid="text-trust-500">500 Startups</div>
              <div className="text-2xl font-bold text-foreground" data-testid="text-trust-techstars">Techstars</div>
              <div className="text-2xl font-bold text-foreground" data-testid="text-trust-a16z">a16z</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
