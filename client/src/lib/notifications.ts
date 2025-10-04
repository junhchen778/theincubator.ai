import { supabase } from './supabase';
import { NotificationType } from './types';

export async function createNotification(data: {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actor_id?: string;
  related_id?: string;
}) {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        body: data.body || null,
        link: data.link || null,
        actor_id: data.actor_id || null,
        related_id: data.related_id || null,
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper to create interest notification for all founders
export async function notifyFoundersOfInterest(
  companyId: string,
  investorId: string,
  investorName: string,
  firmName?: string,
  message?: string
) {
  try {
    // Get all founders of the company
    const { data: founders } = await supabase
      .from('company_founders')
      .select('user_id')
      .eq('company_id', companyId);

    if (!founders || founders.length === 0) return;

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || 'your company';
    const displayName = firmName || investorName;

    // Create notification for each founder
    const notifications = founders.map(founder => ({
      user_id: founder.user_id,
      type: 'new_interest' as NotificationType,
      title: `${displayName} expressed interest!`,
      body: message || `${displayName} is interested in ${companyName}`,
      link: `/company/${companyId}/interests`,
      actor_id: investorId,
      related_id: companyId,
    }));

    const { error } = await (supabase as any)
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating founder notifications:', error);
    }
  } catch (error) {
    console.error('Error notifying founders:', error);
  }
}

// Helper to create follow notification for founders
export async function notifyFoundersOfFollow(
  companyId: string,
  followerId: string,
  followerName: string,
  firmName?: string
) {
  try {
    // Get all founders of the company
    const { data: founders } = await supabase
      .from('company_founders')
      .select('user_id')
      .eq('company_id', companyId);

    if (!founders || founders.length === 0) return;

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || 'your company';
    const displayName = firmName || followerName;

    // Create notification for each founder
    const notifications = founders.map(founder => ({
      user_id: founder.user_id,
      type: 'new_follow' as NotificationType,
      title: `${displayName} is now following!`,
      body: `${displayName} started following ${companyName}`,
      link: `/company/${companyId}/followers`,
      actor_id: followerId,
      related_id: companyId,
    }));

    const { error } = await (supabase as any)
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating follow notifications:', error);
    }
  } catch (error) {
    console.error('Error notifying founders of follow:', error);
  }
}

// Helper to create like notification
export async function notifyOfPostLike(
  postId: string,
  postAuthorId: string,
  likerId: string,
  likerName: string
) {
  try {
    // Don't notify if user likes their own post
    if (postAuthorId === likerId) return;

    await createNotification({
      user_id: postAuthorId,
      type: 'post_like',
      title: `${likerName} liked your post`,
      body: 'Someone appreciated your update!',
      link: `/feed?post=${postId}`,
      actor_id: likerId,
      related_id: postId,
    });
  } catch (error) {
    console.error('Error notifying of like:', error);
  }
}

// Helper to create comment notification
export async function notifyOfPostComment(
  postId: string,
  postAuthorId: string,
  commenterId: string,
  commenterName: string,
  commentText: string
) {
  try {
    // Don't notify if user comments on their own post
    if (postAuthorId === commenterId) return;

    await createNotification({
      user_id: postAuthorId,
      type: 'post_comment',
      title: `${commenterName} commented on your post`,
      body: commentText.length > 100 ? commentText.slice(0, 100) + '...' : commentText,
      link: `/feed?post=${postId}`,
      actor_id: commenterId,
      related_id: postId,
    });
  } catch (error) {
    console.error('Error notifying of comment:', error);
  }
}

