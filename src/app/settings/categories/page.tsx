'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  ToggleRight,
  RefreshCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Category } from '@/types/database'
import { CategoryForm } from '@/components/forms/CategoryForm'
import {
  getCategories,
  updateCategory,
  AGE_GROUP_LABELS,
  GENDER_LABELS,
} from '@/lib/supabase/categories'
import { formatCurrency, formatAgeGroup, formatGender } from '@/lib/utils/formatters'

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await getCategories({ is_active: undefined }) // Get all including inactive
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const handleToggleActive = async (category: Category) => {
    try {
      await updateCategory(category.id, { is_active: !category.is_active })
      toast.success(
        category.is_active ? 'Category deactivated' : 'Category activated'
      )
      fetchCategories()
    } catch (error) {
      console.error('Error toggling category:', error)
      toast.error('Failed to update category')
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">
              Manage inventory categories and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCategories} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">New Value</TableHead>
                    <TableHead className="text-right">Used Value</TableHead>
                    <TableHead className="text-center">Reorder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground py-8"
                      >
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow
                        key={category.id}
                        className={!category.is_active ? 'opacity-50' : ''}
                      >
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{formatAgeGroup(category.age_group)}</TableCell>
                        <TableCell>{formatGender(category.gender)}</TableCell>
                        <TableCell className="capitalize">{category.item_type}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(category.standard_value_new)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(category.standard_value_used)}
                        </TableCell>
                        <TableCell className="text-center">
                          {category.reorder_point}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={category.is_active ? 'default' : 'secondary'}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(category)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(category)}
                              >
                                <ToggleRight className="h-4 w-4 mr-2" />
                                {category.is_active ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryForm
        category={editingCategory}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
