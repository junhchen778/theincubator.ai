import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CompanyWithFounders, STAGES, SECTORS, STAGE_DISPLAY_NAMES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CompanyCard } from '@/components/company-card';
import { EmptyState } from '@/components/empty-state';
import { Navigation } from '@/components/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Building2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const ITEMS_PER_PAGE = 12;

type SortOption = 'newest' | 'oldest' | 'followers';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithFounders[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load companies
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      try {
        let query = supabase
          .from('companies')
          .select(`
            *,
            founders:company_founders(
              id,
              user_id,
              title,
              is_primary,
              user:users(*)
            )
          `);

        // Apply filters
        if (debouncedSearch) {
          query = query.ilike('name', `%${debouncedSearch}%`);
        }

        if (selectedStages.length > 0) {
          query = query.in('stage', selectedStages);
        }

        if (locationFilter) {
          query = query.ilike('location', `%${locationFilter}%`);
        }

        // Sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        }
        // Note: 'followers' sort would need a join or separate query

        const { data, error } = await query;

        if (error) throw error;

        let filteredData = data || [];

        // Filter by sectors (client-side since it's an array)
        if (selectedSectors.length > 0) {
          filteredData = filteredData.filter((company: any) => {
            if (!company.sector) return false;
            return selectedSectors.some(sector => company.sector.includes(sector));
          });
        }

        setCompanies(filteredData as CompanyWithFounders[]);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, [debouncedSearch, selectedStages, selectedSectors, locationFilter, sortBy]);

  // Handle stage filter
  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
    setCurrentPage(1);
  };

  // Handle sector filter
  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStages([]);
    setSelectedSectors([]);
    setLocationFilter('');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(companies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCompanies = companies.slice(startIndex, endIndex);

  const hasActiveFilters = selectedStages.length > 0 || selectedSectors.length > 0 || locationFilter || searchQuery;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Discover Startups</h1>
            <p className="text-lg text-muted-foreground">
              Find your next investment opportunity
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search companies by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Stage Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Stage</Label>
                      {selectedStages.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStages([])}
                          className="h-auto p-0 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {STAGES.map((stage) => (
                        <div key={stage} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stage-${stage}`}
                            checked={selectedStages.includes(stage)}
                            onCheckedChange={() => toggleStage(stage)}
                          />
                          <label
                            htmlFor={`stage-${stage}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {STAGE_DISPLAY_NAMES[stage]}
                          </label>
                        </div>
                      ))}
                    </div>
                    {STAGES.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStages([...STAGES])}
                          className="text-xs flex-1"
                        >
                          Select All
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Sector Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Sector</Label>
                      {selectedSectors.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSectors([])}
                          className="h-auto p-0 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {SECTORS.map((sector) => (
                        <div key={sector} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sector-${sector}`}
                            checked={selectedSectors.includes(sector)}
                            onCheckedChange={() => toggleSector(sector)}
                          />
                          <label
                            htmlFor={`sector-${sector}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {sector}
                          </label>
                        </div>
                      ))}
                    </div>
                    {SECTORS.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSectors([...SECTORS] as string[])}
                          className="text-xs flex-1"
                        >
                          Select All
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Location Filter */}
                  <div className="space-y-3">
                    <Label className="font-medium">Location</Label>
                    <Input
                      placeholder="e.g., San Francisco"
                      value={locationFilter}
                      onChange={(e) => {
                        setLocationFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {companies.length} {companies.length === 1 ? 'company' : 'companies'}
                </p>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="followers">Most Followers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Empty State */}
              {!loading && companies.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={Building2}
                      title="No companies found"
                      description={
                        hasActiveFilters
                          ? "Try adjusting your filters to see more results."
                          : "No companies are available yet. Check back soon!"
                      }
                      action={
                        hasActiveFilters
                          ? {
                              label: "Clear Filters",
                              onClick: clearFilters,
                            }
                          : undefined
                      }
                    />
                  </CardContent>
                </Card>
              )}

              {/* Results Grid */}
              {!loading && companies.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {paginatedCompanies.map((company) => (
                      <CompanyCard key={company.id} company={company} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

