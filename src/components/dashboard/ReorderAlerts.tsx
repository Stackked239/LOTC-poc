'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, PackagePlus, ArrowRight } from 'lucide-react'
import { InventoryLevelWithCategory } from '@/types/database'
import { formatNumber } from '@/lib/utils/formatters'

interface ReorderAlertsProps {
  alerts: InventoryLevelWithCategory[]
  maxItems?: number
}

export function ReorderAlerts({ alerts, maxItems = 5 }: ReorderAlertsProps) {
  const displayAlerts = alerts.slice(0, maxItems)
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
          <p className="text-muted-foreground text-sm">
            All items are above reorder points. Great job keeping stock up!
          </p>
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
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayAlerts.map((alert) => {
            const isOutOfStock = alert.quantity_on_hand <= 0
            return (
              <div
                key={alert.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{alert.categories.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(alert.quantity_on_hand)} in stock
                    <span className="mx-1">•</span>
                    Reorder at {formatNumber(alert.categories.reorder_point)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {isOutOfStock ? (
                    <Badge variant="destructive">Out</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Low
                    </Badge>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/intake?category=${alert.category_id}`}>
                      <PackagePlus className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        {hasMore && (
          <Button asChild variant="link" className="w-full mt-4">
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
