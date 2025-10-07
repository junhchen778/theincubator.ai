import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function CTASection() {
  const [, setLocation] = useLocation();

  const benefits = [
    "No credit card required",
    "Setup in under 5 minutes",
    "Join 3,000+ users"
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40V.5H40" fill="none" stroke="white" strokeWidth="1"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)"></rect>
          </svg>
        </div>
        
        {/* Floating shapes */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md px-8 py-20 sm:px-16 sm:py-24 shadow-2xl border-2 border-white/20">

          <div className="relative text-center">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 rounded-full shadow-xl animate-pulse">
                <Sparkles className="w-5 h-5 text-yellow-900" />
                <span className="text-sm font-bold text-yellow-900">Limited Time Offer - Join Now!</span>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              Ready to Transform Your <br className="hidden sm:block"/>
              <span className="relative inline-block mt-2">
                <span className="relative z-10 text-yellow-300">Fundraising Journey?</span>
                <div className="absolute bottom-2 left-0 w-full h-4 bg-yellow-400/40 -skew-y-1 rounded"></div>
              </span>
            </h2>

            {/* Subheading */}
            <p className="mx-auto max-w-2xl text-xl sm:text-2xl text-white mb-10 font-semibold drop-shadow-md">
              Join thousands of founders and investors building the future together
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-sm sm:text-base font-bold text-white">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                size="lg"
                onClick={() => setLocation('/auth/sign-up')}
                data-testid="button-get-started"
                className="group relative inline-flex items-center justify-center px-12 py-7 text-xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-gray-900 hover:from-yellow-300 hover:via-orange-300 hover:to-red-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 w-full sm:w-auto overflow-hidden rounded-full"
              >
                <Zap className="w-7 h-7 mr-2 animate-pulse" />
                <span>Get Started Free</span>
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                size="lg"
                onClick={() => setLocation('/auth/sign-in')}
                variant="ghost"
                data-testid="button-learn-more"
                className="inline-flex items-center justify-center px-10 py-6 text-lg font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/50 hover:border-white shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto rounded-full"
              >
                Sign In
              </Button>
            </div>

            {/* Trust Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-2xl">🔒</span>
              <p className="text-sm font-semibold text-white">
                Secure & Trusted by industry leaders
              </p>
            </div>
          </div>
        </div>

        {/* Additional testimonial or social proof section */}
        <div className="mt-16 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-6 uppercase tracking-wider">
            What Our Users Say
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"Game-changer for our fundraising. Connected with the right investors within weeks."</p>
              <p className="font-semibold text-gray-900">— Sarah Chen, Founder</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"Finally, a platform where I can discover startups with real traction and transparency."</p>
              <p className="font-semibold text-gray-900">— Michael Park, Angel Investor</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"The social feed format makes it easy to track multiple companies and engage directly."</p>
              <p className="font-semibold text-gray-900">— Jessica Liu, VC Partner</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
