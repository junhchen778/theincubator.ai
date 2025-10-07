import { TrendingUp, Users, DollarSign, Handshake } from "lucide-react";

export function StatsSection() {
  const stats = [
    { 
      value: "2,500+", 
      label: "Active Founders",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      description: "Building the future"
    },
    { 
      value: "850+", 
      label: "Investors",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
      description: "Ready to invest"
    },
    { 
      value: "$125M", 
      label: "Capital Raised",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      description: "Through our platform"
    },
    { 
      value: "340+", 
      label: "Deals Closed",
      icon: Handshake,
      gradient: "from-orange-500 to-red-500",
      description: "And counting"
    }
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Colorful gradient orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg">
              📊 Platform Statistics
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Platform Impact
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of founders and investors transforming how startups raise capital
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="group relative bg-white rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-200"
                data-testid={`stat-${index}`}
              >
                {/* Gradient accent on top */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="mt-6">
                  <div className={`text-5xl sm:text-6xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.value}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.description}
                  </div>
                </div>

                {/* Decorative gradient border on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
              </div>
            );
          })}
        </div>

        {/* Additional Call-out */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-gray-200 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-900 font-semibold">
              Live platform • Real results • Growing daily
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
