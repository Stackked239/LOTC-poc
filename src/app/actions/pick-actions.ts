'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Condition } from '@/types/database'

// Server-side Supabase client with service role (bypasses RLS)
// Using untyped client to avoid TypeScript strict type issues
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface PickItem {
  category_id: string
  quantity: number
  condition: Condition
}

export async function completePickAction(bagId: string, picks: PickItem[]) {
  const supabase = createServiceClient()

  try {
    // Get category information for unit values
    const categoryIds = picks.map(p => p.category_id)
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, standard_value_new, standard_value_used')
      .in('id', categoryIds)

    if (categoryError) {
      console.error('Error fetching categories:', categoryError)
      return { success: false, error: 'Failed to fetch category information' }
    }

    // Type assertion for categories
    type CategoryInfo = {
      id: string
      standard_value_new: number
      standard_value_used: number
    }

    // Create pick transactions
    const transactions = picks.map(pick => {
      const category = (categories as CategoryInfo[] | null)?.find(c => c.id === pick.category_id)
      const unitValue = pick.condition === 'new'
        ? category?.standard_value_new || 0
        : category?.standard_value_used || 0

      return {
        category_id: pick.category_id,
        transaction_type: 'pick' as const,
        condition: pick.condition,
        quantity: pick.quantity,
        unit_value: unitValue,
        bag_of_hope_id: bagId,
      }
    })

    const { error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert(transactions)

    if (transactionError) {
      console.error('Error creating transactions:', transactionError)
      return { success: false, error: 'Failed to create inventory transactions' }
    }

    // Update bag status to packing
    const { error: updateError } = await supabase
      .from('bags_of_hope')
      .update({
        status: 'packing',
        picked_at: new Date().toISOString(),
      })
      .eq('id', bagId)

    if (updateError) {
      console.error('Error updating bag:', updateError)
      return { success: false, error: 'Failed to update bag status' }
    }

    // Revalidate paths to refresh data
    revalidatePath('/pick')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Error in completePickAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
