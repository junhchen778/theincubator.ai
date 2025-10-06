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

// Extended company types
export interface CompanyWithFounders extends Company {
  founders: Array<{
    id: string;
    user_id: string;
    title: string | null;
    is_primary: boolean | null;
    user: User;
  }>;
  follower_count?: number;
  interest_count?: number;
  post_count?: number;
}

export interface CompanyStats {
  followers: number;
  interests: number;
  posts: number;
}

export interface SearchFilters {
  stages: string[];
  sectors: string[];
  location: string;
  query: string;
}

// Post types
export interface Post {
  id: string;
  author_id: string;
  company_id: string | null;
  content: string;
  media_urls: string[] | null;
  post_type: string | null;
  milestone_tag: string | null;
  metadata: any | null;
  created_at: string;
  updated_at: string | null;
}

export interface PostWithDetails extends Post {
  author: User;
  company: Company | null;
}

export const MILESTONE_TAGS = {
  product_launch: { label: 'Product Launch', color: 'blue' },
  revenue_milestone: { label: 'Revenue Milestone', color: 'green' },
  team_hire: { label: 'Team Hire', color: 'purple' },
  funding: { label: 'Funding Announcement', color: 'yellow' },
  feature_release: { label: 'Feature Release', color: 'cyan' },
} as const;

export type MilestoneTag = keyof typeof MILESTONE_TAGS;

// Engagement types
export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends PostComment {
  author: User;
}

export interface CompanyFollow {
  id: string;
  company_id: string;
  follower_id: string;
  firm_id: string | null;
  created_at: string;
}

export interface FollowerWithDetails extends CompanyFollow {
  follower: User;
  firm?: VCFirm;
  investor_data?: IndividualInvestor;
}

export interface PostEngagement {
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

// Extended post type with engagement data
export interface PostWithEngagement extends PostWithDetails {
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

// Firm collaboration types
export type FirmTag = 'hot' | 'pass' | 'monitoring' | 'meeting_scheduled' | 'diligence';

export const FIRM_TAGS = {
  hot: { label: 'Hot', emoji: '🔥', color: 'red' },
  pass: { label: 'Pass', emoji: '❌', color: 'gray' },
  monitoring: { label: 'Monitoring', emoji: '👀', color: 'blue' },
  meeting_scheduled: { label: 'Meeting Scheduled', emoji: '📅', color: 'green' },
  diligence: { label: 'Diligence', emoji: '📊', color: 'purple' },
} as const;

export interface FirmNote {
  id: string;
  firm_id: string;
  company_id: string;
  author_id: string;
  content: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface FirmNoteWithAuthor extends FirmNote {
  author: User;
}

export interface FirmPipelineCompany {
  company: CompanyWithFounders;
  followed_since: string;
  latest_tags: string[];
  assigned_to: User | null;
  last_activity: string | null;
  note_count: number;
}

export interface FirmActivity {
  id: string;
  firm_id: string;
  member_id: string;
  action_type: string;
  company_id: string;
  metadata: any;
  created_at: string;
}

export interface FirmActivityWithDetails extends FirmActivity {
  member: User;
  company: Company;
}

export interface FirmMemberWithUser extends FirmMember {
  user: User;
}

export interface FirmWithMembers extends VCFirm {
  members: FirmMemberWithUser[];
}

// Company Interest types
export interface CompanyInterest {
  id: string;
  company_id: string;
  investor_id: string;
  firm_id: string | null;
  message: string | null;
  created_at: string;
}

export interface InterestWithDetails extends CompanyInterest {
  investor: User;
  firm?: VCFirm;
  investor_data?: IndividualInvestor;
  firm_member_data?: FirmMember;
}

export interface InterestStats {
  total_count: number;
  individual_count: number;
  firm_count: number;
  with_message_count: number;
  recent_trend: number; // interests in last 7 days
}

export interface ExpressInterestData {
  company_id: string;
  as_firm: boolean;
  message: string | null;
}

// Notification types
export type NotificationType = 'new_interest' | 'new_follow' | 'post_like' | 'post_comment' | 'mention' | 'assignment';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  actor_id: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationWithActor extends Notification {
  actor: User | null;
}

// Company Summary types
export interface CompanySummary {
  id: string;
  company_id: string;
  summary_pitch: string;
  summary_bullets: string[];
  generated_at: string;
  updated_at: string;
}
