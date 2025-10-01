export function StatsSection() {
  const stats = [
    { value: "2,500+", label: "Active Founders" },
    { value: "850+", label: "Investors" },
    { value: "$125M", label: "Capital Raised" },
    { value: "340+", label: "Deals Closed" }
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center" data-testid={`stat-${index}`}>
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
