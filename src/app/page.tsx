'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsCards, TodayStats } from '@/components/dashboard/StatsCards'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { ReorderAlerts } from '@/components/dashboard/ReorderAlerts'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { PackagePlus, ClipboardList, RefreshCcw } from 'lucide-react'
import {
  getInventoryLevels,
  getInventoryStats,
  getReorderAlerts,
  getRecentTransactions,
  getTodayStats,
} from '@/lib/supabase/inventory'
import { InventoryLevelWithCategory, InventoryTransactionWithCategory } from '@/types/database'

export default function DashboardPage() {
  const [levels, setLevels] = useState<InventoryLevelWithCategory[]>([])
  const [alerts, setAlerts] = useState<InventoryLevelWithCategory[]>([])
  const [transactions, setTransactions] = useState<InventoryTransactionWithCategory[]>([])
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    belowReorder: 0,
    outOfStock: 0,
  })
  const [todayStats, setTodayStats] = useState({ itemsIntake: 0, itemsPicked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [levelsData, statsData, alertsData, transactionsData, todayData] =
        await Promise.all([
          getInventoryLevels(),
          getInventoryStats(),
          getReorderAlerts(),
          getRecentTransactions(10),
          getTodayStats(),
        ])

      setLevels(levelsData)
      setStats(statsData)
      setAlerts(alertsData)
      setTransactions(transactionsData)
      setTodayStats(todayData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Inventory overview and quick actions
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">
                Make sure you have configured your Supabase environment variables in{' '}
                <code className="bg-muted px-1 rounded">.env.local</code>
              </p>
              <Button onClick={fetchData}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Inventory overview and quick actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/intake">
              <PackagePlus className="h-4 w-4 mr-2" />
              Log Intake
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pick/new">
              <ClipboardList className="h-4 w-4 mr-2" />
              New Pick List
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StatsCards
          totalItems={stats.totalItems}
          totalValue={stats.totalValue}
          belowReorder={stats.belowReorder}
          outOfStock={stats.outOfStock}
          itemsIntakeToday={todayStats.itemsIntake}
          itemsPickedToday={todayStats.itemsPicked}
        />
      )}

      {/* Today's Stats */}
      {!loading && (todayStats.itemsIntake > 0 || todayStats.itemsPicked > 0) && (
        <TodayStats
          itemsIntake={todayStats.itemsIntake}
          itemsPicked={todayStats.itemsPicked}
        />
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inventory Table / Alerts */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="alerts">
                Alerts
                {alerts.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                    {alerts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <InventoryTable levels={levels} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="alerts">
              {loading ? (
                <Card className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-48 bg-muted rounded" />
                  </CardContent>
                </Card>
              ) : (
                <ReorderAlerts alerts={alerts} maxItems={10} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Activity Feed */}
        <div>
          {loading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActivityFeed transactions={transactions} />
          )}
        </div>
      </div>
    </div>
  )
}
