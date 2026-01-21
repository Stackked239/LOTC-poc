'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  Play,
  Check,
} from 'lucide-react'
import { BagOfHope, BagStatus, BAG_STATUS_LABELS } from '@/types/database'
import { formatAgeGroup, formatGender } from '@/lib/utils/formatters'
import { formatDistanceToNow } from 'date-fns'
import { ShipBagDialog } from './ShipBagDialog'

interface BagCardProps {
  bag: BagOfHope
  onStatusChange?: (bagId: string, newStatus: BagStatus) => Promise<void>
  showActions?: boolean
}

const STATUS_COLORS: Record<BagStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  picking: 'bg-secondary text-secondary-foreground',
  packing: 'bg-violet-100 text-violet-800',
  ready_to_ship: 'bg-amber-100 text-amber-800',
  in_transit: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-primary/10 text-primary',
}

const STATUS_ICONS: Record<BagStatus, React.ElementType> = {
  pending: Clock,
  picking: Package,
  packing: Package,
  ready_to_ship: Truck,
  in_transit: Truck,
  ready_for_pickup: MapPin,
  delivered: CheckCircle,
  cancelled: Clock,
}

// What action button to show for each status
const STATUS_ACTIONS: Record<BagStatus, { label: string; nextStatus: BagStatus } | null> = {
  pending: { label: 'Start Picking', nextStatus: 'picking' },
  picking: null, // Goes to pick list page
  packing: { label: 'Mark Ready to Ship', nextStatus: 'ready_to_ship' },
  ready_to_ship: { label: 'Mark In Transit', nextStatus: 'in_transit' },
  in_transit: { label: 'Ready for Pickup', nextStatus: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Mark Delivered', nextStatus: 'delivered' },
  delivered: null,
  cancelled: null,
}

export function BagCard({ bag, onStatusChange, showActions = true }: BagCardProps) {
  const [loading, setLoading] = useState(false)
  const StatusIcon = STATUS_ICONS[bag.status]
  const action = STATUS_ACTIONS[bag.status]

  const handleAction = async () => {
    if (!action || !onStatusChange) return
    setLoading(true)
    try {
      await onStatusChange(bag.id, action.nextStatus)
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(bag.created_at), { addSuffix: true })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Bag info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">
                  {formatAgeGroup(bag.child_age_group)} {formatGender(bag.child_gender)}
                </span>
                <Badge className={`${STATUS_COLORS[bag.status]} border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {BAG_STATUS_LABELS[bag.status]}
                </Badge>
              </div>

              {bag.request_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  Request: {bag.request_id}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Created {timeAgo}
              </p>

              {bag.recipient_name && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{bag.recipient_name}</span>
                  {bag.recipient_phone && (
                    <>
                      <Phone className="h-3 w-3" />
                      <span>{bag.recipient_phone}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {bag.status === 'picking' && (
                <Button asChild size="sm">
                  <Link href={`/pick?bag=${bag.id}`}>
                    <Play className="h-4 w-4 mr-1" />
                    Continue
                  </Link>
                </Button>
              )}

              {bag.status === 'pending' && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/pick?bag=${bag.id}`}>
                    <Play className="h-4 w-4 mr-1" />
                    Start Pick
                  </Link>
                </Button>
              )}

              {bag.status === 'ready_to_ship' ? (
                <ShipBagDialog
                  bagId={bag.id}
                  onSuccess={() => onStatusChange?.(bag.id, 'in_transit')}
                  trigger={
                    <Button size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      Mark In Transit
                    </Button>
                  }
                />
              ) : (
                action && bag.status !== 'pending' && bag.status !== 'picking' && (
                  <Button
                    size="sm"
                    onClick={handleAction}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {loading ? 'Updating...' : action.label}
                  </Button>
                )
              )}

              <Button asChild variant="ghost" size="icon">
                <Link href={`/fulfillment/${bag.id}`}>
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
