'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { ArrowLeft, PackagePlus, RefreshCcw } from 'lucide-react'
import { getInventoryLevels } from '@/lib/supabase/inventory'
import { InventoryLevelWithCategory } from '@/types/database'

function InventoryContent() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  const [levels, setLevels] = useState<InventoryLevelWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      let data = await getInventoryLevels()

      // Apply URL filters
      if (filter === 'below_reorder') {
        data = data.filter(
          (level) =>
            level.categories.is_active &&
            level.quantity_on_hand < level.categories.reorder_point
        )
      } else if (filter === 'out_of_stock') {
        data = data.filter(
          (level) => level.categories.is_active && level.quantity_on_hand <= 0
        )
      }

      setLevels(data)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  const pageTitle = () => {
    if (filter === 'below_reorder') return 'Low Stock Items'
    if (filter === 'out_of_stock') return 'Out of Stock Items'
    return 'Inventory'
  }

  const pageDescription = () => {
    if (filter === 'below_reorder') return 'Items below their reorder point'
    if (filter === 'out_of_stock') return 'Items with zero quantity'
    return 'Complete inventory listing by category'
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{pageTitle()}</h1>
            <p className="text-muted-foreground">{pageDescription()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/intake">
              <PackagePlus className="h-4 w-4 mr-2" />
              Log Intake
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={!filter ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/inventory">All Items</Link>
        </Button>
        <Button
          variant={filter === 'below_reorder' ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/inventory?filter=below_reorder">Below Reorder</Link>
        </Button>
        <Button
          variant={filter === 'out_of_stock' ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/inventory?filter=out_of_stock">Out of Stock</Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {levels.length} {levels.length === 1 ? 'Category' : 'Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <InventoryTable levels={levels} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-16 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  )
}
