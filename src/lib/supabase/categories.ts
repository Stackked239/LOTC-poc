import { createClient, createUntypedClient } from './client'
import { Category, CategoryInsert, CategoryUpdate, AgeGroup, Gender } from '@/types/database'

export interface CategoryFilters {
  age_group?: AgeGroup | AgeGroup[]
  gender?: Gender | Gender[]
  item_type?: string
  is_active?: boolean
}

export async function getCategories(filters?: CategoryFilters): Promise<Category[]> {
  const supabase = createClient()

  let query = supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  } else {
    // Default to active only
    query = query.eq('is_active', true)
  }

  if (filters?.age_group) {
    if (Array.isArray(filters.age_group)) {
      query = query.in('age_group', filters.age_group)
    } else {
      query = query.eq('age_group', filters.age_group)
    }
  }

  if (filters?.gender) {
    if (Array.isArray(filters.gender)) {
      query = query.in('gender', filters.gender)
    } else {
      query = query.eq('gender', filters.gender)
    }
  }

  if (filters?.item_type) {
    query = query.eq('item_type', filters.item_type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  return data || []
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

export async function createCategory(category: CategoryInsert): Promise<Category> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw error
  }

  return data as Category
}

export async function updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw error
  }

  return data as Category
}

export async function deactivateCategory(id: string): Promise<void> {
  const supabase = createUntypedClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating category:', error)
    throw error
  }
}

export function getCategoriesForChild(
  categories: Category[],
  ageGroup: AgeGroup,
  gender: Gender
): Category[] {
  return categories.filter(
    (cat) =>
      (cat.age_group === ageGroup || cat.age_group === 'neutral') &&
      (cat.gender === gender || cat.gender === 'neutral')
  )
}

export function groupCategoriesByType(categories: Category[]): Record<string, Category[]> {
  return categories.reduce((acc, category) => {
    const type = category.item_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(category)
    return acc
  }, {} as Record<string, Category[]>)
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  baby: 'Baby (0-2)',
  toddler: 'Toddler (3-6)',
  school_age: 'School Age (7-11)',
  teen: 'Teen (12+)',
  neutral: 'All Ages',
}

export const GENDER_LABELS: Record<Gender, string> = {
  boy: 'Boy',
  girl: 'Girl',
  neutral: 'Neutral',
}
