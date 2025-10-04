import { supabase } from './supabase';
import type { Company, User, PostWithDetails } from './types';

export interface SearchCompanyResult extends Company {
  founders?: Array<{
    id: string;
    user_id: string;
    title: string | null;
    is_primary: boolean | null;
    user: User;
  }>;
  follower_count?: number;
  post_count?: number;
  interest_count?: number;
}

export interface SearchUserResult extends User {
  user_type: 'individual_investor' | 'firm_member';
  investment_thesis?: {
    stages: string[];
    sectors: string[];
    geography: string;
    check_size: string;
  };
  firm?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export interface SearchPostResult {
  id: string;
  content: string;
  created_at: string;
  post_type: string | null;
  milestone_tag: string | null;
  media_urls: string[] | null;
  author: User;
  company: Company | null;
}

export interface SearchResults {
  companies: SearchCompanyResult[];
  investors: SearchUserResult[];
  posts: SearchPostResult[];
}

export interface SearchFilters {
  // Company filters
  stages?: string[];
  sectors?: string[];
  location?: string;
  founded_after?: string;
  founded_before?: string;
  has_posts?: boolean;

  // Investor filters
  investor_types?: string[];
  investing_stages?: string[];
  investing_sectors?: string[];
  geography?: string;
  verified_only?: boolean;

  // Post filters
  post_types?: string[];
  milestone_tags?: string[];
  has_media?: boolean;
  posted_after?: string;
  posted_before?: string;
}

export type SortOption = 
  | 'relevance'
  | 'recent'
  | 'followers'
  | 'posts'
  | 'alphabetical'
  | 'engagement';

/**
 * Search across all content types
 */
export async function searchAll(
  query: string,
  limit: number = 10
): Promise<SearchResults> {
  const [companies, investors, posts] = await Promise.all([
    searchCompanies(query, {}, 'relevance', limit),
    searchInvestors(query, {}, 'relevance', limit),
    searchPosts(query, {}, 'relevance', limit),
  ]);

  return { companies, investors, posts };
}

/**
 * Search companies with filters and sorting
 */
export async function searchCompanies(
  query: string,
  filters: SearchFilters = {},
  sort: SortOption = 'relevance',
  limit: number = 20,
  offset: number = 0
): Promise<SearchCompanyResult[]> {
  try {
    let dbQuery = supabase
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
      `)
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply full-text search if query provided
    if (query.trim()) {
      // Use plainto_tsquery for simple multi-word search
      dbQuery = dbQuery.textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      });
    }

    // Apply filters
    if (filters.stages && filters.stages.length > 0) {
      dbQuery = dbQuery.in('stage', filters.stages);
    }

    if (filters.sectors && filters.sectors.length > 0) {
      dbQuery = dbQuery.overlaps('sector', filters.sectors);
    }

    if (filters.location) {
      dbQuery = dbQuery.ilike('location', `%${filters.location}%`);
    }

    if (filters.founded_after) {
      dbQuery = dbQuery.gte('founded_date', filters.founded_after);
    }

    if (filters.founded_before) {
      dbQuery = dbQuery.lte('founded_date', filters.founded_before);
    }

    // Apply sorting
    switch (sort) {
      case 'alphabetical':
        dbQuery = dbQuery.order('name', { ascending: true });
        break;
      case 'recent':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'relevance':
      default:
        // For relevance, we rely on text search ranking
        // For non-text searches, default to recent
        if (!query.trim()) {
          dbQuery = dbQuery.order('created_at', { ascending: false });
        }
        break;
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    let results = data as SearchCompanyResult[];

    // If has_posts filter is set, we need to filter by posts
    if (filters.has_posts) {
      const companiesWithCounts = await Promise.all(
        results.map(async (company) => {
          const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          return { ...company, post_count: count || 0 };
        })
      );
      results = companiesWithCounts.filter((c) => (c.post_count || 0) > 0);
    }

    // Load stats for each company (followers, posts, interests)
    const companiesWithStats = await Promise.all(
      results.map(async (company) => {
        const [followerCount, postCount, interestCount] = await Promise.all([
          supabase
            .from('company_follows')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .then(({ count }) => count || 0),
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .then(({ count }) => count || 0),
          supabase
            .from('company_interests')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .then(({ count }) => count || 0),
        ]);

        return {
          ...company,
          follower_count: followerCount,
          post_count: postCount,
          interest_count: interestCount,
        };
      })
    );

    // Apply post-query sorting if needed
    if (sort === 'followers') {
      companiesWithStats.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
    } else if (sort === 'posts') {
      companiesWithStats.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
    }

    return companiesWithStats;
  } catch (error) {
    console.error('Error searching companies:', error);
    return [];
  }
}

/**
 * Search investors (individual investors and firm members) with filters
 */
export async function searchInvestors(
  query: string,
  filters: SearchFilters = {},
  sort: SortOption = 'relevance',
  limit: number = 20,
  offset: number = 0
): Promise<SearchUserResult[]> {
  try {
    let dbQuery = supabase
      .from('users')
      .select(`
        *,
        individual_investors(
          investment_thesis,
          accredited
        ),
        firm_members(
          firm_id,
          role,
          title,
          firm:vc_firms(
            id,
            name,
            logo_url,
            verified
          )
        )
      `)
      .in('user_type', ['individual_investor', 'firm_member'])
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply full-text search
    if (query.trim()) {
      dbQuery = dbQuery.textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      });
    }

    // Apply filters
    if (filters.investor_types && filters.investor_types.length > 0) {
      dbQuery = dbQuery.in('user_type', filters.investor_types);
    }

    if (filters.verified_only) {
      dbQuery = dbQuery.eq('verified', true);
    }

    // Apply sorting
    switch (sort) {
      case 'alphabetical':
        dbQuery = dbQuery.order('full_name', { ascending: true });
        break;
      case 'relevance':
      default:
        if (!query.trim()) {
          dbQuery = dbQuery.order('created_at', { ascending: false });
        }
        break;
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    // Transform the data structure
    const results: SearchUserResult[] = (data || []).map((user: any) => {
      const individual = user.individual_investors?.[0];
      const firmMember = user.firm_members?.[0];

      return {
        ...user,
        investment_thesis: individual?.investment_thesis || firmMember?.firm?.investment_thesis,
        firm: firmMember?.firm ? {
          id: firmMember.firm.id,
          name: firmMember.firm.name,
          logo_url: firmMember.firm.logo_url,
        } : undefined,
      };
    });

    // Filter by investment thesis if specified
    let filteredResults = results;

    if (filters.investing_stages && filters.investing_stages.length > 0) {
      filteredResults = filteredResults.filter((investor) => {
        const thesis = investor.investment_thesis;
        if (!thesis?.stages) return false;
        return filters.investing_stages!.some((stage) => thesis.stages.includes(stage));
      });
    }

    if (filters.investing_sectors && filters.investing_sectors.length > 0) {
      filteredResults = filteredResults.filter((investor) => {
        const thesis = investor.investment_thesis;
        if (!thesis?.sectors) return false;
        return filters.investing_sectors!.some((sector) => thesis.sectors.includes(sector));
      });
    }

    if (filters.geography) {
      filteredResults = filteredResults.filter((investor) => {
        const thesis = investor.investment_thesis;
        if (!thesis?.geography) return false;
        return thesis.geography.toLowerCase().includes(filters.geography!.toLowerCase());
      });
    }

    return filteredResults;
  } catch (error) {
    console.error('Error searching investors:', error);
    return [];
  }
}

/**
 * Search posts with filters
 */
export async function searchPosts(
  query: string,
  filters: SearchFilters = {},
  sort: SortOption = 'relevance',
  limit: number = 20,
  offset: number = 0
): Promise<SearchPostResult[]> {
  try {
    let dbQuery = supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        company:companies(*)
      `)
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply full-text search
    if (query.trim()) {
      dbQuery = dbQuery.textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      });
    }

    // Apply filters
    if (filters.post_types && filters.post_types.length > 0) {
      dbQuery = dbQuery.in('post_type', filters.post_types);
    }

    if (filters.milestone_tags && filters.milestone_tags.length > 0) {
      dbQuery = dbQuery.in('milestone_tag', filters.milestone_tags);
    }

    if (filters.has_media) {
      dbQuery = dbQuery.not('media_urls', 'is', null);
    }

    if (filters.posted_after) {
      dbQuery = dbQuery.gte('created_at', filters.posted_after);
    }

    if (filters.posted_before) {
      dbQuery = dbQuery.lte('created_at', filters.posted_before);
    }

    // Apply sorting
    switch (sort) {
      case 'recent':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'relevance':
      default:
        if (!query.trim()) {
          dbQuery = dbQuery.order('created_at', { ascending: false });
        }
        break;
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    let results = data as SearchPostResult[];

    // If sorting by engagement, we need to calculate engagement for each post
    if (sort === 'engagement') {
      const postsWithEngagement = await Promise.all(
        results.map(async (post) => {
          const [likeCount, commentCount] = await Promise.all([
            supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .then(({ count }) => count || 0),
            supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .then(({ count }) => count || 0),
          ]);

          return {
            ...post,
            engagement_score: likeCount + commentCount,
          };
        })
      );

      postsWithEngagement.sort((a, b) => b.engagement_score - a.engagement_score);
      results = postsWithEngagement;
    }

    return results;
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

/**
 * Highlight matching query terms in text
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const terms = query.trim().split(/\s+/);
  let result = text;
  
  terms.forEach((term) => {
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  });
  
  return result;
}

