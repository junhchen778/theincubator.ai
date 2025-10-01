import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 sm:px-16 shadow-2xl">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M0 32V.5H32" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)"></rect>
            </svg>
          </div>

          <div className="relative text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Ready to Transform Your Fundraising?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/90 mb-8">
              Join thousands of founders and investors building the future together
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                variant="secondary"
                data-testid="button-get-started"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary bg-white hover:bg-white/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="ghost"
                data-testid="button-learn-more"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 w-full sm:w-auto"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
