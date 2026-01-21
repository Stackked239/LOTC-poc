export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AgeGroup = 'baby' | 'toddler' | 'school_age' | 'teen' | 'neutral'
export type Gender = 'boy' | 'girl' | 'neutral'
export type ItemType = 'tops' | 'bottoms' | 'sleepwear' | 'shoes' | 'toiletries' | 'toys' | 'books' | 'bedding' | 'undergarments' | 'socks'
export type Ethnicity = 'hispanic_latino' | 'white' | 'black_african_american' | 'asian' | 'native_american' | 'pacific_islander' | 'other' | 'prefer_not_to_say'
export type PickupLocation = 'main_office' | 'community_center' | 'church' | 'home_delivery' | 'other'
export type BagColor = 'red' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'black' | 'white' | 'multicolor'
export type TransactionType = 'intake' | 'pick' | 'adjustment' | 'thrift_out' | 'disposal'
export type SourceType = 'donation' | 'purchase' | 'transfer'
export type Condition = 'new' | 'used'
// Fulfillment workflow: pending -> picking -> packing -> ready_to_ship -> in_transit -> ready_for_pickup -> delivered
export type BagStatus =
  | 'pending'           // Request created, waiting to be picked
  | 'picking'           // Currently being picked
  | 'packing'           // Items picked, being packed
  | 'ready_to_ship'     // Packed and ready to ship
  | 'in_transit'        // Shipped, in transit
  | 'ready_for_pickup'  // At destination, ready for pickup
  | 'delivered'         // Delivered to recipient
  | 'cancelled'         // Cancelled

export type FulfillmentStage = 'pick' | 'pack' | 'ship'

export const BAG_STATUS_LABELS: Record<BagStatus, string> = {
  pending: 'Pending',
  picking: 'Picking',
  packing: 'Packing',
  ready_to_ship: 'Ready to Ship',
  in_transit: 'In Transit',
  ready_for_pickup: 'Ready for Pickup',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const FULFILLMENT_STAGE_STATUSES: Record<FulfillmentStage, BagStatus[]> = {
  pick: ['pending', 'picking'],
  pack: ['packing'],
  ship: ['ready_to_ship', 'in_transit', 'ready_for_pickup', 'delivered'],
}

// Shipping batch types
export type BatchStatus = 'open' | 'ready_to_ship' | 'in_transit' | 'ready_for_pickup' | 'delivered' | 'cancelled'

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  open: 'Open',
  ready_to_ship: 'Ready to Ship',
  in_transit: 'In Transit',
  ready_for_pickup: 'Ready for Pickup',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Submission types
export type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
export type JournalEntryType = 'in_kind_donation' | 'purchase_expense' | 'inventory_out'
export type JournalEntryStatus = 'draft' | 'approved' | 'exported'
export type StaffRole = 'admin' | 'staff' | 'volunteer'

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          age_group: AgeGroup
          gender: Gender
          item_type: string
          standard_value_new: number
          standard_value_used: number
          reorder_point: number
          display_order: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          age_group: AgeGroup
          gender: Gender
          item_type: string
          standard_value_new?: number
          reorder_point?: number
          display_order?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age_group?: AgeGroup
          gender?: Gender
          item_type?: string
          standard_value_new?: number
          reorder_point?: number
          display_order?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          category_id: string
          transaction_type: TransactionType
          source_type: SourceType | null
          condition: Condition | null
          quantity: number
          unit_value: number | null
          total_value: number | null
          notes: string | null
          bag_of_hope_id: string | null
          receipt_reference: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          transaction_type: TransactionType
          source_type?: SourceType | null
          condition?: Condition | null
          quantity: number
          unit_value?: number | null
          notes?: string | null
          bag_of_hope_id?: string | null
          receipt_reference?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          transaction_type?: TransactionType
          source_type?: SourceType | null
          condition?: Condition | null
          quantity?: number
          unit_value?: number | null
          notes?: string | null
          bag_of_hope_id?: string | null
          receipt_reference?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      inventory_levels: {
        Row: {
          id: string
          category_id: string
          quantity_on_hand: number
          quantity_new: number
          quantity_used: number
          total_value: number
          last_intake_date: string | null
          last_pick_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          quantity_on_hand?: number
          quantity_new?: number
          quantity_used?: number
          total_value?: number
          last_intake_date?: string | null
          last_pick_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          quantity_on_hand?: number
          quantity_new?: number
          quantity_used?: number
          total_value?: number
          last_intake_date?: string | null
          last_pick_date?: string | null
          updated_at?: string
        }
      }
      bags_of_hope: {
        Row: {
          id: string
          request_id: string | null
          // Child Information
          child_first_name: string | null
          child_last_name: string | null
          birthday: string | null
          child_age: number | null
          child_age_group: string
          child_gender: string
          ethnicity: string | null
          // Pickup/Delivery
          pickup_location: string | null
          recipient_name: string | null
          recipient_phone: string | null
          delivery_address: string | null
          delivery_notes: string | null
          // Bag Details
          bag_embroidery_company: string | null
          bag_order_number: string | null
          bag_embroidery_color: string | null
          toiletry_bag_color: string | null
          toiletry_bag_labeled: string | null
          // Non-Clothing Items
          toy_activity: string | null
          // Clothing Items
          tops: string | null
          bottoms: string | null
          pajamas: string | null
          underwear: string | null
          diaper_pullup: string | null
          shoes: string | null
          coat: string | null
          // Status and tracking
          status: BagStatus
          notes: string | null
          packed_by: string | null
          packed_at: string | null
          picked_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          tracking_number: string | null
          shipping_carrier: string | null
          batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          // Child Information
          child_first_name?: string | null
          child_last_name?: string | null
          birthday?: string | null
          child_age?: number | null
          child_age_group: string
          child_gender: string
          ethnicity?: string | null
          // Pickup/Delivery
          pickup_location?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          // Bag Details
          bag_embroidery_company?: string | null
          bag_order_number?: string | null
          bag_embroidery_color?: string | null
          toiletry_bag_color?: string | null
          toiletry_bag_labeled?: string | null
          // Non-Clothing Items
          toy_activity?: string | null
          // Clothing Items
          tops?: string | null
          bottoms?: string | null
          pajamas?: string | null
          underwear?: string | null
          diaper_pullup?: string | null
          shoes?: string | null
          coat?: string | null
          // Status and tracking
          status?: BagStatus
          notes?: string | null
          packed_by?: string | null
          packed_at?: string | null
          picked_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          tracking_number?: string | null
          shipping_carrier?: string | null
          batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          // Child Information
          child_first_name?: string | null
          child_last_name?: string | null
          birthday?: string | null
          child_age?: number | null
          child_age_group?: string
          child_gender?: string
          ethnicity?: string | null
          // Pickup/Delivery
          pickup_location?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          // Bag Details
          bag_embroidery_company?: string | null
          bag_order_number?: string | null
          bag_embroidery_color?: string | null
          toiletry_bag_color?: string | null
          toiletry_bag_labeled?: string | null
          // Non-Clothing Items
          toy_activity?: string | null
          // Clothing Items
          tops?: string | null
          bottoms?: string | null
          pajamas?: string | null
          underwear?: string | null
          diaper_pullup?: string | null
          shoes?: string | null
          coat?: string | null
          // Status and tracking
          status?: BagStatus
          notes?: string | null
          packed_by?: string | null
          packed_at?: string | null
          picked_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          tracking_number?: string | null
          shipping_carrier?: string | null
          batch_id?: string | null
          created_at?: string
        }
      }
      shipping_batches: {
        Row: {
          id: string
          batch_number: string
          status: BatchStatus
          courier_name: string | null
          tracking_number: string | null
          notes: string | null
          scheduled_pickup_at: string | null
          picked_up_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          batch_number?: string
          status?: BatchStatus
          courier_name?: string | null
          tracking_number?: string | null
          notes?: string | null
          scheduled_pickup_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          batch_number?: string
          status?: BatchStatus
          courier_name?: string | null
          tracking_number?: string | null
          notes?: string | null
          scheduled_pickup_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          child_first_name: string
          child_last_name: string
          birthday: string
          child_gender: string
          ethnicity: string | null
          pickup_location: string
          clothing_needs: string | null
          toy_preferences: string | null
          special_notes: string | null
          caregiver_name: string | null
          caregiver_phone: string | null
          caregiver_email: string | null
          status: SubmissionStatus
          processed_by: string | null
          processed_at: string | null
          bag_of_hope_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          child_first_name: string
          child_last_name: string
          birthday: string
          child_gender: string
          ethnicity?: string | null
          pickup_location: string
          clothing_needs?: string | null
          toy_preferences?: string | null
          special_notes?: string | null
          caregiver_name?: string | null
          caregiver_phone?: string | null
          caregiver_email?: string | null
          status?: SubmissionStatus
          processed_by?: string | null
          processed_at?: string | null
          bag_of_hope_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          child_first_name?: string
          child_last_name?: string
          birthday?: string
          child_gender?: string
          ethnicity?: string | null
          pickup_location?: string
          clothing_needs?: string | null
          toy_preferences?: string | null
          special_notes?: string | null
          caregiver_name?: string | null
          caregiver_phone?: string | null
          caregiver_email?: string | null
          status?: SubmissionStatus
          processed_by?: string | null
          processed_at?: string | null
          bag_of_hope_id?: string | null
          created_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          entry_date: string
          entry_type: JournalEntryType
          debit_account: string
          credit_account: string
          amount: number
          description: string | null
          source_transaction_id: string | null
          status: JournalEntryStatus
          exported_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entry_date?: string
          entry_type: JournalEntryType
          debit_account: string
          credit_account: string
          amount: number
          description?: string | null
          source_transaction_id?: string | null
          status?: JournalEntryStatus
          exported_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entry_date?: string
          entry_type?: JournalEntryType
          debit_account?: string
          credit_account?: string
          amount?: number
          description?: string | null
          source_transaction_id?: string | null
          status?: JournalEntryStatus
          exported_at?: string | null
          created_at?: string
        }
      }
      staff_profiles: {
        Row: {
          id: string
          full_name: string
          role: StaffRole
          can_intake: boolean
          can_pick: boolean
          can_approve_journal_entries: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: StaffRole
          can_intake?: boolean
          can_pick?: boolean
          can_approve_journal_entries?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: StaffRole
          can_intake?: boolean
          can_pick?: boolean
          can_approve_journal_entries?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row']
export type InventoryTransactionInsert = Database['public']['Tables']['inventory_transactions']['Insert']
export type InventoryTransactionUpdate = Database['public']['Tables']['inventory_transactions']['Update']

export type InventoryLevel = Database['public']['Tables']['inventory_levels']['Row']
export type InventoryLevelInsert = Database['public']['Tables']['inventory_levels']['Insert']
export type InventoryLevelUpdate = Database['public']['Tables']['inventory_levels']['Update']

export type BagOfHope = Database['public']['Tables']['bags_of_hope']['Row']
export type BagOfHopeInsert = Database['public']['Tables']['bags_of_hope']['Insert']
export type BagOfHopeUpdate = Database['public']['Tables']['bags_of_hope']['Update']

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert']
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update']

export type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']
export type StaffProfileInsert = Database['public']['Tables']['staff_profiles']['Insert']
export type StaffProfileUpdate = Database['public']['Tables']['staff_profiles']['Update']

// Extended types with joins
export type InventoryLevelWithCategory = InventoryLevel & {
  categories: Category
}

export type InventoryTransactionWithCategory = InventoryTransaction & {
  categories: Category
}

export type JournalEntryWithTransaction = JournalEntry & {
  inventory_transactions?: InventoryTransaction
}

export type ShippingBatch = Database['public']['Tables']['shipping_batches']['Row']
export type ShippingBatchInsert = Database['public']['Tables']['shipping_batches']['Insert']
export type ShippingBatchUpdate = Database['public']['Tables']['shipping_batches']['Update']

export type ShippingBatchWithBags = ShippingBatch & {
  bags: BagOfHope[]
}

export type Submission = Database['public']['Tables']['submissions']['Row']
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']
