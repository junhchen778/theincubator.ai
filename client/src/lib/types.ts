export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  stage: string;
  sector: string[];
  description: string;
  website: string;
  location: string;
  one_line_pitch: string;
  founded_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentThesis {
  stages: string[];
  sectors: string[];
  geography: string;
  check_size: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  user_type: string;
  verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VCFirm {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  investment_thesis: InvestmentThesis | null;
  created_by: string | null;
  verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FirmMember {
  id: string;
  firm_id: string;
  user_id: string;
  role: string | null;
  title: string | null;
  joined_at: string | null;
}

export interface CompanyFounder {
  id: string;
  company_id: string;
  user_id: string;
  title: string | null;
  is_primary: boolean | null;
  created_at: string | null;
}

export interface IndividualInvestor {
  id: string;
  user_id: string;
  investment_thesis: InvestmentThesis | null;
  accredited: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Constants
export const STAGES = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c+'] as const;

// Display names for stages (for UI)
export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c+': 'Series C+',
};

export const SECTORS = [
  'AI/ML',
  'Fintech',
  'Healthcare',
  'Climate',
  'SaaS',
  'Hardware',
  'Consumer',
  'Enterprise',
  'Other'
] as const;

export type Stage = typeof STAGES[number];
export type Sector = typeof SECTORS[number];

