import { Pencil, Search, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

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
      ]
    },
    {
      icon: Search,
      title: "Discover Hidden Gems",
      description: "Find promising startups before everyone else. Track progress in real-time and engage with founders directly.",
      benefits: [
        "Early access to deals",
        "Real-time progress tracking",
        "Direct founder engagement"
      ]
    },
    {
      icon: TrendingUp,
      title: "Transparent Deal Flow",
      description: "Move from discovery to deal faster. Built-in tools for due diligence and collaboration between parties.",
      benefits: [
        "Streamlined due diligence",
        "Secure messaging",
        "Deal tracking dashboard"
      ]
    }
  ];

  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            How incubator.ai Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A new paradigm for connecting founders with capital
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-8 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-feature-${index}`}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
