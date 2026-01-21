'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PackagePlus, Search, Download } from 'lucide-react'
import { InventoryLevelWithCategory, AgeGroup, Gender } from '@/types/database'
import {
  formatCurrency,
  formatNumber,
  formatRelativeDate,
  formatAgeGroup,
  formatGender,
  getStockStatusColor,
} from '@/lib/utils/formatters'
import { AGE_GROUP_LABELS, GENDER_LABELS } from '@/lib/supabase/categories'

interface InventoryTableProps {
  levels: InventoryLevelWithCategory[]
}

export function InventoryTable({ levels }: InventoryTableProps) {
  const [search, setSearch] = useState('')
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')

  const filteredLevels = levels.filter((level) => {
    const matchesSearch = level.categories.name
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesAgeGroup =
      ageGroupFilter === 'all' || level.categories.age_group === ageGroupFilter
    const matchesGender =
      genderFilter === 'all' || level.categories.gender === genderFilter

    return matchesSearch && matchesAgeGroup && matchesGender
  })

  const exportToCSV = () => {
    const headers = [
      'Category',
      'Age Group',
      'Gender',
      'Quantity',
      'New',
      'Used',
      'Value',
      'Reorder Point',
      'Status',
    ]
    const rows = filteredLevels.map((level) => {
      const status = getStockStatusColor(
        level.quantity_on_hand,
        level.categories.reorder_point
      )
      return [
        level.categories.name,
        formatAgeGroup(level.categories.age_group),
        formatGender(level.categories.gender),
        level.quantity_on_hand,
        level.quantity_new,
        level.quantity_used,
        level.total_value?.toFixed(2) || '0.00',
        level.categories.reorder_point,
        status.label,
      ]
    })

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-center hidden sm:table-cell">New</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Used</TableHead>
              <TableHead className="text-right hidden md:table-cell">Value</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Last Intake</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLevels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredLevels.map((level) => {
                const status = getStockStatusColor(
                  level.quantity_on_hand,
                  level.categories.reorder_point
                )
                return (
                  <TableRow key={level.id}>
                    <TableCell>
                      <div className="font-medium">{level.categories.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {formatAgeGroup(level.categories.age_group)} •{' '}
                        {formatGender(level.categories.gender)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {formatNumber(level.quantity_on_hand)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {formatNumber(level.quantity_new)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {formatNumber(level.quantity_used)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {formatCurrency(level.total_value || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${status.bg} ${status.text} border-0`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                      {level.last_intake_date
                        ? formatRelativeDate(level.last_intake_date)
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/intake?category=${level.category_id}`}>
                          <PackagePlus className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLevels.length} of {levels.length} categories
      </div>
    </div>
  )
}
