import { supabase } from './supabase';
import type { User } from './supabase';

export interface OnboardingProgress {
  isComplete: boolean;
  progress: number; // 0-100
  nextStep: string; // URL to redirect to
}

/**
 * Check onboarding progress for a user based on their type
 */
export async function checkOnboardingProgress(user: User): Promise<OnboardingProgress> {
  try {
    if (user.user_type === 'founder') {
      // Check if user has a company
      const { data: founderData, error: founderError } = await supabase
        .from('company_founders')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      console.log('Founder check:', { founderData, founderError, userId: user.id });

      if (founderError) {
        console.error('Error checking founder:', founderError);
      }

      if (!founderData) {
        console.log('No company found - onboarding incomplete');
        return {
          isComplete: false,
          progress: 0,
          nextStep: '/onboarding/company',
        };
      }

      // Has company - onboarding complete
      console.log('Company found - onboarding complete');
      return {
        isComplete: true,
        progress: 100,
        nextStep: '/feed',
      };
    }

    if (user.user_type === 'individual_investor') {
      // Check if user has investment thesis
      const { data: investorData, error: investorError } = await supabase
        .from('individual_investors')
        .select('investment_thesis')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      console.log('Investor check:', { investorData, investorError, userId: user.id });

      if (investorError) {
        console.error('Error checking investor:', investorError);
      }

      if (!investorData || !investorData.investment_thesis) {
        console.log('No investment thesis - onboarding incomplete');
        return {
          isComplete: false,
          progress: 0,
          nextStep: '/onboarding/investor',
        };
      }

      // Has investment thesis - onboarding complete
      console.log('Investment thesis found - onboarding complete');
      return {
        isComplete: true,
        progress: 100,
        nextStep: '/feed',
      };
    }

    if (user.user_type === 'firm_member') {
      // Check if user is part of a firm
      const { data: memberData, error: memberError } = await supabase
        .from('firm_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      // Log for debugging
      console.log('Firm member check:', { memberData, memberError, userId: user.id });

      if (memberError) {
        console.error('Error checking firm member:', memberError);
      }

      if (!memberData) {
        console.log('No firm_members record found - onboarding incomplete');
        return {
          isComplete: false,
          progress: 0,
          nextStep: '/onboarding/firm',
        };
      }

      // Part of firm - onboarding complete
      console.log('Firm member found - onboarding complete');
      return {
        isComplete: true,
        progress: 100,
        nextStep: '/feed',
      };
    }

    // Unknown user type - consider complete
    return {
      isComplete: true,
      progress: 100,
      nextStep: '/feed',
    };
  } catch (error) {
    console.error('Error checking onboarding progress:', error);
    // On error, assume incomplete
    return {
      isComplete: false,
      progress: 0,
      nextStep: '/feed',
    };
  }
}

