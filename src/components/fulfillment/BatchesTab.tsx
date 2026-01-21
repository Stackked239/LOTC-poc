'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Boxes,
  Plus,
  RefreshCcw,
  Package,
  Clock,
  Truck,
  MapPin,
  CheckCircle,
  Heart,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ShippingBatch,
  BagOfHope,
  BatchStatus,
  BATCH_STATUS_LABELS,
} from '@/types/database'
import {
  getBatches,
  createBatch,
  addBagsToBatch,
  updateBatchStatus,
  getAvailableBagsForBatch,
  getBatchCounts,
} from '@/lib/supabase/batches'
import { formatAgeGroup, formatGender } from '@/lib/utils/formatters'
import { BatchCard } from './BatchCard'

type BatchSubTab = 'open' | 'ready_to_ship' | 'in_transit' | 'ready_for_pickup' | 'delivered'

interface BatchWithCount extends ShippingBatch {
  bagCount: number
}

export function BatchesTab() {
  const [subTab, setSubTab] = useState<BatchSubTab>('open')
  const [batches, setBatches] = useState<BatchWithCount[]>([])
  const [availableBags, setAvailableBags] = useState<BagOfHope[]>([])
  const [counts, setCounts] = useState<Record<BatchStatus, number>>({
    open: 0,
    ready_to_ship: 0,
    in_transit: 0,
    ready_for_pickup: 0,
    delivered: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedBags, setSelectedBags] = useState<string[]>([])
  const [newBatchCourier, setNewBatchCourier] = useState('')
  const [newBatchNotes, setNewBatchNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch batches for current tab
      const batchData = await getBatches(subTab as BatchStatus)

      // Fetch bag counts for each batch
      // We need to query bags_of_hope grouped by batch_id
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: bagCountsData } = await supabase
        .from('bags_of_hope')
        .select('batch_id')
        .not('batch_id', 'is', null)

      const bagCountMap: Record<string, number> = {}
      ;(bagCountsData || []).forEach((bag: { batch_id: string }) => {
        bagCountMap[bag.batch_id] = (bagCountMap[bag.batch_id] || 0) + 1
      })

      const batchesWithCounts: BatchWithCount[] = batchData.map((batch) => ({
        ...batch,
        bagCount: bagCountMap[batch.id] || 0,
      }))

      setBatches(batchesWithCounts)

      // Fetch counts
      const countsData = await getBatchCounts()
      setCounts(countsData)

      // Fetch available bags for creating new batch
      if (subTab === 'open') {
        const available = await getAvailableBagsForBatch()
        setAvailableBags(available)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [subTab])

  const handleCreateBatch = async () => {
    if (selectedBags.length === 0) {
      toast.error('Please select at least one bag')
      return
    }

    setCreating(true)
    try {
      // Create batch
      const batch = await createBatch({
        courier_name: newBatchCourier || undefined,
        notes: newBatchNotes || undefined,
      })

      // Add bags to batch
      await addBagsToBatch(batch.id, selectedBags)

      toast.success(`Created batch ${batch.batch_number} with ${selectedBags.length} bags`)

      // Reset form
      setSelectedBags([])
      setNewBatchCourier('')
      setNewBatchNotes('')
      setCreateDialogOpen(false)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error creating batch:', error)
      toast.error('Failed to create batch')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (batchId: string, newStatus: BatchStatus) => {
    try {
      await updateBatchStatus(batchId, newStatus)
      toast.success(`Batch updated to ${BATCH_STATUS_LABELS[newStatus]}`)
      fetchData()
    } catch (error) {
      console.error('Error updating batch:', error)
      toast.error('Failed to update batch')
    }
  }

  const toggleBagSelection = (bagId: string) => {
    setSelectedBags((prev) =>
      prev.includes(bagId)
        ? prev.filter((id) => id !== bagId)
        : [...prev, bagId]
    )
  }

  const selectAllBags = () => {
    if (selectedBags.length === availableBags.length) {
      setSelectedBags([])
    } else {
      setSelectedBags(availableBags.map((bag) => bag.id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Shipping Batches
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Group bags for bulk shipping operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCcw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>

            {/* Create Batch Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={availableBags.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Shipping Batch</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Batch details */}
                  <div className="space-y-2">
                    <Label htmlFor="courier">Courier Name (optional)</Label>
                    <Input
                      id="courier"
                      placeholder="e.g., John's Delivery"
                      value={newBatchCourier}
                      onChange={(e) => setNewBatchCourier(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Any special instructions..."
                      value={newBatchNotes}
                      onChange={(e) => setNewBatchNotes(e.target.value)}
                    />
                  </div>

                  {/* Bag selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Bags ({availableBags.length} available)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllBags}
                      >
                        {selectedBags.length === availableBags.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    </div>

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {availableBags.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No bags ready to ship. Complete packing first.
                        </p>
                      ) : (
                        <div className="divide-y">
                          {availableBags.map((bag) => (
                            <label
                              key={bag.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedBags.includes(bag.id)}
                                onCheckedChange={() => toggleBagSelection(bag.id)}
                              />
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {formatAgeGroup(bag.child_age_group)}{' '}
                                  {formatGender(bag.child_gender)}
                                </p>
                                {bag.request_id && (
                                  <p className="text-xs text-muted-foreground">
                                    {bag.request_id}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedBags.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedBags.length} bag{selectedBags.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBatch}
                    disabled={creating || selectedBags.length === 0}
                  >
                    {creating ? 'Creating...' : `Create Batch (${selectedBags.length})`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sub-tabs */}
        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as BatchSubTab)}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="open" className="flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              Open
              {counts.open > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts.open}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready_to_ship" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Ready
              {counts.ready_to_ship > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts.ready_to_ship}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_transit" className="flex items-center gap-1 text-xs">
              <Truck className="h-3 w-3" />
              Transit
              {counts.in_transit > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts.in_transit}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready_for_pickup" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              Pickup
              {counts.ready_for_pickup > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts.ready_for_pickup}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              Done
              {counts.delivered > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts.delivered}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab content */}
          {(['open', 'ready_to_ship', 'in_transit', 'ready_for_pickup', 'delivered'] as BatchSubTab[]).map(
            (tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {loading ? (
                  <LoadingSkeleton />
                ) : batches.length === 0 ? (
                  <EmptyState tab={tab} availableBags={availableBags.length} />
                ) : (
                  <div className="space-y-3">
                    {batches.map((batch) => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        bagCount={batch.bagCount}
                        onStatusChange={handleStatusChange}
                        showActions={tab !== 'delivered'}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ tab, availableBags }: { tab: BatchSubTab; availableBags: number }) {
  const messages: Record<BatchSubTab, { title: string; description: string }> = {
    open: {
      title: 'No open batches',
      description: availableBags > 0
        ? `Click "New Batch" to group ${availableBags} ready bags`
        : 'Complete packing to make bags available for batching',
    },
    ready_to_ship: {
      title: 'No batches ready to ship',
      description: 'Close open batches to prepare them for courier pickup',
    },
    in_transit: {
      title: 'No batches in transit',
      description: 'Mark batches as picked up when courier collects them',
    },
    ready_for_pickup: {
      title: 'No batches ready for pickup',
      description: 'Batches will appear here when at their destination',
    },
    delivered: {
      title: 'No delivered batches',
      description: 'Completed batch deliveries will appear here',
    },
  }

  const icons: Record<BatchSubTab, React.ElementType> = {
    open: Package,
    ready_to_ship: Clock,
    in_transit: Truck,
    ready_for_pickup: MapPin,
    delivered: CheckCircle,
  }

  const Icon = icons[tab]
  const { title, description } = messages[tab]

  return (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-medium text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
