'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Category, AgeGroup, Gender, CategoryInsert, CategoryUpdate } from '@/types/database'
import { createCategory, updateCategory } from '@/lib/supabase/categories'
import { AGE_GROUP_LABELS, GENDER_LABELS } from '@/lib/supabase/categories'

interface CategoryFormProps {
  category?: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ITEM_TYPES = [
  'tops',
  'bottoms',
  'sleepwear',
  'shoes',
  'toiletries',
  'toys',
  'books',
  'bedding',
  'undergarments',
  'socks',
  'other',
]

export function CategoryForm({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('baby')
  const [gender, setGender] = useState<Gender>('boy')
  const [itemType, setItemType] = useState('tops')
  const [standardValueNew, setStandardValueNew] = useState(10)
  const [reorderPoint, setReorderPoint] = useState(10)
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name)
      setAgeGroup(category.age_group)
      setGender(category.gender)
      setItemType(category.item_type)
      setStandardValueNew(category.standard_value_new)
      setReorderPoint(category.reorder_point)
      setDisplayOrder(category.display_order || 0)
      setIsActive(category.is_active)
    } else {
      setName('')
      setAgeGroup('baby')
      setGender('boy')
      setItemType('tops')
      setStandardValueNew(10)
      setReorderPoint(10)
      setDisplayOrder(0)
      setIsActive(true)
    }
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setLoading(true)

    try {
      if (category) {
        // Update existing
        const updates: CategoryUpdate = {
          name,
          age_group: ageGroup,
          gender,
          item_type: itemType,
          standard_value_new: standardValueNew,
          reorder_point: reorderPoint,
          display_order: displayOrder,
          is_active: isActive,
        }
        await updateCategory(category.id, updates)
        toast.success('Category updated')
      } else {
        // Create new
        const newCategory: CategoryInsert = {
          name,
          age_group: ageGroup,
          gender,
          item_type: itemType,
          standard_value_new: standardValueNew,
          reorder_point: reorderPoint,
          display_order: displayOrder,
          is_active: isActive,
        }
        await createCategory(newCategory)
        toast.success('Category created')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Baby Boy Tops"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age-group">Age Group *</Label>
              <Select value={ageGroup} onValueChange={(v) => setAgeGroup(v as AgeGroup)}>
                <SelectTrigger id="age-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                  <SelectItem value="neutral">All Ages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-type">Item Type *</Label>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger id="item-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Standard Value (New) *</Label>
              <Input
                id="value"
                type="number"
                min={0}
                step={0.01}
                value={standardValueNew}
                onChange={(e) => setStandardValueNew(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Used value = 50% of new
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder">Reorder Point *</Label>
              <Input
                id="reorder"
                type="number"
                min={0}
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Alert when below this
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
