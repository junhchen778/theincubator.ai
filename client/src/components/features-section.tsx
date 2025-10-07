import { Pencil, Search, TrendingUp, CheckCircle2, ArrowRight, Sparkles, MessageSquare, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeaturesSection() {
  const features = [
    {
      icon: Pencil,
      title: "Share Your Journey",
      description: "Post updates about your startup's progress, milestones, and learnings. Build in public and attract the right investors.",
      benefits: [
        "Share metrics and traction",
        "Get discovered by investors",
        "Build investor relationships"
      ],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Search,
      title: "Discover Hidden Gems",
      description: "Find promising startups before everyone else. Track progress in real-time and engage with founders directly.",
      benefits: [
        "Early access to deals",
        "Real-time progress tracking",
        "Direct founder engagement"
      ],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Transparent Deal Flow",
      description: "Move from discovery to deal faster. Built-in tools for due diligence and collaboration between parties.",
      benefits: [
        "Streamlined due diligence",
        "Secure messaging",
        "Deal tracking dashboard"
      ],
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const steps = [
    { icon: Pencil, title: "Create Profile", description: "Set up your founder or investor profile in minutes" },
    { icon: MessageSquare, title: "Share Updates", description: "Post progress, metrics, and milestones" },
    { icon: LineChart, title: "Get Discovered", description: "Connect with the right investors or startups" }
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge className="mb-6 px-4 py-2 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            How <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text">incubator.ai</span> Works
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            A new paradigm for connecting founders with capital — transparent, efficient, and built for the modern startup ecosystem.
          </p>
        </div>

        {/* Steps - How it works flow */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl">
                        <Icon className="w-10 h-10" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  {/* Arrow between steps */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%]">
                      <ArrowRight className="w-6 h-6 text-primary/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group relative p-8 bg-white border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                data-testid={`card-feature-${index}`}
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  
                  {/* Benefits list */}
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Decorative element */}
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
