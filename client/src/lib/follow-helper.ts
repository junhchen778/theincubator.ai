import { supabase } from './supabase';

/**
 * Follow a company
 * @param companyId - The company to follow
 * @param userId - The user following
 * @param firmId - Optional firm ID if following as firm
 * @returns Success status and error if any
 */
export async function followCompany(
  companyId: string,
  userId: string,
  firmId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if following as firm
    if (firmId) {
      // Check if firm already follows this company
      const { data: existingFirmFollow } = await supabase
        .from('company_follows')
        .select('id')
        .eq('company_id', companyId)
        .eq('firm_id', firmId)
        .maybeSingle();

      if (existingFirmFollow) {
        return { success: false, error: 'Your firm is already following this company' };
      }
    } else {
      // Check if user already follows personally
      const { data: existingFollow } = await supabase
        .from('company_follows')
        .select('id')
        .eq('company_id', companyId)
        .eq('follower_id', userId)
        .is('firm_id', null)
        .maybeSingle();

      if (existingFollow) {
        return { success: false, error: 'You are already following this company' };
      }
    }

    // Insert follow
    const { error } = await supabase
      .from('company_follows')
      .insert({
        company_id: companyId,
        follower_id: userId,
        firm_id: firmId,
      });

    if (error) throw error;

    // Log firm activity if following as firm
    if (firmId) {
      await supabase.from('firm_activity').insert({
        firm_id: firmId,
        member_id: userId,
        action_type: 'followed_company',
        company_id: companyId,
        metadata: {},
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error following company:', error);
    return { success: false, error: 'Failed to follow company' };
  }
}

/**
 * Check if user or their firm is following a company
 */
export async function checkFollowStatus(
  companyId: string,
  userId: string,
  firmId: string | null = null
): Promise<{
  isFollowing: boolean;
  followAsFirm: boolean;
  firmAlreadyFollows: boolean;
}> {
  try {
    // Check user's personal follow
    const { data: personalFollow } = await supabase
      .from('company_follows')
      .select('*')
      .eq('company_id', companyId)
      .eq('follower_id', userId)
      .maybeSingle();

    // Check if firm is following (by any member)
    let firmFollow = null;
    if (firmId) {
      const { data } = await supabase
        .from('company_follows')
        .select('*')
        .eq('company_id', companyId)
        .eq('firm_id', firmId)
        .maybeSingle();
      firmFollow = data;
    }

    return {
      isFollowing: !!(personalFollow || firmFollow),
      followAsFirm: !!(personalFollow?.firm_id || firmFollow),
      firmAlreadyFollows: !!firmFollow,
    };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return {
      isFollowing: false,
      followAsFirm: false,
      firmAlreadyFollows: false,
    };
  }
}

/**
 * Unfollow a company
 */
export async function unfollowCompany(
  companyId: string,
  userId: string,
  firmId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    // If firmId is provided, prioritize checking for firm follow first
    // This allows ANY firm member to unfollow a firm follow
    if (firmId) {
      const { data: firmFollowData } = await supabase
        .from('company_follows')
        .select('id')
        .eq('company_id', companyId)
        .eq('firm_id', firmId)
        .maybeSingle();

      if (firmFollowData) {
        // Delete the firm follow
        const { error } = await supabase
          .from('company_follows')
          .delete()
          .eq('company_id', companyId)
          .eq('firm_id', firmId);

        if (error) throw error;
        return { success: true };
      }
    }

    // Otherwise, try to unfollow personal follow
    const { data: personalFollowData } = await supabase
      .from('company_follows')
      .select('id')
      .eq('company_id', companyId)
      .eq('follower_id', userId)
      .is('firm_id', null)
      .maybeSingle();

    if (personalFollowData) {
      const { error } = await supabase
        .from('company_follows')
        .delete()
        .eq('company_id', companyId)
        .eq('follower_id', userId)
        .is('firm_id', null);

      if (error) throw error;
      return { success: true };
    }

    return { success: false, error: 'Not following this company' };
  } catch (error) {
    console.error('Error unfollowing company:', error);
    return { success: false, error: 'Failed to unfollow company' };
  }
}

