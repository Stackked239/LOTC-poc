'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, XCircle, ArrowUp, ArrowDown, ClipboardList, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'

interface EnhancedStatsCardsProps {
  totalItems: number
  totalValue: number
  belowReorder: number
  outOfStock: number
  pendingRequests?: number
  itemsIntakeToday?: number
  itemsPickedToday?: number
}

export function EnhancedStatsCards({
  totalItems,
  totalValue,
  belowReorder,
  outOfStock,
  pendingRequests = 0,
  itemsIntakeToday = 0,
  itemsPickedToday = 0,
}: EnhancedStatsCardsProps) {
  const stats = [
    {
      title: 'Total Items',
      value: formatNumber(totalItems),
      icon: Package,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      gradient: 'from-gray-50 to-gray-100',
      iconBg: 'bg-white',
      change: itemsIntakeToday > 0 ? `+${itemsIntakeToday} today` : undefined,
      changeType: 'positive' as const,
      quickAction: {
        label: 'View All',
        href: '/inventory',
      },
    },
    {
      title: 'Pending Requests',
      value: formatNumber(pendingRequests),
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      gradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-white',
      alert: pendingRequests > 0,
      quickAction: {
        label: 'Process Now',
        href: '/request',
      },
      pulse: pendingRequests > 0,
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      gradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-white',
    },
    {
      title: 'Below Reorder',
      value: formatNumber(belowReorder),
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      gradient: 'from-amber-50 to-amber-100',
      iconBg: 'bg-white',
      alert: belowReorder > 0,
      quickAction: belowReorder > 0 ? {
        label: 'Review Alerts',
        href: '/inventory?filter=below-reorder',
      } : undefined,
    },
    {
      title: 'Out of Stock',
      value: formatNumber(outOfStock),
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      gradient: 'from-red-50 to-red-100',
      iconBg: 'bg-white',
      alert: outOfStock > 0,
      quickAction: outOfStock > 0 ? {
        label: 'Order Now',
        href: '/inventory?filter=out-of-stock',
      } : undefined,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const cardContent = (
          <Card
            key={stat.title}
            className={`
              relative overflow-hidden h-full
              bg-gradient-to-br ${stat.gradient}
              border-2 transition-all duration-300
              ${stat.alert ? 'border-l-4 border-l-blue-500' : 'border-gray-200'}
              ${(stat as any).quickAction ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 group' : ''}
            `}
          >
            {/* Pulse animation overlay for pending requests */}
            {stat.pulse && (
              <div className="absolute inset-0 bg-blue-400/10 animate-pulse pointer-events-none" />
            )}

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2.5 ${stat.iconBg} shadow-sm`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>

              {/* Reserve space for trend/change indicator - always rendered */}
              <div className="mt-2 h-5 flex items-center gap-1 text-xs text-muted-foreground">
                {stat.change && (
                  <>
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span>{stat.change}</span>
                  </>
                )}
              </div>

              {/* Quick action button on hover - always reserve space */}
              <div className="mt-3 h-5">
                {(stat as any).quickAction && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className={`text-xs font-medium ${stat.color} flex items-center gap-1`}>
                      <span>{(stat as any).quickAction.label}</span>
                      <ArrowUp className="h-3 w-3 rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

        if ((stat as any).quickAction) {
          return (
            <Link key={stat.title} href={(stat as any).quickAction.href} className="h-full flex">
              {cardContent}
            </Link>
          )
        }

        return <div className="h-full flex">{cardContent}</div>
      })}
    </div>
  )
}

export function TodayStats({
  itemsIntake,
  itemsPicked,
}: {
  itemsIntake: number
  itemsPicked: number
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="h-full border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Logged Today
          </CardTitle>
          <div className="rounded-full p-2 bg-emerald-100 shadow-sm">
            <ArrowUp className="h-4 w-4 text-emerald-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{formatNumber(itemsIntake)}</div>
          <p className="text-xs text-muted-foreground mt-1">items</p>
        </CardContent>
      </Card>

      <Card className="h-full border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Picked Today
          </CardTitle>
          <div className="rounded-full p-2 bg-blue-100 shadow-sm">
            <ArrowDown className="h-4 w-4 text-blue-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{formatNumber(itemsPicked)}</div>
          <p className="text-xs text-muted-foreground mt-1">items</p>
        </CardContent>
      </Card>
    </div>
  )
}
