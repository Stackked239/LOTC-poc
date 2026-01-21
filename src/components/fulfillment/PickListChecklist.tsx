'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Heart, ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { BagOfHope } from '@/types/database'
import { getBagOfHopeById, updateBagStatus } from '@/lib/supabase/bags-of-hope'
import { getColorTheme } from '@/lib/utils/colorTheme'

interface ChecklistItem {
  id: string
  label: string
  description: string
  category: 'non-clothing' | 'clothing'
  checked: boolean
}

export function PickListChecklist() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bagId = searchParams.get('bag')

  const [bag, setBag] = useState<BagOfHope | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load bag data and generate checklist
  useEffect(() => {
    async function loadData() {
      if (!bagId) {
        setLoading(false)
        return
      }

      try {
        const bagData = await getBagOfHopeById(bagId)

        if (!bagData) {
          toast.error('Bag of Hope not found')
          router.push('/pick')
          return
        }

        setBag(bagData)

        // Generate checklist items from bag data
        const items: ChecklistItem[] = []

        // Non-Clothing Items
        if (bagData.toy_activity) {
          items.push({
            id: 'toy_activity',
            label: 'Toy/Activity',
            description: bagData.toy_activity,
            category: 'non-clothing',
            checked: false,
          })
        }

        // Clothing Items
        if (bagData.tops) {
          items.push({
            id: 'tops',
            label: 'Tops',
            description: bagData.tops,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.bottoms) {
          items.push({
            id: 'bottoms',
            label: 'Bottoms',
            description: bagData.bottoms,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.pajamas) {
          items.push({
            id: 'pajamas',
            label: 'Pajamas/Sleepwear',
            description: bagData.pajamas,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.underwear) {
          items.push({
            id: 'underwear',
            label: 'Underwear',
            description: bagData.underwear,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.diaper_pullup) {
          items.push({
            id: 'diaper_pullup',
            label: 'Diaper/Pullup/Overnight',
            description: bagData.diaper_pullup,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.shoes) {
          items.push({
            id: 'shoes',
            label: 'Shoes',
            description: bagData.shoes,
            category: 'clothing',
            checked: false,
          })
        }
        if (bagData.coat) {
          items.push({
            id: 'coat',
            label: 'Coat',
            description: bagData.coat,
            category: 'clothing',
            checked: false,
          })
        }

        setChecklist(items)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load pick list')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [bagId, router])

  const handleCheckItem = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const handleCompletePick = async () => {
    if (!bag) return

    const allChecked = checklist.every(item => item.checked)
    if (!allChecked) {
      toast.error('Please check off all items before completing')
      return
    }

    setSubmitting(true)
    try {
      await updateBagStatus(bag.id, 'packing')
      toast.success('Pick complete! Bag moved to packing stage')
      router.push('/pick')
    } catch (error) {
      console.error('Error completing pick:', error)
      toast.error('Failed to complete pick')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bagId || !bag) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Bag Selected</h2>
          <p className="text-muted-foreground mb-4">
            Create a new Bag of Hope to start picking.
          </p>
          <Button asChild>
            <Link href="/request">Create New Request</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Get color theme
  const theme = getColorTheme(bag.bag_embroidery_color)
  const totalItems = checklist.length
  const checkedItems = checklist.filter(item => item.checked).length
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0

  const nonClothingItems = checklist.filter(item => item.category === 'non-clothing')
  const clothingItems = checklist.filter(item => item.category === 'clothing')

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/pick">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pick List</h1>
          <p className="text-muted-foreground">Check off items as you add them to the bag</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Information Card */}
          <Card>
            <CardHeader
              className="pb-3"
              style={{
                background: theme.primaryLight,
                borderBottom: `3px solid ${theme.primary}`
              }}
            >
              <CardTitle className="flex items-center gap-2">
                <Heart
                  className="h-5 w-5"
                  fill={theme.primary}
                  style={{ color: theme.primary }}
                />
                <span style={{ color: theme.textColor }}>
                  Bag for {bag.child_first_name} {bag.child_last_name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {bag.child_age && (
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{bag.child_age} years old</p>
                  </div>
                )}
                {bag.birthday && (
                  <div>
                    <p className="text-muted-foreground">Birthday</p>
                    <p className="font-medium">{new Date(bag.birthday).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{bag.child_gender}</p>
                </div>
                {bag.bag_embroidery_color && (
                  <div>
                    <p className="text-muted-foreground">Favorite Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ background: theme.primary }}
                      />
                      <p className="font-medium capitalize">{bag.bag_embroidery_color}</p>
                    </div>
                  </div>
                )}
                {bag.pickup_location && (
                  <div>
                    <p className="text-muted-foreground">Pickup Location</p>
                    <p className="font-medium capitalize">{bag.pickup_location.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {bag.request_id && (
                  <div>
                    <p className="text-muted-foreground">Request ID</p>
                    <p className="font-medium">{bag.request_id}</p>
                  </div>
                )}
              </div>

              {bag.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{bag.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Non-Clothing Items */}
          {nonClothingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Non-Clothing Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nonClothingItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border transition-all"
                    style={{
                      backgroundColor: item.checked ? theme.primaryLight : 'transparent',
                      borderColor: item.checked ? theme.primary : 'rgb(229 231 235)',
                    }}
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => handleCheckItem(item.id)}
                      className="mt-1"
                      style={{
                        borderColor: item.checked ? theme.primary : undefined,
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className="font-medium cursor-pointer block mb-1"
                      >
                        {item.label}
                      </label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                    {item.checked && (
                      <CheckCircle2
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: theme.primary }}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Clothing Items */}
          {clothingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clothing Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clothingItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border transition-all"
                    style={{
                      backgroundColor: item.checked ? theme.primaryLight : 'transparent',
                      borderColor: item.checked ? theme.primary : 'rgb(229 231 235)',
                    }}
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => handleCheckItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className="font-medium cursor-pointer block mb-1"
                      >
                        {item.label}
                      </label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                    {item.checked && (
                      <CheckCircle2
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: theme.primary }}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {checklist.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No specific items requested for this bag
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Items Checked</span>
                  <span className="font-medium">
                    {checkedItems} / {totalItems}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: theme.primary,
                    }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-center py-4">
                {progress === 100 ? (
                  <Badge
                    className="text-sm px-4 py-2"
                    style={{
                      backgroundColor: theme.primary,
                      color: 'white'
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    All Items Checked!
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    {totalItems - checkedItems} items remaining
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCompletePick}
                  disabled={progress !== 100 || submitting}
                  className="w-full"
                  style={{
                    backgroundColor: progress === 100 ? theme.primary : undefined,
                  }}
                >
                  {submitting ? 'Completing...' : 'Complete Pick'}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/pick">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
