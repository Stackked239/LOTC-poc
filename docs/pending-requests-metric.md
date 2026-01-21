# Pending Requests Metric - Dashboard Addition

## Summary

Added a new metric to the dashboard that displays the number of submission requests waiting to be processed.

## Changes Made

### 1. **New Database Function** (`src/lib/supabase/submissions.ts`)

Added `getPendingSubmissionsCount()` function:
```typescript
export async function getPendingSubmissionsCount(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .or('sync_status.is.null,sync_status.neq.processed')

  if (error) {
    console.error('Error counting pending submissions:', error)
    return 0
  }

  return count || 0
}
```

**Logic:**
- Counts all submissions where `sync_status` is NULL or NOT 'processed'
- Returns 0 if error occurs (graceful degradation)

### 2. **Updated StatsCards Component** (`src/components/dashboard/StatsCards.tsx`)

**New Features:**
- Added `pendingRequests` prop to interface
- Added new stat card with clipboard icon
- Made the card clickable (links to `/request` page)
- Added hover effect for clickable card
- Changed grid from 4 columns to 5 columns (`lg:grid-cols-5`)

**Card Configuration:**
```typescript
{
  title: 'Pending Requests',
  value: formatNumber(pendingRequests),
  icon: ClipboardList,
  color: 'text-blue-700',
  bgColor: 'bg-blue-100',
  alert: pendingRequests > 0,  // Blue border when pending requests exist
  href: '/request',             // Clickable - navigates to request page
}
```

**Visual Design:**
- Blue color scheme (bg-blue-100, text-blue-700)
- Clipboard icon
- Blue left border when count > 0
- Hover effect with shadow
- Cursor pointer

### 3. **Updated Dashboard Page** (`src/app/page.tsx`)

**Changes:**
- Imported `getPendingSubmissionsCount` from submissions
- Added `pendingRequests` state variable
- Fetches pending count in parallel with other stats
- Passes `pendingRequests` to StatsCards component
- Updated skeleton loading to show 5 cards instead of 4

**Data Flow:**
```
Dashboard loads
  → fetchData() called
    → getPendingSubmissionsCount() fetched in parallel
    → setPendingRequests(count)
  → StatsCards renders with pendingRequests prop
    → Card shows count with blue styling
    → Clicking card navigates to /request page
```

## Visual Appearance

### Dashboard Stats Row (5 cards):

```
┌─────────────┬──────────────────┬──────────────┬──────────────┬──────────────┐
│ Total Items │ Pending Requests │ Total Value  │ Below Reorder│ Out of Stock │
│             │ ││ (blue border) │              │              │              │
│    1,234    │ ││      15       │   $12,345    │      8       │      3       │
│ +10 today   │ ││ [Clickable]   │              │              │              │
└─────────────┴──────────────────┴──────────────┴──────────────┴──────────────┘
```

**Order of Cards:**
1. Total Items (gray)
2. **Pending Requests (blue)** ← NEW
3. Total Value (green)
4. Below Reorder (amber)
5. Out of Stock (red)

## User Experience

### Interactions:
1. **View Count**: Shows number of unprocessed submissions at a glance
2. **Visual Alert**: Blue left border appears when count > 0
3. **Quick Navigation**: Click card to go directly to submission queue page
4. **Hover Feedback**: Card shadow on hover indicates it's clickable

### Use Cases:
- **Morning Check**: Staff see immediately how many requests need processing
- **Workload Planning**: Managers can assess daily queue at a glance
- **Quick Access**: One click to go process submissions

## Technical Details

### Pending Request Logic

**Counts as "Pending" when:**
- `sync_status IS NULL` (never synced)
- `sync_status != 'processed'` (synced but not processed)

**Does NOT count:**
- `sync_status = 'processed'` (already handled)

### Performance

- Uses Supabase `count` with `head: true` (doesn't fetch data)
- Fast query, only returns count number
- Fetched in parallel with other dashboard metrics
- No impact on dashboard load time

### Error Handling

- Returns 0 if database error occurs
- Logs error to console
- Dashboard continues to load normally

## Future Enhancements

Potential additions:
1. Show count by status (pending, in-progress, error)
2. Display age of oldest pending request
3. Add "Process Next" button on card
4. Show trend (requests per day/week)
5. Alert badge for requests older than X days

## Responsive Behavior

### Desktop (≥1024px):
- 5 cards in a row
- All visible at once

### Tablet (768-1023px):
- 2 cards per row
- Pending Requests in second position

### Mobile (<768px):
- 2 cards per row (stacked)
- Same positioning

## Build Status

✅ Build successful with no errors
✅ TypeScript compilation passed
✅ All routes generated successfully
