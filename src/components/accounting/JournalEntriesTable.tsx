'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Download, CheckCircle, Search, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { JournalEntry, JournalEntryStatus, JournalEntryType } from '@/types/database'
import {
  approveJournalEntries,
  markEntriesAsExported,
  exportJournalEntriesToCSV,
  ENTRY_TYPE_LABELS,
  ENTRY_STATUS_LABELS,
} from '@/lib/supabase/journal-entries'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface JournalEntriesTableProps {
  entries: JournalEntry[]
  onRefresh: () => void
}

export function JournalEntriesTable({ entries, onRefresh }: JournalEntriesTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>('all')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (statusFilter !== 'all' && entry.status !== statusFilter) return false
    if (typeFilter !== 'all' && entry.entry_type !== typeFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      if (
        !entry.description?.toLowerCase().includes(searchLower) &&
        !entry.debit_account.toLowerCase().includes(searchLower) &&
        !entry.credit_account.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    if (startDate) {
      const entryDate = new Date(entry.entry_date)
      if (entryDate < startDate) return false
    }
    if (endDate) {
      const entryDate = new Date(entry.entry_date)
      if (entryDate > endDate) return false
    }
    return true
  })

  // Calculate totals
  const selectedEntries = filteredEntries.filter((e) => selected.has(e.id))
  const selectedTotal = selectedEntries.reduce((sum, e) => sum + e.amount, 0)
  const filteredTotal = filteredEntries.reduce((sum, e) => sum + e.amount, 0)

  const toggleAll = () => {
    if (selected.size === filteredEntries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredEntries.map((e) => e.id)))
    }
  }

  const toggleEntry = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const handleApprove = async () => {
    if (selected.size === 0) {
      toast.error('No entries selected')
      return
    }

    const draftEntries = selectedEntries.filter((e) => e.status === 'draft')
    if (draftEntries.length === 0) {
      toast.error('No draft entries selected')
      return
    }

    setProcessing(true)
    try {
      await approveJournalEntries(draftEntries.map((e) => e.id))
      toast.success(`Approved ${draftEntries.length} entries`)
      setSelected(new Set())
      onRefresh()
    } catch (error) {
      console.error('Error approving entries:', error)
      toast.error('Failed to approve entries')
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async () => {
    const entriesToExport = selected.size > 0 ? selectedEntries : filteredEntries

    if (entriesToExport.length === 0) {
      toast.error('No entries to export')
      return
    }

    // Generate CSV
    const csv = exportJournalEntriesToCSV(entriesToExport)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `journal-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    // Mark as exported if they were approved
    const approvedIds = entriesToExport
      .filter((e) => e.status === 'approved')
      .map((e) => e.id)

    if (approvedIds.length > 0) {
      try {
        await markEntriesAsExported(approvedIds)
        onRefresh()
      } catch (error) {
        console.error('Error marking entries as exported:', error)
      }
    }

    toast.success(`Exported ${entriesToExport.length} entries`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as JournalEntryStatus | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(ENTRY_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as JournalEntryType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM d') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM d') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selected.size > 0 ? (
            <>
              {selected.size} selected • Total: {formatCurrency(selectedTotal)}
            </>
          ) : (
            <>
              {filteredEntries.length} entries • Total: {formatCurrency(filteredTotal)}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleApprove}
            disabled={selected.size === 0 || processing}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Selected
          </Button>
          <Button onClick={handleExport} disabled={processing}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredEntries.length > 0 &&
                    selected.size === filteredEntries.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Debit Account</TableHead>
              <TableHead className="hidden md:table-cell">Credit Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No journal entries found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(entry.id)}
                      onCheckedChange={() => toggleEntry(entry.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatDate(entry.entry_date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {ENTRY_TYPE_LABELS[entry.entry_type]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {entry.debit_account}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {entry.credit_account}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(getStatusColor(entry.status), 'border-0')}>
                      {ENTRY_STATUS_LABELS[entry.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
