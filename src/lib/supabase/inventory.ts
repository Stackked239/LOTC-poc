import { createClient, createUntypedClient } from './client'
import {
  InventoryLevel,
  InventoryLevelWithCategory,
  InventoryTransaction,
  InventoryTransactionWithCategory,
  Condition,
  SourceType,
} from '@/types/database'
import { IntakeFormData, InventoryFilters } from '@/types/forms'

export async function getInventoryLevels(
  filters?: InventoryFilters
): Promise<InventoryLevelWithCategory[]> {
  const supabase = createClient()

  let query = supabase
    .from('inventory_levels')
    .select(`
      *,
      categories (*)
    `)
    .order('categories(display_order)', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inventory levels:', error)
    throw error
  }

  let results = (data || []) as InventoryLevelWithCategory[]

  // Apply client-side filters
  if (filters?.age_group) {
    results = results.filter((item) => item.categories.age_group === filters.age_group)
  }

  if (filters?.gender) {
    results = results.filter((item) => item.categories.gender === filters.gender)
  }

  if (filters?.item_type) {
    results = results.filter((item) => item.categories.item_type === filters.item_type)
  }

  if (filters?.below_reorder) {
    results = results.filter(
      (item) => item.quantity_on_hand < item.categories.reorder_point
    )
  }

  if (filters?.out_of_stock) {
    results = results.filter((item) => item.quantity_on_hand <= 0)
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    results = results.filter((item) =>
      item.categories.name.toLowerCase().includes(searchLower)
    )
  }

  return results
}

export async function getInventoryLevelByCategory(
  categoryId: string
): Promise<InventoryLevelWithCategory | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventory_levels')
    .select(`
      *,
      categories (*)
    `)
    .eq('category_id', categoryId)
    .single()

  if (error) {
    console.error('Error fetching inventory level:', error)
    return null
  }

  return data as InventoryLevelWithCategory
}

export async function createIntakeTransaction(
  formData: IntakeFormData
): Promise<InventoryTransaction> {
  const untypedSupabase = createUntypedClient()

  // First, get the category to calculate unit value
  const { data: category, error: categoryError } = await untypedSupabase
    .from('categories')
    .select('standard_value_new, standard_value_used')
    .eq('id', formData.category_id)
    .single()

  if (categoryError || !category) {
    throw new Error('Category not found')
  }

  const cat = category as { standard_value_new: number; standard_value_used: number }
  const unitValue =
    formData.condition === 'new'
      ? cat.standard_value_new
      : cat.standard_value_used

  const transaction = {
    category_id: formData.category_id,
    transaction_type: 'intake',
    source_type: formData.source_type,
    condition: formData.condition,
    quantity: formData.quantity,
    unit_value: unitValue,
    notes: formData.notes || null,
    receipt_reference: formData.receipt_reference || null,
  }

  const { data, error } = await untypedSupabase
    .from('inventory_transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) {
    console.error('Error creating intake transaction:', error)
    throw error
  }

  return data as InventoryTransaction
}

export async function createPickTransaction(
  categoryId: string,
  bagOfHopeId: string,
  quantity: number,
  condition: Condition
): Promise<InventoryTransaction> {
  const untypedSupabase = createUntypedClient()

  // Get unit value from category
  const { data: category, error: categoryError } = await untypedSupabase
    .from('categories')
    .select('standard_value_new, standard_value_used')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    throw new Error('Category not found')
  }

  const cat = category as { standard_value_new: number; standard_value_used: number }
  const unitValue =
    condition === 'new' ? cat.standard_value_new : cat.standard_value_used

  const transaction = {
    category_id: categoryId,
    transaction_type: 'pick',
    condition: condition,
    quantity: quantity,
    unit_value: unitValue,
    bag_of_hope_id: bagOfHopeId,
  }

  const { data, error } = await untypedSupabase
    .from('inventory_transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) {
    console.error('Error creating pick transaction:', error)
    throw error
  }

  return data as InventoryTransaction
}

export async function getRecentTransactions(
  limit: number = 20
): Promise<InventoryTransactionWithCategory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      categories (*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent transactions:', error)
    throw error
  }

  return (data || []) as InventoryTransactionWithCategory[]
}

export async function getReorderAlerts(): Promise<InventoryLevelWithCategory[]> {
  const levels = await getInventoryLevels()
  return levels.filter(
    (level) =>
      level.categories.is_active &&
      level.quantity_on_hand < level.categories.reorder_point
  )
}

export async function getInventoryStats() {
  const levels = await getInventoryLevels()

  const totalItems = levels.reduce((sum, level) => sum + level.quantity_on_hand, 0)
  const totalValue = levels.reduce((sum, level) => sum + (level.total_value || 0), 0)
  const belowReorder = levels.filter(
    (level) =>
      level.categories.is_active &&
      level.quantity_on_hand < level.categories.reorder_point
  ).length
  const outOfStock = levels.filter(
    (level) => level.categories.is_active && level.quantity_on_hand <= 0
  ).length

  return {
    totalItems,
    totalValue,
    belowReorder,
    outOfStock,
  }
}

export async function getTodayStats() {
  const supabase = createUntypedClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: transactions, error } = await supabase
    .from('inventory_transactions')
    .select('transaction_type, quantity')
    .gte('created_at', today.toISOString())

  if (error) {
    console.error('Error fetching today stats:', error)
    return { itemsIntake: 0, itemsPicked: 0 }
  }

  type TxSummary = { transaction_type: string; quantity: number }
  const txList = (transactions || []) as TxSummary[]

  const itemsIntake = txList
    .filter((t) => t.transaction_type === 'intake')
    .reduce((sum, t) => sum + t.quantity, 0)

  const itemsPicked = txList
    .filter((t) => t.transaction_type === 'pick')
    .reduce((sum, t) => sum + t.quantity, 0)

  return { itemsIntake, itemsPicked }
}
