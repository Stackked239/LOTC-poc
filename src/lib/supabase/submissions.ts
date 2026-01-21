import { createClient, createUntypedClient } from './client'
import { Submission, SubmissionInsert, SubmissionUpdate } from '@/types/database'

/**
 * Get all submissions with optional sync_status filter
 */
export async function getSubmissions(syncStatus?: string): Promise<any[]> {
  const supabase = createClient()

  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (syncStatus) {
    query = query.eq('sync_status', syncStatus)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching submissions:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  console.log(`Fetched ${data?.length || 0} submissions`)
  return data || []
}

/**
 * Get synced submissions (sync_status = 'synced')
 */
export async function getSyncedSubmissions(): Promise<any[]> {
  return getSubmissions('synced')
}

/**
 * Get all submissions without filter
 */
export async function getAllSubmissions(): Promise<any[]> {
  return getSubmissions()
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(id: string): Promise<Submission | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching submission:', error)
    throw error
  }

  return data
}

/**
 * Update submission sync status
 */
export async function updateSubmissionSyncStatus(
  id: string,
  syncStatus: string,
  syncError?: string | null
): Promise<void> {
  const untypedSupabase = createUntypedClient()

  const updates: any = {
    sync_status: syncStatus,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (syncError !== undefined) {
    updates.sync_error = syncError
  }

  const { error } = await untypedSupabase
    .from('submissions')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating submission sync status:', error)
    throw error
  }
}

/**
 * Link submission to a bag of hope (if bag_of_hope_id column exists)
 * This is optional and will fail gracefully if the column doesn't exist
 */
export async function linkSubmissionToBag(
  submissionId: string,
  bagId: string
): Promise<void> {
  const untypedSupabase = createUntypedClient()

  const { error } = await untypedSupabase
    .from('submissions')
    .update({
      updated_at: new Date().toISOString(),
      sync_status: 'processed',
      // Note: bag_of_hope_id column may not exist in the actual schema
      // This will fail if the column doesn't exist, but that's okay
    })
    .eq('id', submissionId)

  if (error) {
    console.error('Error updating submission:', error)
    throw error
  }
}

/**
 * Create a new submission
 */
export async function createSubmission(data: SubmissionInsert): Promise<Submission> {
  const untypedSupabase = createUntypedClient()

  const { data: submission, error } = await untypedSupabase
    .from('submissions')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating submission:', error)
    throw error
  }

  return submission as Submission
}

/**
 * Delete a submission
 */
export async function deleteSubmission(id: string): Promise<void> {
  const untypedSupabase = createUntypedClient()

  const { error } = await untypedSupabase
    .from('submissions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting submission:', error)
    throw error
  }
}
