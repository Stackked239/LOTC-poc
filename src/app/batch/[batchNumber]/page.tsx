'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Boxes,
  Heart,
  Truck,
  Clock,
  MapPin,
  CheckCircle,
  Package,
  QrCode,
  Printer,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ShippingBatchWithBags,
  BatchStatus,
  BATCH_STATUS_LABELS,
  BAG_STATUS_LABELS,
} from '@/types/database'
import { getBatchByNumber, updateBatchStatus } from '@/lib/supabase/batches'
import { formatAgeGroup, formatGender, formatCurrency } from '@/lib/utils/formatters'
import { formatDistanceToNow, format } from 'date-fns'

const STATUS_COLORS: Record<BatchStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  ready_to_ship: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_ICONS: Record<BatchStatus, React.ElementType> = {
  open: Package,
  ready_to_ship: Clock,
  in_transit: Truck,
  ready_for_pickup: MapPin,
  delivered: CheckCircle,
  cancelled: Clock,
}

const STATUS_ACTIONS: Record<BatchStatus, { label: string; nextStatus: BatchStatus } | null> = {
  open: { label: 'Close Batch', nextStatus: 'ready_to_ship' },
  ready_to_ship: { label: 'Mark Picked Up', nextStatus: 'in_transit' },
  in_transit: { label: 'Ready for Pickup', nextStatus: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Mark Delivered', nextStatus: 'delivered' },
  delivered: null,
  cancelled: null,
}

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchNumber: string }>
}) {
  const { batchNumber } = use(params)
  const router = useRouter()
  const [batch, setBatch] = useState<ShippingBatchWithBags | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchBatch = async () => {
    try {
      setLoading(true)
      const data = await getBatchByNumber(batchNumber)
      setBatch(data)
    } catch (error) {
      console.error('Error fetching batch:', error)
      toast.error('Failed to load batch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatch()
  }, [batchNumber])

  const handleStatusChange = async () => {
    if (!batch) return
    const action = STATUS_ACTIONS[batch.status]
    if (!action) return

    setUpdating(true)
    try {
      await updateBatchStatus(batch.id, action.nextStatus)
      toast.success(`Batch updated to ${BATCH_STATUS_LABELS[action.nextStatus]}`)
      fetchBatch()
    } catch (error) {
      console.error('Error updating batch:', error)
      toast.error('Failed to update batch')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pick?tab=batches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Batch Not Found</h1>
            <p className="text-muted-foreground">
              The batch {batchNumber} could not be found.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[batch.status]
  const action = STATUS_ACTIONS[batch.status]
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/batch/${batch.batch_number}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pick?tab=batches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-mono">{batch.batch_number}</h1>
            <p className="text-muted-foreground">
              {batch.bags.length} {batch.bags.length === 1 ? 'bag' : 'bags'} in this batch
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {action && batch.bags.length > 0 && (
            <Button onClick={handleStatusChange} disabled={updating}>
              <Check className="h-4 w-4 mr-2" />
              {updating ? 'Updating...' : action.label}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batch Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Batch Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${STATUS_COLORS[batch.status]} border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {BATCH_STATUS_LABELS[batch.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(batch.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {batch.courier_name && (
                  <div>
                    <p className="text-muted-foreground">Courier</p>
                    <p className="font-medium">{batch.courier_name}</p>
                  </div>
                )}
                {batch.tracking_number && (
                  <div>
                    <p className="text-muted-foreground">Tracking</p>
                    <p className="font-medium">{batch.tracking_number}</p>
                  </div>
                )}
                {batch.picked_up_at && (
                  <div>
                    <p className="text-muted-foreground">Picked Up</p>
                    <p className="font-medium">
                      {format(new Date(batch.picked_up_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
                {batch.delivered_at && (
                  <div>
                    <p className="text-muted-foreground">Delivered</p>
                    <p className="font-medium">
                      {format(new Date(batch.delivered_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
              </div>

              {batch.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Notes</p>
                    <p>{batch.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bags List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" fill="currentColor" />
                Bags in Batch ({batch.bags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batch.bags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No bags in this batch yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {batch.bags.map((bag, index) => (
                    <div
                      key={bag.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {formatAgeGroup(bag.child_age_group)}{' '}
                          {formatGender(bag.child_gender)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {bag.request_id && <span>Ref: {bag.request_id}</span>}
                          <Badge variant="outline" className="text-xs">
                            {BAG_STATUS_LABELS[bag.status]}
                          </Badge>
                        </div>
                      </div>
                      {bag.recipient_name && (
                        <div className="text-right text-sm">
                          <p className="font-medium">{bag.recipient_name}</p>
                          {bag.recipient_phone && (
                            <p className="text-muted-foreground">{bag.recipient_phone}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with QR Code */}
        <div>
          <Card className="print:shadow-none print:border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Batch QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="H"
                includeMargin
              />
              <p className="font-mono text-xl font-bold">{batch.batch_number}</p>
              <p className="text-sm text-muted-foreground text-center">
                Scan to view batch details and update status
              </p>
              <div className="text-center">
                <Badge className={`${STATUS_COLORS[batch.status]} border-0`}>
                  {batch.bags.length} {batch.bags.length === 1 ? 'bag' : 'bags'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print-only section */}
      <div className="hidden print:block mt-8 border-t pt-4">
        <p className="text-sm text-center text-muted-foreground">
          Least of These Carolinas - Batch {batch.batch_number}
        </p>
      </div>
    </div>
  )
}
