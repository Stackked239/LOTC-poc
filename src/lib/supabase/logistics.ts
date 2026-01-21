import { createClient } from './client'
import { BagOfHope, ShippingBatch, BagStatus, BatchStatus } from '@/types/database'

export interface LogisticsLocation {
  id: string
  type: 'bag' | 'batch'
  address: string | null
  status: BagStatus | BatchStatus
  recipient_name: string | null
  tracking_number: string | null
  delivered_at: string | null
  shipped_at: string | null
  notes: string | null
  // For bags
  child_age_group?: string
  child_gender?: string
  // For batches
  batch_number?: string
  courier_name?: string | null
  bag_count?: number
}

export async function getLogisticsLocations(): Promise<LogisticsLocation[]> {
  const supabase = createClient()
  const locations: LogisticsLocation[] = []

  // Fetch bags with delivery addresses
  const { data: bags, error: bagsError } = await supabase
    .from('bags_of_hope')
    .select('*')
    .not('delivery_address', 'is', null)
    .in('status', ['ready_to_ship', 'in_transit', 'ready_for_pickup'])

  if (bagsError) {
    console.error('Error fetching bags:', bagsError)
  } else if (bags) {
    bags.forEach((bag: BagOfHope) => {
      locations.push({
        id: bag.id,
        type: 'bag',
        address: bag.delivery_address,
        status: bag.status,
        recipient_name: bag.recipient_name,
        tracking_number: bag.tracking_number,
        delivered_at: bag.delivered_at,
        shipped_at: bag.shipped_at,
        notes: bag.delivery_notes,
        child_age_group: bag.child_age_group,
        child_gender: bag.child_gender,
      })
    })
  }

  // Fetch batches (we'll use the first bag's address or a central location)
  const { data: batches, error: batchesError } = await supabase
    .from('shipping_batches')
    .select(`
      *,
      bags_of_hope(count)
    `)
    .in('status', ['pending', 'in_transit'])

  if (batchesError) {
    console.error('Error fetching batches:', batchesError)
  } else if (batches) {
    for (const batch of batches) {
      // Get a representative bag from this batch to get location
      const { data: batchBags } = await supabase
        .from('bags_of_hope')
        .select('delivery_address')
        .eq('batch_id', batch.id)
        .not('delivery_address', 'is', null)
        .limit(1)
        .single()

      locations.push({
        id: batch.id,
        type: 'batch',
        address: batchBags?.delivery_address || null,
        status: batch.status,
        recipient_name: null,
        tracking_number: batch.tracking_number,
        delivered_at: batch.delivered_at,
        shipped_at: null,
        notes: batch.notes,
        batch_number: batch.batch_number,
        courier_name: batch.courier_name,
        bag_count: (batch as any).bags_of_hope?.[0]?.count || 0,
      })
    }
  }

  return locations
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token || token === 'YOUR_MAPBOX_TOKEN_HERE') {
    console.warn('Mapbox token not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }

  return null
}
