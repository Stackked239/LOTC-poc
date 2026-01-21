import { createClient, createUntypedClient } from './client'
import { Submission, SubmissionInsert, SubmissionUpdate, SubmissionStatus } from '@/types/database'

/**
 * Get all submissions with optional status filter
 */
export async function getSubmissions(status?: SubmissionStatus): Promise<Submission[]> {
  const supabase = createClient()

  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }

  return data || []
}

/**
 * Get pending submissions (status = 'pending')
 */
export async function getPendingSubmissions(): Promise<Submission[]> {
  return getSubmissions('pending')
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
 * Update submission status
 */
export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  processedBy?: string
): Promise<void> {
  const untypedSupabase = createUntypedClient()

  const updates: any = {
    status,
    processed_at: status === 'processing' || status === 'completed' ? new Date().toISOString() : null,
  }

  if (processedBy) {
    updates.processed_by = processedBy
  }

  const { error } = await untypedSupabase
    .from('submissions')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating submission status:', error)
    throw error
  }
}

/**
 * Link submission to a bag of hope
 */
export async function linkSubmissionToBag(
  submissionId: string,
  bagId: string
): Promise<void> {
  const untypedSupabase = createUntypedClient()

  const { error } = await untypedSupabase
    .from('submissions')
    .update({
      bag_of_hope_id: bagId,
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) {
    console.error('Error linking submission to bag:', error)
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
