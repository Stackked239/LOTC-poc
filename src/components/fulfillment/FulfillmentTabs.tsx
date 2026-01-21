'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  BoxSelect,
  Truck,
  RefreshCcw,
  Clock,
  MapPin,
  CheckCircle,
  Boxes,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BagOfHope,
  BagStatus,
  FulfillmentStage,
  BAG_STATUS_LABELS,
} from '@/types/database'
import {
  getBagsByStage,
  getFulfillmentCounts,
  updateBagStatus,
  completePacking,
  shipBag,
  markReadyForPickup,
  markDelivered,
} from '@/lib/supabase/bags-of-hope'
import { BagCard } from './BagCard'
import { BatchesTab } from './BatchesTab'

type ShipSubTab = 'ready_to_ship' | 'in_transit' | 'ready_for_pickup' | 'delivered'
type MainTab = FulfillmentStage | 'batches'

export function FulfillmentTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as MainTab) || 'pick'
  const initialShipTab = (searchParams.get('ship') as ShipSubTab) || 'ready_to_ship'

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab)
  const [shipSubTab, setShipSubTab] = useState<ShipSubTab>(initialShipTab)
  const [bags, setBags] = useState<BagOfHope[]>([])
  const [counts, setCounts] = useState<Record<FulfillmentStage, number>>({
    pick: 0,
    pack: 0,
    ship: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    // Skip fetching for batches tab - it manages its own data
    if (activeTab === 'batches') {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [bagsData, countsData] = await Promise.all([
        getBagsByStage(activeTab as FulfillmentStage),
        getFulfillmentCounts(),
      ])
      setBags(bagsData)
      setCounts(countsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load fulfillment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as FulfillmentStage)
    router.push(`/pick?tab=${tab}`, { scroll: false })
  }

  const handleShipSubTabChange = (subTab: string) => {
    setShipSubTab(subTab as ShipSubTab)
  }

  const handleStatusChange = async (bagId: string, newStatus: BagStatus) => {
    try {
      switch (newStatus) {
        case 'ready_to_ship':
          await completePacking(bagId)
          break
        case 'in_transit':
          await shipBag(bagId)
          break
        case 'ready_for_pickup':
          await markReadyForPickup(bagId)
          break
        case 'delivered':
          await markDelivered(bagId)
          break
        default:
          await updateBagStatus(bagId, newStatus)
      }

      toast.success(`Status updated to ${BAG_STATUS_LABELS[newStatus]}`)
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  // Filter bags for ship sub-tabs
  const filteredBags =
    activeTab === 'ship'
      ? bags.filter((bag) => bag.status === shipSubTab)
      : bags

  // Count bags in each ship sub-tab
  const shipSubCounts = {
    ready_to_ship: bags.filter((b) => b.status === 'ready_to_ship').length,
    in_transit: bags.filter((b) => b.status === 'in_transit').length,
    ready_for_pickup: bags.filter((b) => b.status === 'ready_for_pickup').length,
    delivered: bags.filter((b) => b.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="pick" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pick
              {counts.pick > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {counts.pick}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pack" className="flex items-center gap-2">
              <BoxSelect className="h-4 w-4" />
              Pack
              {counts.pack > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {counts.pack}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ship" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Ship
              {counts.ship > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {counts.ship}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Batches
            </TabsTrigger>
          </TabsList>

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
        </div>

        {/* Pick Tab */}
        <TabsContent value="pick" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pick Queue
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bags waiting to have items picked from inventory
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton />
              ) : filteredBags.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No bags to pick"
                  description="All bags have been picked. Create a new request to add more."
                />
              ) : (
                <div className="space-y-3">
                  {filteredBags.map((bag) => (
                    <BagCard
                      key={bag.id}
                      bag={bag}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pack Tab */}
        <TabsContent value="pack" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BoxSelect className="h-5 w-5" />
                Pack Queue
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Items picked and ready to be packed into bags
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton />
              ) : filteredBags.length === 0 ? (
                <EmptyState
                  icon={BoxSelect}
                  title="No bags to pack"
                  description="Complete picking items to move bags here."
                />
              ) : (
                <div className="space-y-3">
                  {filteredBags.map((bag) => (
                    <BagCard
                      key={bag.id}
                      bag={bag}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="mt-6">
          <BatchesTab />
        </TabsContent>

        {/* Ship Tab with Sub-tabs */}
        <TabsContent value="ship" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bags in various shipping stages
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ship Sub-tabs */}
              <Tabs value={shipSubTab} onValueChange={handleShipSubTabChange}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger
                    value="ready_to_ship"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Clock className="h-3 w-3" />
                    Ready
                    {shipSubCounts.ready_to_ship > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {shipSubCounts.ready_to_ship}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="in_transit"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Truck className="h-3 w-3" />
                    Transit
                    {shipSubCounts.in_transit > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {shipSubCounts.in_transit}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="ready_for_pickup"
                    className="flex items-center gap-1 text-xs"
                  >
                    <MapPin className="h-3 w-3" />
                    Pickup
                    {shipSubCounts.ready_for_pickup > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {shipSubCounts.ready_for_pickup}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivered"
                    className="flex items-center gap-1 text-xs"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Done
                    {shipSubCounts.delivered > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {shipSubCounts.delivered}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ready_to_ship" className="mt-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : filteredBags.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No bags ready to ship"
                      description="Complete packing to move bags here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredBags.map((bag) => (
                        <BagCard
                          key={bag.id}
                          bag={bag}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="in_transit" className="mt-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : filteredBags.length === 0 ? (
                    <EmptyState
                      icon={Truck}
                      title="No bags in transit"
                      description="Mark bags as shipped to see them here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredBags.map((bag) => (
                        <BagCard
                          key={bag.id}
                          bag={bag}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ready_for_pickup" className="mt-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : filteredBags.length === 0 ? (
                    <EmptyState
                      icon={MapPin}
                      title="No bags ready for pickup"
                      description="Bags will appear here when ready at destination."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredBags.map((bag) => (
                        <BagCard
                          key={bag.id}
                          bag={bag}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="delivered" className="mt-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : filteredBags.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      title="No delivered bags"
                      description="Completed deliveries will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredBags.map((bag) => (
                        <BagCard
                          key={bag.id}
                          bag={bag}
                          showActions={false}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-medium text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
