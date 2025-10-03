import { supabase } from './supabase';

export type FirmActionType =
  | 'followed_company'
  | 'added_note'
  | 'tagged_company'
  | 'assigned_deal'
  | 'expressed_interest'
  | 'updated_note'
  | 'removed_tag';

interface LogActivityParams {
  firmId: string;
  memberId: string;
  actionType: FirmActionType;
  companyId: string;
  metadata?: any;
}

/**
 * Log a firm activity to the database
 */
export async function logFirmActivity({
  firmId,
  memberId,
  actionType,
  companyId,
  metadata,
}: LogActivityParams) {

  const { error } = await supabase.from('firm_activity').insert({
    firm_id: firmId,
    member_id: memberId,
    action_type: actionType,
    company_id: companyId,
    metadata,
  });

  if (error) {
    console.error('Error logging firm activity:', error);
  }
}

/**
 * Specific helper functions for common activities
 */
export async function logFollowedCompany(firmId: string, memberId: string, companyId: string) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'followed_company',
    companyId,
  });
}

export async function logAddedNote(
  firmId: string,
  memberId: string,
  companyId: string,
  noteId: string,
  tags?: string[],
  assignedTo?: string | null
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'added_note',
    companyId,
    metadata: { noteId, tags, assignedTo },
  });
}

export async function logUpdatedNote(
  firmId: string,
  memberId: string,
  companyId: string,
  noteId: string,
  tags?: string[],
  assignedTo?: string | null
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'updated_note',
    companyId,
    metadata: { noteId, tags, assignedTo },
  });
}

export async function logTaggedCompany(
  firmId: string,
  memberId: string,
  companyId: string,
  tags: string[]
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'tagged_company',
    companyId,
    metadata: { tags },
  });
}

export async function logAssignedDeal(
  firmId: string,
  memberId: string,
  companyId: string,
  assigneeId: string
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'assigned_deal',
    companyId,
    metadata: { assigneeId },
  });
}

export async function logExpressedInterest(
  firmId: string,
  memberId: string,
  companyId: string,
  message?: string
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'expressed_interest',
    companyId,
    metadata: { message },
  });
}

export async function logRemovedTag(
  firmId: string,
  memberId: string,
  companyId: string,
  tag: string
) {
  return logFirmActivity({
    firmId,
    memberId,
    actionType: 'removed_tag',
    companyId,
    metadata: { tag },
  });
}

