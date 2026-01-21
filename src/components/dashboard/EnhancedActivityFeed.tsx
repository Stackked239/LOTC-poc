'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, PackagePlus, ClipboardList, Settings, TrendingDown, Trash2 } from 'lucide-react'
import { InventoryTransactionWithCategory } from '@/types/database'
import {
  formatRelativeDate,
  formatNumber,
  formatTransactionType,
  formatSourceType,
  formatCondition,
  formatCurrency,
} from '@/lib/utils/formatters'

interface EnhancedActivityFeedProps {
  transactions: InventoryTransactionWithCategory[]
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'intake':
      return PackagePlus
    case 'pick':
      return ClipboardList
    case 'thrift_out':
      return TrendingDown
    case 'disposal':
      return Trash2
    default:
      return Settings
  }
}

function getTransactionConfig(type: string) {
  switch (type) {
    case 'intake':
      return {
        color: 'text-emerald-700',
        bg: 'bg-emerald-100',
        border: 'border-emerald-300',
        timeline: 'bg-emerald-400',
      }
    case 'pick':
      return {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        timeline: 'bg-blue-400',
      }
    case 'adjustment':
      return {
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        timeline: 'bg-gray-400',
      }
    case 'thrift_out':
      return {
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        border: 'border-amber-300',
        timeline: 'bg-amber-400',
      }
    case 'disposal':
      return {
        color: 'text-red-700',
        bg: 'bg-red-100',
        border: 'border-red-300',
        timeline: 'bg-red-400',
      }
    default:
      return {
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        timeline: 'bg-gray-400',
      }
  }
}

export function EnhancedActivityFeed({ transactions }: EnhancedActivityFeedProps) {
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
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground text-sm">
              No recent activity
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start by logging some inventory!
            </p>
          </div>
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
        <div className="relative">
          {/* Timeline connector */}
          <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {transactions.map((transaction, index) => {
              const Icon = getTransactionIcon(transaction.transaction_type)
              const config = getTransactionConfig(transaction.transaction_type)
              const isLast = index === transactions.length - 1

              return (
                <div key={transaction.id} className="relative flex gap-4">
                  {/* Timeline node */}
                  <div className="relative flex-shrink-0">
                    <div className={`rounded-full p-2 ${config.bg} border-2 ${config.border} shadow-sm z-10 relative`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {formatTransactionType(transaction.transaction_type)}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {transaction.categories.name}
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${config.color} ${config.bg} border-0`}
                          >
                            {transaction.quantity > 0 ? '+' : ''}{formatNumber(transaction.quantity)} items
                          </Badge>

                          {transaction.total_value && (
                            <Badge variant="outline" className="text-xs">
                              {formatCurrency(transaction.total_value)}
                            </Badge>
                          )}

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

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span>{formatRelativeDate(transaction.created_at)}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
