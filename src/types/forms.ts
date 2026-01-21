import { Condition, SourceType, AgeGroup, Gender, Ethnicity, PickupLocation, BagColor } from './database'

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
  // Child Information
  child_first_name: string
  child_last_name: string
  birthday: string
  child_age?: number
  child_age_group: AgeGroup
  child_gender: Gender
  ethnicity?: Ethnicity
  // Pickup/Delivery
  pickup_location: PickupLocation
  // Bag Details
  bag_embroidery_company?: string
  bag_order_number?: string
  bag_embroidery_color?: BagColor
  toiletry_bag_color?: BagColor
  toiletry_bag_labeled?: string
  // Non-Clothing Items
  toy_activity?: string
  // Clothing Items
  tops?: string
  bottoms?: string
  pajamas?: string
  underwear?: string
  diaper_pullup?: string
  shoes?: string
  coat?: string
  // Additional
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
