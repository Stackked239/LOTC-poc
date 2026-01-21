import { createClient, createUntypedClient } from './client'
import {
  BagOfHope,
  BagStatus,
  FulfillmentStage,
  FULFILLMENT_STAGE_STATUSES,
} from '@/types/database'
import { CreateBagOfHopeData, PickItem } from '@/types/forms'
import { createPickTransaction } from './inventory'

// Status transition map: what status can transition to what
const STATUS_TRANSITIONS: Record<BagStatus, BagStatus[]> = {
  pending: ['picking', 'cancelled'],
  picking: ['packing', 'pending', 'cancelled'],
  packing: ['ready_to_ship', 'picking', 'cancelled'],
  ready_to_ship: ['in_transit', 'packing', 'cancelled'],
  in_transit: ['ready_for_pickup', 'delivered', 'ready_to_ship'],
  ready_for_pickup: ['delivered', 'in_transit'],
  delivered: [],
  cancelled: ['pending'],
}

export async function getBagsOfHope(
  status?: BagStatus | BagStatus[]
): Promise<BagOfHope[]> {
  const supabase = createClient()

  let query = supabase
    .from('bags_of_hope')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bags of hope:', error)
    throw error
  }

  return (data || []) as BagOfHope[]
}

export async function getBagOfHopeById(id: string): Promise<BagOfHope | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching bag of hope:', error)
    return null
  }

  return data as BagOfHope
}

export async function createBagOfHope(
  formData: CreateBagOfHopeData
): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  const bag = {
    // Child Information
    child_first_name: formData.child_first_name,
    child_last_name: formData.child_last_name,
    birthday: formData.birthday,
    child_age: formData.child_age || null,
    child_age_group: formData.child_age_group,
    child_gender: formData.child_gender,
    ethnicity: formData.ethnicity || null,
    // Pickup/Delivery
    pickup_location: formData.pickup_location,
    // Bag Details
    bag_embroidery_company: formData.bag_embroidery_company || null,
    bag_order_number: formData.bag_order_number || null,
    bag_embroidery_color: formData.bag_embroidery_color || null,
    toiletry_bag_color: formData.toiletry_bag_color || null,
    toiletry_bag_labeled: formData.toiletry_bag_labeled || null,
    // Non-Clothing Items
    toy_activity: formData.toy_activity || null,
    // Clothing Items
    tops: formData.tops || null,
    bottoms: formData.bottoms || null,
    pajamas: formData.pajamas || null,
    underwear: formData.underwear || null,
    diaper_pullup: formData.diaper_pullup || null,
    shoes: formData.shoes || null,
    coat: formData.coat || null,
    // Additional
    request_id: formData.request_id || null,
    notes: formData.notes || null,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('bags_of_hope')
    .insert(bag)
    .select()
    .single()

  if (error) {
    console.error('Error creating bag of hope:', error)
    throw error
  }

  return data as BagOfHope
}

export async function updateBagOfHope(
  id: string,
  updates: Partial<BagOfHope>
): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating bag of hope:', error)
    throw error
  }

  return data as BagOfHope
}

export async function completePick(
  bagId: string,
  picks: PickItem[]
): Promise<void> {
  const supabase = createUntypedClient()

  // Create all pick transactions
  for (const pick of picks) {
    if (pick.quantity > 0) {
      await createPickTransaction(
        pick.category_id,
        bagId,
        pick.quantity,
        pick.condition
      )
    }
  }

  // Update bag status to packing (items picked, ready to pack)
  const { error } = await supabase
    .from('bags_of_hope')
    .update({
      status: 'packing',
      picked_at: new Date().toISOString(),
    })
    .eq('id', bagId)

  if (error) {
    console.error('Error completing pick:', error)
    throw error
  }
}

// Start picking a bag
export async function startPicking(bagId: string): Promise<BagOfHope> {
  return updateBagStatus(bagId, 'picking')
}

// Complete packing - bag is ready to ship
export async function completePacking(bagId: string): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .update({
      status: 'ready_to_ship',
      packed_at: new Date().toISOString(),
    })
    .eq('id', bagId)
    .select()
    .single()

  if (error) {
    console.error('Error completing packing:', error)
    throw error
  }

  return data as BagOfHope
}

// Ship a bag
export async function shipBag(
  bagId: string,
  shippingInfo?: {
    tracking_number?: string
    shipping_carrier?: string
    recipient_name?: string
    recipient_phone?: string
    delivery_address?: string
    delivery_notes?: string
  }
): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .update({
      status: 'in_transit',
      shipped_at: new Date().toISOString(),
      ...shippingInfo,
    })
    .eq('id', bagId)
    .select()
    .single()

  if (error) {
    console.error('Error shipping bag:', error)
    throw error
  }

  return data as BagOfHope
}

// Mark as ready for pickup
export async function markReadyForPickup(bagId: string): Promise<BagOfHope> {
  return updateBagStatus(bagId, 'ready_for_pickup')
}

// Mark as delivered
export async function markDelivered(bagId: string): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', bagId)
    .select()
    .single()

  if (error) {
    console.error('Error marking delivered:', error)
    throw error
  }

  return data as BagOfHope
}

// Generic status update with validation
export async function updateBagStatus(
  bagId: string,
  newStatus: BagStatus
): Promise<BagOfHope> {
  const supabase = createUntypedClient()

  // Get current bag
  const currentBag = await getBagOfHopeById(bagId)
  if (!currentBag) {
    throw new Error('Bag not found')
  }

  // Validate transition
  const allowedTransitions = STATUS_TRANSITIONS[currentBag.status]
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Cannot transition from ${currentBag.status} to ${newStatus}`
    )
  }

  const { data, error } = await supabase
    .from('bags_of_hope')
    .update({ status: newStatus })
    .eq('id', bagId)
    .select()
    .single()

  if (error) {
    console.error('Error updating bag status:', error)
    throw error
  }

  return data as BagOfHope
}

// Get bags by fulfillment stage
export async function getBagsByStage(
  stage: FulfillmentStage
): Promise<BagOfHope[]> {
  const statuses = FULFILLMENT_STAGE_STATUSES[stage]
  return getBagsOfHope(statuses)
}

// Get counts by stage for dashboard
export async function getFulfillmentCounts(): Promise<
  Record<FulfillmentStage, number>
> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .select('status')
    .neq('status', 'cancelled')
    .neq('status', 'delivered')

  if (error) {
    console.error('Error fetching fulfillment counts:', error)
    throw error
  }

  const counts: Record<FulfillmentStage, number> = {
    pick: 0,
    pack: 0,
    ship: 0,
  }

  const bags = (data || []) as { status: BagStatus }[]
  bags.forEach((bag) => {
    if (FULFILLMENT_STAGE_STATUSES.pick.includes(bag.status)) {
      counts.pick++
    } else if (FULFILLMENT_STAGE_STATUSES.pack.includes(bag.status)) {
      counts.pack++
    } else if (FULFILLMENT_STAGE_STATUSES.ship.includes(bag.status)) {
      counts.ship++
    }
  })

  return counts
}

export async function getPendingBags(): Promise<BagOfHope[]> {
  return getBagsOfHope(['pending', 'picking'])
}

export async function getRecentBags(limit: number = 10): Promise<BagOfHope[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent bags:', error)
    throw error
  }

  return (data || []) as BagOfHope[]
}
