'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, XCircle, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'

interface StatsCardsProps {
  totalItems: number
  totalValue: number
  belowReorder: number
  outOfStock: number
  pendingRequests?: number
  itemsIntakeToday?: number
  itemsPickedToday?: number
}

export function StatsCards({
  totalItems,
  totalValue,
  belowReorder,
  outOfStock,
  pendingRequests = 0,
  itemsIntakeToday = 0,
  itemsPickedToday = 0,
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Items',
      value: formatNumber(totalItems),
      icon: Package,
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary',
      change: itemsIntakeToday > 0 ? `+${itemsIntakeToday} today` : undefined,
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Requests',
      value: formatNumber(pendingRequests),
      icon: ClipboardList,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      alert: pendingRequests > 0,
      href: '/request',
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Below Reorder',
      value: formatNumber(belowReorder),
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      alert: belowReorder > 0,
    },
    {
      title: 'Out of Stock',
      value: formatNumber(outOfStock),
      icon: XCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      alert: outOfStock > 0,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const cardContent = (
          <Card key={stat.title} className={`${stat.alert ? 'border-l-4 border-l-blue-500' : ''} ${(stat as any).href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        )

        if ((stat as any).href) {
          return (
            <Link key={stat.title} href={(stat as any).href}>
              {cardContent}
            </Link>
          )
        }

        return cardContent
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
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Logged Today
          </CardTitle>
          <div className="rounded-full p-1.5 bg-emerald-100">
            <ArrowUp className="h-4 w-4 text-emerald-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(itemsIntake)} items</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-secondary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Picked Today
          </CardTitle>
          <div className="rounded-full p-1.5 bg-secondary">
            <ArrowDown className="h-4 w-4 text-secondary-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(itemsPicked)} items</div>
        </CardContent>
      </Card>
    </div>
  )
}
