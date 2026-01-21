'use client'

import { useEffect, useState } from 'react'
import { LogisticsMap } from '@/components/logistics/LogisticsMap'
import { getLogisticsLocations, LogisticsLocation } from '@/lib/supabase/logistics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, Truck, Filter } from 'lucide-react'
import { BAG_STATUS_LABELS, BATCH_STATUS_LABELS } from '@/types/database'

export default function LogisticsPage() {
  const [locations, setLocations] = useState<LogisticsLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<LogisticsLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'bag' | 'batch'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [locations, typeFilter, statusFilter])

  async function loadLocations() {
    try {
      const data = await getLogisticsLocations()
      setLocations(data)
    } catch (error) {
      console.error('Error loading logistics data:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...locations]

    if (typeFilter !== 'all') {
      filtered = filtered.filter((loc) => loc.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((loc) => loc.status === statusFilter)
    }

    setFilteredLocations(filtered)
  }

  const getStatusLabel = (location: LogisticsLocation) => {
    if (location.type === 'bag') {
      return BAG_STATUS_LABELS[location.status as keyof typeof BAG_STATUS_LABELS] || location.status
    }
    return BATCH_STATUS_LABELS[location.status as keyof typeof BATCH_STATUS_LABELS] || location.status
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-headline text-lotc-red tracking-wide">Logistics</h1>
          <p className="text-lotc-grey font-medium mt-1">Track package and batch locations</p>
        </div>
        <div className="h-[600px] bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-headline text-lotc-red tracking-wide">Logistics</h1>
        <p className="text-lotc-grey font-medium mt-1">Track package and batch locations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.filter((l) => l.type === 'bag').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.filter((l) => l.type === 'batch').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter((l) => l.status === 'in_transit').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter((l) => l.address).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bag">Bags Only</SelectItem>
                  <SelectItem value="batch">Batches Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {filteredLocations.length} of {locations.length} locations
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] rounded-lg overflow-hidden">
            <LogisticsMap locations={filteredLocations} />
          </div>
        </CardContent>
      </Card>

      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLocations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No locations found. Try adjusting your filters.
              </p>
            ) : (
              filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {location.type === 'bag' ? (
                      <Package className="h-5 w-5 text-lotc-red" />
                    ) : (
                      <Truck className="h-5 w-5 text-lotc-blue" />
                    )}
                    <div>
                      <div className="font-medium">
                        {location.type === 'bag'
                          ? `Bag - ${location.recipient_name || 'Unknown'}`
                          : `Batch ${location.batch_number || location.id.slice(0, 8)}`}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location.address || 'No address'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getStatusLabel(location)}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
