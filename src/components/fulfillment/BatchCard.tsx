'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  ChevronRight,
  Play,
  Check,
  Boxes,
} from 'lucide-react'
import { ShippingBatch, ShippingBatchWithBags, BatchStatus, BATCH_STATUS_LABELS } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface BatchCardProps {
  batch: ShippingBatch | ShippingBatchWithBags
  bagCount?: number
  onStatusChange?: (batchId: string, newStatus: BatchStatus) => Promise<void>
  showActions?: boolean
  baseUrl?: string
}

const STATUS_COLORS: Record<BatchStatus, string> = {
  open: 'bg-secondary text-secondary-foreground',
  ready_to_ship: 'bg-amber-100 text-amber-800',
  in_transit: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-primary/10 text-primary',
}

const STATUS_ICONS: Record<BatchStatus, React.ElementType> = {
  open: Package,
  ready_to_ship: Clock,
  in_transit: Truck,
  ready_for_pickup: MapPin,
  delivered: CheckCircle,
  cancelled: Clock,
}

// What action button to show for each status
const STATUS_ACTIONS: Record<BatchStatus, { label: string; nextStatus: BatchStatus } | null> = {
  open: { label: 'Close Batch', nextStatus: 'ready_to_ship' },
  ready_to_ship: { label: 'Mark Picked Up', nextStatus: 'in_transit' },
  in_transit: { label: 'Ready for Pickup', nextStatus: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Mark Delivered', nextStatus: 'delivered' },
  delivered: null,
  cancelled: null,
}

export function BatchCard({
  batch,
  bagCount,
  onStatusChange,
  showActions = true,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: BatchCardProps) {
  const [loading, setLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const StatusIcon = STATUS_ICONS[batch.status]
  const action = STATUS_ACTIONS[batch.status]

  // Get bag count from batch if it has bags array
  const count = bagCount ?? ('bags' in batch ? batch.bags.length : 0)

  const handleAction = async () => {
    if (!action || !onStatusChange) return
    setLoading(true)
    try {
      await onStatusChange(batch.id, action.nextStatus)
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })
  const qrUrl = `${baseUrl}/batch/${batch.batch_number}`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Batch info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Boxes className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold font-mono">{batch.batch_number}</span>
                <Badge className={`${STATUS_COLORS[batch.status]} border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {BATCH_STATUS_LABELS[batch.status]}
                </Badge>
                <Badge variant="outline">
                  {count} {count === 1 ? 'bag' : 'bags'}
                </Badge>
              </div>

              {batch.courier_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Courier: {batch.courier_name}
                </p>
              )}

              {batch.tracking_number && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tracking: {batch.tracking_number}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Created {timeAgo}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* QR Code Dialog */}
              <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Batch QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="H"
                      includeMargin
                    />
                    <p className="font-mono text-lg font-bold">{batch.batch_number}</p>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code to view all {count} bags in this batch
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {qrUrl}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {action && count > 0 && (
                <Button
                  size="sm"
                  onClick={handleAction}
                  disabled={loading || count === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {loading ? 'Updating...' : action.label}
                </Button>
              )}

              <Button asChild variant="ghost" size="icon">
                <Link href={`/batch/${batch.batch_number}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
