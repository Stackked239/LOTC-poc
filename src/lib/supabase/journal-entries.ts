import { createClient, createUntypedClient } from './client'
import {
  JournalEntry,
  JournalEntryUpdate,
  JournalEntryStatus,
  JournalEntryType,
} from '@/types/database'
import { JournalEntryFilters } from '@/types/forms'

export async function getJournalEntries(
  filters?: JournalEntryFilters
): Promise<JournalEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.start_date) {
    query = query.gte('entry_date', filters.start_date.toISOString().split('T')[0])
  }

  if (filters?.end_date) {
    query = query.lte('entry_date', filters.end_date.toISOString().split('T')[0])
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.entry_type) {
    query = query.eq('entry_type', filters.entry_type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching journal entries:', error)
    throw error
  }

  return data || []
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching journal entry:', error)
    return null
  }

  return data
}

export async function approveJournalEntries(ids: string[]): Promise<void> {
  const supabase = createUntypedClient()

  const { error } = await supabase
    .from('journal_entries')
    .update({ status: 'approved' })
    .in('id', ids)

  if (error) {
    console.error('Error approving journal entries:', error)
    throw error
  }
}

export async function markEntriesAsExported(ids: string[]): Promise<void> {
  const supabase = createUntypedClient()

  const { error } = await supabase
    .from('journal_entries')
    .update({
      status: 'exported',
      exported_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    console.error('Error marking entries as exported:', error)
    throw error
  }
}

export async function updateJournalEntry(
  id: string,
  updates: JournalEntryUpdate
): Promise<JournalEntry> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating journal entry:', error)
    throw error
  }

  return data
}

export function exportJournalEntriesToCSV(entries: JournalEntry[]): string {
  const headers = ['Date', 'Transaction Type', 'Debit Account', 'Credit Account', 'Amount', 'Memo']
  const rows = entries.map((entry) => [
    entry.entry_date,
    'Journal Entry',
    entry.debit_account,
    entry.credit_account,
    entry.amount.toFixed(2),
    `"${(entry.description || '').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

export async function getJournalEntrySummary(
  filters?: JournalEntryFilters
): Promise<{
  total: number
  totalAmount: number
  byType: Record<JournalEntryType, { count: number; amount: number }>
  byStatus: Record<JournalEntryStatus, number>
}> {
  const entries = await getJournalEntries(filters)

  const byType: Record<JournalEntryType, { count: number; amount: number }> = {
    in_kind_donation: { count: 0, amount: 0 },
    purchase_expense: { count: 0, amount: 0 },
    inventory_out: { count: 0, amount: 0 },
  }

  const byStatus: Record<JournalEntryStatus, number> = {
    draft: 0,
    approved: 0,
    exported: 0,
  }

  let totalAmount = 0

  for (const entry of entries) {
    totalAmount += entry.amount
    byType[entry.entry_type].count++
    byType[entry.entry_type].amount += entry.amount
    byStatus[entry.status]++
  }

  return {
    total: entries.length,
    totalAmount,
    byType,
    byStatus,
  }
}

export const ENTRY_TYPE_LABELS: Record<JournalEntryType, string> = {
  in_kind_donation: 'In-Kind Donation',
  purchase_expense: 'Purchase Expense',
  inventory_out: 'Inventory Out',
}

export const ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  exported: 'Exported',
}
