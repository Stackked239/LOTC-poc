import { createClient, createUntypedClient } from './client'
import {
  ShippingBatch,
  ShippingBatchWithBags,
  BatchStatus,
  BagOfHope,
  BagStatus,
} from '@/types/database'

// Get all batches with optional status filter
export async function getBatches(
  status?: BatchStatus | BatchStatus[]
): Promise<ShippingBatch[]> {
  const supabase = createUntypedClient()

  let query = supabase
    .from('shipping_batches')
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
    console.error('Error fetching batches:', error)
    throw error
  }

  return (data || []) as ShippingBatch[]
}

// Get a single batch by ID with its bags
export async function getBatchById(id: string): Promise<ShippingBatchWithBags | null> {
  const supabase = createUntypedClient()

  // Get batch
  const { data: batch, error: batchError } = await supabase
    .from('shipping_batches')
    .select('*')
    .eq('id', id)
    .single()

  if (batchError) {
    console.error('Error fetching batch:', batchError)
    return null
  }

  // Get bags in this batch
  const { data: bags, error: bagsError } = await supabase
    .from('bags_of_hope')
    .select('*')
    .eq('batch_id', id)
    .order('created_at', { ascending: false })

  if (bagsError) {
    console.error('Error fetching batch bags:', bagsError)
    return null
  }

  return {
    ...(batch as ShippingBatch),
    bags: (bags || []) as BagOfHope[],
  }
}

// Get batch by batch number (for QR code scanning)
export async function getBatchByNumber(
  batchNumber: string
): Promise<ShippingBatchWithBags | null> {
  const supabase = createUntypedClient()

  const { data: batch, error: batchError } = await supabase
    .from('shipping_batches')
    .select('*')
    .eq('batch_number', batchNumber)
    .single()

  if (batchError) {
    console.error('Error fetching batch by number:', batchError)
    return null
  }

  // Get bags in this batch
  const { data: bags, error: bagsError } = await supabase
    .from('bags_of_hope')
    .select('*')
    .eq('batch_id', (batch as ShippingBatch).id)
    .order('created_at', { ascending: false })

  if (bagsError) {
    console.error('Error fetching batch bags:', bagsError)
    return null
  }

  return {
    ...(batch as ShippingBatch),
    bags: (bags || []) as BagOfHope[],
  }
}

// Create a new batch
export async function createBatch(data?: {
  courier_name?: string
  notes?: string
  scheduled_pickup_at?: string
}): Promise<ShippingBatch> {
  const supabase = createUntypedClient()

  const { data: batch, error } = await supabase
    .from('shipping_batches')
    .insert({
      status: 'open',
      courier_name: data?.courier_name || null,
      notes: data?.notes || null,
      scheduled_pickup_at: data?.scheduled_pickup_at || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating batch:', error)
    throw error
  }

  return batch as ShippingBatch
}

// Add bags to a batch
export async function addBagsToBatch(
  batchId: string,
  bagIds: string[]
): Promise<void> {
  const supabase = createUntypedClient()

  const { error } = await supabase
    .from('bags_of_hope')
    .update({ batch_id: batchId })
    .in('id', bagIds)

  if (error) {
    console.error('Error adding bags to batch:', error)
    throw error
  }
}

// Remove a bag from a batch
export async function removeBagFromBatch(bagId: string): Promise<void> {
  const supabase = createUntypedClient()

  const { error } = await supabase
    .from('bags_of_hope')
    .update({ batch_id: null })
    .eq('id', bagId)

  if (error) {
    console.error('Error removing bag from batch:', error)
    throw error
  }
}

// Update batch status and all bags in batch
export async function updateBatchStatus(
  batchId: string,
  newStatus: BatchStatus,
  additionalData?: {
    courier_name?: string
    tracking_number?: string
  }
): Promise<ShippingBatch> {
  const supabase = createUntypedClient()

  // Map batch status to bag status
  const bagStatusMap: Record<BatchStatus, BagStatus | null> = {
    open: null, // Don't change bag status
    ready_to_ship: 'ready_to_ship',
    in_transit: 'in_transit',
    ready_for_pickup: 'ready_for_pickup',
    delivered: 'delivered',
    cancelled: null, // Don't change bag status
  }

  const bagStatus = bagStatusMap[newStatus]

  // Update batch
  const updateData: Record<string, unknown> = {
    status: newStatus,
  }

  if (additionalData?.courier_name) {
    updateData.courier_name = additionalData.courier_name
  }
  if (additionalData?.tracking_number) {
    updateData.tracking_number = additionalData.tracking_number
  }

  // Add timestamp based on status
  if (newStatus === 'in_transit') {
    updateData.picked_up_at = new Date().toISOString()
  } else if (newStatus === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { data: batch, error: batchError } = await supabase
    .from('shipping_batches')
    .update(updateData)
    .eq('id', batchId)
    .select()
    .single()

  if (batchError) {
    console.error('Error updating batch:', batchError)
    throw batchError
  }

  // Update all bags in batch if there's a corresponding bag status
  if (bagStatus) {
    const bagUpdateData: Record<string, unknown> = {
      status: bagStatus,
    }

    if (newStatus === 'in_transit') {
      bagUpdateData.shipped_at = new Date().toISOString()
    } else if (newStatus === 'delivered') {
      bagUpdateData.delivered_at = new Date().toISOString()
    }

    const { error: bagsError } = await supabase
      .from('bags_of_hope')
      .update(bagUpdateData)
      .eq('batch_id', batchId)

    if (bagsError) {
      console.error('Error updating batch bags:', bagsError)
      throw bagsError
    }
  }

  return batch as ShippingBatch
}

// Close batch (mark ready for pickup)
export async function closeBatch(batchId: string): Promise<ShippingBatch> {
  return updateBatchStatus(batchId, 'ready_to_ship')
}

// Mark batch as picked up by courier
export async function markBatchPickedUp(
  batchId: string,
  courierName?: string,
  trackingNumber?: string
): Promise<ShippingBatch> {
  return updateBatchStatus(batchId, 'in_transit', {
    courier_name: courierName,
    tracking_number: trackingNumber,
  })
}

// Mark batch as ready for recipient pickup
export async function markBatchReadyForPickup(
  batchId: string
): Promise<ShippingBatch> {
  return updateBatchStatus(batchId, 'ready_for_pickup')
}

// Mark batch as delivered
export async function markBatchDelivered(batchId: string): Promise<ShippingBatch> {
  return updateBatchStatus(batchId, 'delivered')
}

// Delete an empty batch
export async function deleteBatch(batchId: string): Promise<void> {
  const supabase = createUntypedClient()

  // First remove all bags from batch
  await supabase
    .from('bags_of_hope')
    .update({ batch_id: null })
    .eq('batch_id', batchId)

  // Delete batch
  const { error } = await supabase
    .from('shipping_batches')
    .delete()
    .eq('id', batchId)

  if (error) {
    console.error('Error deleting batch:', error)
    throw error
  }
}

// Get bags ready to be added to a batch (ready_to_ship without a batch)
export async function getAvailableBagsForBatch(): Promise<BagOfHope[]> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('bags_of_hope')
    .select('*')
    .eq('status', 'ready_to_ship')
    .is('batch_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching available bags:', error)
    throw error
  }

  return (data || []) as BagOfHope[]
}

// Get batch counts by status
export async function getBatchCounts(): Promise<Record<BatchStatus, number>> {
  const supabase = createUntypedClient()

  const { data, error } = await supabase
    .from('shipping_batches')
    .select('status')

  if (error) {
    console.error('Error fetching batch counts:', error)
    throw error
  }

  const counts: Record<BatchStatus, number> = {
    open: 0,
    ready_to_ship: 0,
    in_transit: 0,
    ready_for_pickup: 0,
    delivered: 0,
    cancelled: 0,
  }

  const batches = (data || []) as { status: BatchStatus }[]
  batches.forEach((batch) => {
    counts[batch.status]++
  })

  return counts
}

// Generate QR code data for a batch
export function generateBatchQRData(batch: ShippingBatch, baseUrl: string): string {
  // The QR code will contain a URL to the batch detail page
  return `${baseUrl}/batch/${batch.batch_number}`
}
