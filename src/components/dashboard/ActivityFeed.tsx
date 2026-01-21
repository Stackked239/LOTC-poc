'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, PackagePlus, ClipboardList, Settings } from 'lucide-react'
import { InventoryTransactionWithCategory } from '@/types/database'
import {
  formatRelativeDate,
  formatNumber,
  formatTransactionType,
  formatSourceType,
  formatCondition,
} from '@/lib/utils/formatters'

interface ActivityFeedProps {
  transactions: InventoryTransactionWithCategory[]
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'intake':
      return PackagePlus
    case 'pick':
      return ClipboardList
    default:
      return Settings
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case 'intake':
      return 'text-emerald-700 bg-emerald-100'
    case 'pick':
      return 'text-secondary-foreground bg-secondary'
    case 'disposal':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

export function ActivityFeed({ transactions }: ActivityFeedProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No recent activity. Start by logging some inventory!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = getTransactionIcon(transaction.transaction_type)
            const colorClass = getTransactionColor(transaction.transaction_type)
            const [iconBg, iconText] = colorClass.split(' ')

            return (
              <div key={transaction.id} className="flex gap-4">
                <div className={`rounded-full p-2 h-fit ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {formatTransactionType(transaction.transaction_type)}:{' '}
                        {transaction.categories.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatNumber(transaction.quantity)} items
                        </Badge>
                        {transaction.condition && (
                          <Badge variant="outline" className="text-xs">
                            {formatCondition(transaction.condition)}
                          </Badge>
                        )}
                        {transaction.source_type && (
                          <Badge variant="outline" className="text-xs">
                            {formatSourceType(transaction.source_type)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeDate(transaction.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
