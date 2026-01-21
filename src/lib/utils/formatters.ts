import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`
  }

  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`
  }

  return formatDistanceToNow(d, { addSuffix: true })
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatAgeGroup(ageGroup: string): string {
  const labels: Record<string, string> = {
    baby: 'Baby (0-2)',
    toddler: 'Toddler (3-6)',
    school_age: 'School Age (7-11)',
    teen: 'Teen (12+)',
    neutral: 'All Ages',
  }
  return labels[ageGroup] || capitalizeFirst(ageGroup.replace('_', ' '))
}

export function formatGender(gender: string): string {
  const labels: Record<string, string> = {
    boy: 'Boy',
    girl: 'Girl',
    neutral: 'Neutral',
  }
  return labels[gender] || capitalizeFirst(gender)
}

export function formatCondition(condition: string): string {
  return capitalizeFirst(condition)
}

export function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    intake: 'Intake',
    pick: 'Pick',
    adjustment: 'Adjustment',
    thrift_out: 'Thrift Out',
    disposal: 'Disposal',
  }
  return labels[type] || capitalizeFirst(type.replace('_', ' '))
}

export function formatSourceType(type: string): string {
  const labels: Record<string, string> = {
    donation: 'Donation',
    purchase: 'Purchase',
    transfer: 'Transfer',
  }
  return labels[type] || capitalizeFirst(type)
}

export function formatBagStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    packed: 'Packed',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return labels[status] || capitalizeFirst(status.replace('_', ' '))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    packed: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    exported: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStockStatusColor(
  quantity: number,
  reorderPoint: number
): {
  bg: string
  text: string
  label: string
} {
  if (quantity <= 0) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Out of Stock',
    }
  }
  if (quantity < reorderPoint) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Low Stock',
    }
  }
  return {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'In Stock',
  }
}
