'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, PackagePlus, ArrowRight, AlertCircle } from 'lucide-react'
import { InventoryLevelWithCategory } from '@/types/database'
import { formatNumber } from '@/lib/utils/formatters'

interface EnhancedReorderAlertsProps {
  alerts: InventoryLevelWithCategory[]
  maxItems?: number
}

function getAlertSeverity(item: InventoryLevelWithCategory) {
  const onHand = item.quantity_on_hand
  const reorderPoint = item.categories.reorder_point
  const deficit = reorderPoint - onHand

  if (onHand <= 0) {
    return {
      level: 'critical',
      label: 'Out of Stock',
      icon: '🔴',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-800',
      badgeVariant: 'destructive' as const,
    }
  } else if (deficit >= 10) {
    return {
      level: 'warning',
      label: 'Very Low',
      icon: '🟠',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-800',
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-orange-100 text-orange-800',
    }
  } else {
    return {
      level: 'low',
      label: 'Low Stock',
      icon: '🟡',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800',
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-yellow-100 text-yellow-800',
    }
  }
}

export function EnhancedReorderAlerts({ alerts, maxItems = 5 }: EnhancedReorderAlertsProps) {
  // Sort by severity (out of stock first, then by deficit)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const aDeficit = a.categories.reorder_point - a.quantity_on_hand
    const bDeficit = b.categories.reorder_point - b.quantity_on_hand
    return bDeficit - aDeficit
  })

  const displayAlerts = sortedAlerts.slice(0, maxItems)
  const hasMore = alerts.length > maxItems

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Reorder Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-3">
              <AlertTriangle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="font-medium text-sm">All Clear!</p>
            <p className="text-xs text-muted-foreground mt-1">
              All items are above reorder points
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Reorder Alerts
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayAlerts.map((alert) => {
            const severity = getAlertSeverity(alert)
            const deficit = alert.categories.reorder_point - alert.quantity_on_hand

            return (
              <div
                key={alert.id}
                className={`
                  p-3 rounded-lg border-l-4
                  ${severity.bgColor} ${severity.borderColor}
                  transition-all duration-200
                  hover:shadow-md
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{severity.icon}</span>
                      <p className="font-semibold text-sm truncate">
                        {alert.categories.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {formatNumber(alert.quantity_on_hand)} / {formatNumber(alert.categories.reorder_point)}
                      </span>
                      {alert.quantity_on_hand > 0 && (
                        <span className={severity.textColor}>
                          Need {formatNumber(deficit)} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={severity.badgeVariant}
                      className={severity.badgeClass || ''}
                    >
                      {severity.label}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Link href={`/intake?category=${alert.category_id}`}>
                        <PackagePlus className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <Button asChild variant="outline" className="w-full mt-4">
            <Link href="/inventory?filter=below_reorder">
              View all {alerts.length} alerts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
