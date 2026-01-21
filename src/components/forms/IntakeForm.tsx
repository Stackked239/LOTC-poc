'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Package, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Category, AgeGroup, Gender, Condition, SourceType } from '@/types/database'
import { IntakeFormData, SessionIntakeSummary } from '@/types/forms'
import {
  getCategories,
  getCategoriesForChild,
  AGE_GROUP_LABELS,
  GENDER_LABELS,
} from '@/lib/supabase/categories'
import { createIntakeTransaction } from '@/lib/supabase/inventory'
import { formatCurrency } from '@/lib/utils/formatters'

export function IntakeForm() {
  const searchParams = useSearchParams()
  const preselectedCategory = searchParams.get('category')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filter state
  const [ageGroupFilter, setAgeGroupFilter] = useState<AgeGroup | 'all'>('all')
  const [genderFilter, setGenderFilter] = useState<Gender | 'all'>('all')

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [sourceType, setSourceType] = useState<SourceType>('donation')
  const [condition, setCondition] = useState<Condition>('new')
  const [notes, setNotes] = useState('')
  const [receiptReference, setReceiptReference] = useState('')

  // Session summary
  const [sessionSummary, setSessionSummary] = useState<SessionIntakeSummary>({
    totalItems: 0,
    totalValue: 0,
    transactions: [],
  })

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories()
        setCategories(data)

        // If preselected category, set it
        if (preselectedCategory) {
          const cat = data.find((c) => c.id === preselectedCategory)
          if (cat) {
            setSelectedCategory(preselectedCategory)
            setAgeGroupFilter(cat.age_group as AgeGroup)
            setGenderFilter(cat.gender as Gender)
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [preselectedCategory])

  // Filter categories based on selection
  const filteredCategories = categories.filter((cat) => {
    if (ageGroupFilter !== 'all' && cat.age_group !== ageGroupFilter && cat.age_group !== 'neutral') {
      return false
    }
    if (genderFilter !== 'all' && cat.gender !== genderFilter && cat.gender !== 'neutral') {
      return false
    }
    return true
  })

  // Get selected category details
  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)

  // Calculate value
  const calculatedValue = selectedCategoryData
    ? (condition === 'new'
        ? selectedCategoryData.standard_value_new
        : selectedCategoryData.standard_value_used) * quantity
    : 0

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  const handleSubmit = async (addAnother: boolean = false) => {
    if (!selectedCategory || quantity < 1) {
      toast.error('Please select a category and enter a valid quantity')
      return
    }

    setSubmitting(true)

    try {
      const formData: IntakeFormData = {
        category_id: selectedCategory,
        quantity,
        source_type: sourceType,
        condition,
        notes: notes || undefined,
        receipt_reference: receiptReference || undefined,
      }

      await createIntakeTransaction(formData)

      // Update session summary
      setSessionSummary((prev) => ({
        totalItems: prev.totalItems + quantity,
        totalValue: prev.totalValue + calculatedValue,
        transactions: [
          {
            categoryName: selectedCategoryData?.name || '',
            quantity,
            condition,
            value: calculatedValue,
          },
          ...prev.transactions,
        ],
      }))

      toast.success(`Added ${quantity} ${selectedCategoryData?.name}`, {
        description: `Value: ${formatCurrency(calculatedValue)}`,
      })

      // Reset form
      if (addAnother) {
        setQuantity(1)
        setNotes('')
        setReceiptReference('')
        // Keep category selected for quick re-entry
      } else {
        setSelectedCategory('')
        setQuantity(1)
        setNotes('')
        setReceiptReference('')
        setAgeGroupFilter('all')
        setGenderFilter('all')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to log intake')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCategory('')
    setQuantity(1)
    setSourceType('donation')
    setCondition('new')
    setNotes('')
    setReceiptReference('')
    setAgeGroupFilter('all')
    setGenderFilter('all')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Log Inventory Intake
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Category</Label>

              {/* Filters */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age-filter">Age Group</Label>
                  <Select
                    value={ageGroupFilter}
                    onValueChange={(value) => {
                      setAgeGroupFilter(value as AgeGroup | 'all')
                      setSelectedCategory('')
                    }}
                  >
                    <SelectTrigger id="age-filter">
                      <SelectValue placeholder="All ages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ages</SelectItem>
                      {Object.entries(AGE_GROUP_LABELS).filter(([k]) => k !== 'neutral').map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender-filter">Gender</Label>
                  <Select
                    value={genderFilter}
                    onValueChange={(value) => {
                      setGenderFilter(value as Gender | 'all')
                      setSelectedCategory('')
                    }}
                  >
                    <SelectTrigger id="gender-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Object.entries(GENDER_LABELS).filter(([k]) => k !== 'neutral').map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Source Type */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Source</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={sourceType === 'donation'}
                    onCheckedChange={() => setSourceType('donation')}
                  />
                  <span>Donation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={sourceType === 'purchase'}
                    onCheckedChange={() => setSourceType('purchase')}
                  />
                  <span>Purchase</span>
                </label>
              </div>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Condition</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={condition === 'new'}
                    onCheckedChange={() => setCondition('new')}
                  />
                  <span>New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={condition === 'used'}
                    onCheckedChange={() => setCondition('used')}
                  />
                  <span>Used (50% value)</span>
                </label>
              </div>
            </div>

            <Separator />

            {/* Optional Fields */}
            <div className="space-y-4">
              {sourceType === 'purchase' && (
                <div className="space-y-2">
                  <Label htmlFor="receipt">Receipt Reference</Label>
                  <Input
                    id="receipt"
                    placeholder="Receipt # or reference"
                    value={receiptReference}
                    onChange={(e) => setReceiptReference(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Value Display */}
            {selectedCategoryData && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Calculated Value:</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculatedValue)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {condition === 'new' ? 'New' : 'Used'} @{' '}
                  {formatCurrency(
                    condition === 'new'
                      ? selectedCategoryData.standard_value_new
                      : selectedCategoryData.standard_value_used
                  )}{' '}
                  each
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={!selectedCategory || submitting}
                className="flex-1"
              >
                {submitting ? 'Saving...' : 'Log Intake'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSubmit(true)}
                disabled={!selectedCategory || submitting}
                className="flex-1"
              >
                Log & Add Another
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Summary */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionSummary.transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Items logged this session will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{sessionSummary.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(sessionSummary.totalValue)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionSummary.transactions.map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{t.categoryName}</p>
                        <p className="text-muted-foreground text-xs">
                          {t.quantity} x {t.condition}
                        </p>
                      </div>
                      <span className="font-medium">{formatCurrency(t.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
