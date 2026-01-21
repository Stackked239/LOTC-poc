import { Condition, SourceType, AgeGroup, Gender } from './database'

export interface IntakeFormData {
  category_id: string
  quantity: number
  source_type: SourceType
  condition: Condition
  notes?: string
  receipt_reference?: string // only for purchases
}

export interface PickItem {
  category_id: string
  quantity: number
  condition: Condition
}

export interface PickListFormData {
  bag_of_hope_id: string
  picks: PickItem[]
}

export interface CreateBagOfHopeData {
  child_age_group: AgeGroup
  child_gender: Gender
  request_id?: string
  notes?: string
}

export interface CategoryFormData {
  name: string
  age_group: AgeGroup
  gender: Gender
  item_type: string
  standard_value_new: number
  reorder_point: number
  display_order?: number
  is_active?: boolean
}

export interface JournalEntryFilters {
  start_date?: Date
  end_date?: Date
  status?: 'draft' | 'approved' | 'exported'
  entry_type?: 'in_kind_donation' | 'purchase_expense' | 'inventory_out'
}

export interface InventoryFilters {
  age_group?: AgeGroup
  gender?: Gender
  item_type?: string
  below_reorder?: boolean
  out_of_stock?: boolean
  search?: string
}

export interface SessionIntakeSummary {
  totalItems: number
  totalValue: number
  transactions: Array<{
    categoryName: string
    quantity: number
    condition: Condition
    value: number
  }>
}
