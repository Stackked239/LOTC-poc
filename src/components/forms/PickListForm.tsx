'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Minus, Heart, Package, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  BagOfHope,
  Category,
  InventoryLevelWithCategory,
  AgeGroup,
  Gender,
  Condition,
} from '@/types/database'
import { PickItem } from '@/types/forms'
import { getBagOfHopeById } from '@/lib/supabase/bags-of-hope'
import {
  getCategories,
  getCategoriesForChild,
  groupCategoriesByType,
} from '@/lib/supabase/categories'
import { getInventoryLevels } from '@/lib/supabase/inventory'
import {
  formatCurrency,
  formatNumber,
  formatAgeGroup,
  formatGender,
  getStockStatusColor,
} from '@/lib/utils/formatters'
import { completePickAction } from '@/app/actions/pick-actions'

interface PickItemState extends PickItem {
  categoryName: string
  maxQuantity: number
  unitValue: number
}

export function PickListForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bagId = searchParams.get('bag')

  const [bag, setBag] = useState<BagOfHope | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevelWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [picks, setPicks] = useState<Record<string, PickItemState>>({})

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!bagId) {
        setLoading(false)
        return
      }

      try {
        const [bagData, categoriesData, levelsData] = await Promise.all([
          getBagOfHopeById(bagId),
          getCategories(),
          getInventoryLevels(),
        ])

        if (!bagData) {
          toast.error('Bag of Hope not found')
          router.push('/pick/new')
          return
        }

        setBag(bagData)
        setCategories(categoriesData)
        setInventoryLevels(levelsData)

        // Filter categories for this child
        const relevantCategories = getCategoriesForChild(
          categoriesData,
          bagData.child_age_group as AgeGroup,
          bagData.child_gender as Gender
        )

        // Initialize picks state
        const initialPicks: Record<string, PickItemState> = {}
        relevantCategories.forEach((cat) => {
          const level = levelsData.find((l) => l.category_id === cat.id)
          const maxQty = level?.quantity_on_hand || 0

          initialPicks[cat.id] = {
            category_id: cat.id,
            categoryName: cat.name,
            quantity: 0,
            condition: 'new',
            maxQuantity: maxQty,
            unitValue: cat.standard_value_new,
          }
        })
        setPicks(initialPicks)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load pick list data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bagId, router])

  const handleQuantityChange = (categoryId: string, delta: number) => {
    setPicks((prev) => {
      const current = prev[categoryId]
      if (!current) return prev

      const newQty = Math.max(0, Math.min(current.maxQuantity, current.quantity + delta))
      return {
        ...prev,
        [categoryId]: {
          ...current,
          quantity: newQty,
        },
      }
    })
  }

  const handleConditionChange = (categoryId: string, condition: Condition) => {
    setPicks((prev) => {
      const current = prev[categoryId]
      if (!current) return prev

      const category = categories.find((c) => c.id === categoryId)
      const unitValue = condition === 'new'
        ? category?.standard_value_new || 0
        : category?.standard_value_used || 0

      return {
        ...prev,
        [categoryId]: {
          ...current,
          condition,
          unitValue,
        },
      }
    })
  }

  const handleSubmit = async () => {
    if (!bag) return

    const picksToSubmit = Object.values(picks).filter((p) => p.quantity > 0)

    if (picksToSubmit.length === 0) {
      toast.error('Please select at least one item to pick')
      return
    }

    setSubmitting(true)

    try {
      const result = await completePickAction(
        bag.id,
        picksToSubmit.map((p) => ({
          category_id: p.category_id,
          quantity: p.quantity,
          condition: p.condition,
        }))
      )

      if (result.success) {
        toast.success('Bag of Hope packed successfully!')
        // Small delay to let the toast render before navigation
        setTimeout(() => {
          router.push('/pick')
        }, 500)
      } else {
        toast.error(result.error || 'Failed to complete pick')
      }
    } catch (error) {
      console.error('Error completing pick:', error)
      toast.error('Failed to complete pick')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate totals
  const totalItems = Object.values(picks).reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = Object.values(picks).reduce(
    (sum, p) => sum + p.quantity * p.unitValue,
    0
  )

  // Group picks by item type
  const relevantCategories = bag
    ? getCategoriesForChild(
        categories,
        bag.child_age_group as AgeGroup,
        bag.child_gender as Gender
      )
    : []
  const groupedCategories = groupCategoriesByType(relevantCategories)

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bagId) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Bag Selected</h2>
          <p className="text-muted-foreground mb-4">
            Create a new Bag of Hope to start packing.
          </p>
          <Button asChild>
            <Link href="/request">Create New Request</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!bag) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Pick List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bag Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
              Bag of Hope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age Group</p>
                <p className="font-medium">{formatAgeGroup(bag.child_age_group)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{formatGender(bag.child_gender)}</p>
              </div>
              {bag.request_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Request ID</p>
                  <p className="font-medium">{bag.request_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items by Category Type */}
        {Object.entries(groupedCategories).map(([itemType, cats]) => (
          <Card key={itemType}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{itemType}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cats.map((category) => {
                const pick = picks[category.id]
                const level = inventoryLevels.find((l) => l.category_id === category.id)
                const stockStatus = getStockStatusColor(
                  level?.quantity_on_hand || 0,
                  category.reorder_point
                )

                if (!pick) return null

                return (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{category.name}</p>
                        <Badge className={`${stockStatus.bg} ${stockStatus.text} border-0`}>
                          {formatNumber(level?.quantity_on_hand || 0)} available
                        </Badge>
                      </div>
                      {(level?.quantity_on_hand || 0) < category.reorder_point && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low stock
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Condition */}
                      <Select
                        value={pick.condition}
                        onValueChange={(value) =>
                          handleConditionChange(category.id, value as Condition)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(category.id, -1)}
                          disabled={pick.quantity <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          max={pick.maxQuantity}
                          value={pick.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setPicks((prev) => ({
                              ...prev,
                              [category.id]: {
                                ...prev[category.id],
                                quantity: Math.max(0, Math.min(pick.maxQuantity, val)),
                              },
                            }))
                          }}
                          className="w-16 text-center h-8"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(category.id, 1)}
                          disabled={pick.quantity >= pick.maxQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div>
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Pick Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{formatNumber(totalItems)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.values(picks)
                .filter((p) => p.quantity > 0)
                .map((pick) => (
                  <div
                    key={pick.category_id}
                    className="flex justify-between text-sm py-1"
                  >
                    <span className="truncate mr-2">
                      {pick.quantity}x {pick.categoryName}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(pick.quantity * pick.unitValue)}
                    </span>
                  </div>
                ))}
              {totalItems === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select items to add to the bag
                </p>
              )}
            </div>

            <Separator />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={totalItems === 0 || submitting}
            >
              <Check className="h-4 w-4 mr-2" />
              {submitting ? 'Completing...' : 'Complete Pick'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
