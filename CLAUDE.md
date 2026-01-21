# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LOTC Inventory Management System - A comprehensive Next.js application for managing "Bags of Hope" donation fulfillment workflow for Least of These Carolinas. Tracks inventory intake, pick lists, batch shipping, and accounting journal entries.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (with Turbopack)
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Configuration

Required environment variables in `.env` or `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Tech Stack
- **Next.js 16.1.4** with App Router and Turbopack
- **React 19** with React Server Components
- **TypeScript 5** with strict mode
- **Supabase** with SSR support (`@supabase/ssr`)
- **Tailwind CSS 4** with shadcn/ui components
- **React Hook Form + Zod** for form validation

### Core Domain Model

**Inventory System**:
- Categories with age groups (baby/toddler/school_age/teen/neutral), gender (boy/girl/neutral), and item types
- Separate valuations for new vs. used items
- Inventory transactions track: intake, pick, adjustment, thrift_out, disposal
- Inventory levels maintain current quantities (total, new, used) and values

**Fulfillment Workflow** (Bags of Hope):
- **Pick Stage**: pending → picking (creating bags for child requests)
- **Pack Stage**: packing (preparing picked items)
- **Ship Stage**: ready_to_ship → in_transit → ready_for_pickup → delivered
- Each bag targets specific child_age_group + child_gender combination
- Status transitions are validated (see `STATUS_TRANSITIONS` in `bags-of-hope.ts`)

**Batch Shipping**:
- Groups multiple bags for courier pickup
- Tracks batch_number, courier, tracking info, and delivery timestamps

**Accounting Integration**:
- Journal entries auto-generated from inventory transactions
- Double-entry accounting with configurable debit/credit accounts
- Workflow: draft → approved → exported

### Database Layer Architecture

**Critical Pattern: Typed vs. Untyped Clients**

The codebase uses TWO types of Supabase clients deliberately:

1. **Typed Client** (`createClient()` from `client.ts`):
   - Used for **read operations only** (SELECT queries)
   - Returns `SupabaseClient<Database>` with full TypeScript inference
   - Use for: fetching inventory levels, transactions, bags, etc.

2. **Untyped Client** (`createUntypedClient()` from `client.ts`):
   - Used for **write operations** (INSERT, UPDATE, DELETE)
   - Returns plain `SupabaseClient` without generic type parameter
   - **Why**: Supabase's TypeScript types for mutations can be overly strict and cause type errors with computed values, partial updates, or complex joins
   - Use for: creating transactions, updating bag status, inserting records

**Example Pattern**:
```typescript
// Read with typed client
const supabase = createClient()
const { data } = await supabase.from('inventory_levels').select('*')

// Write with untyped client
const untypedSupabase = createUntypedClient()
const { data } = await untypedSupabase.from('inventory_transactions').insert(transaction)
```

**Server vs. Client**:
- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/server.ts` - Server client for server components/actions (with cookie handling)
- Always use `'use client'` directive for components that need client-side Supabase access

### Data Flow Patterns

**Inventory Transactions**:
1. User submits intake/pick form
2. Transaction created with automatic unit_value calculation from category's standard values
3. Database triggers update `inventory_levels` table
4. Database triggers generate journal entries for accounting

**Bag Fulfillment Flow**:
1. Create bag (pending status) with child demographics
2. Start picking → bag status: picking
3. Complete pick with item list → creates pick transactions, status: packing
4. Complete packing → status: ready_to_ship
5. Add to shipping batch or ship individually → status: in_transit
6. Mark ready_for_pickup or delivered

**Client-Side Filtering**:
- Large datasets (inventory levels, alerts) fetched once and filtered client-side
- See `getInventoryLevels()` - fetches all, then filters by age_group, gender, item_type, search term
- Reduces database queries while maintaining responsive UI

### Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Dashboard with stats, inventory table, alerts
│   ├── intake/              # Log inventory donations/purchases
│   ├── inventory/           # Full inventory view with filters
│   ├── pick/                # Create and manage pick lists for bags
│   ├── request/             # Bag of Hope fulfillment tabs (pick/pack/ship)
│   ├── batch/[batchNumber]/ # Shipping batch detail with bag list
│   ├── accounting/          # Journal entries table
│   └── settings/            # Category management
│
├── components/
│   ├── layout/              # AppLayout (sidebar + navbar), persistent navigation
│   ├── dashboard/           # StatsCards, InventoryTable, ReorderAlerts, ActivityFeed
│   ├── forms/               # IntakeForm, PickListForm, CategoryForm (React Hook Form + Zod)
│   ├── fulfillment/         # BagCard, BatchCard, FulfillmentTabs (pick/pack/ship)
│   ├── accounting/          # JournalEntriesTable
│   └── ui/                  # shadcn/ui primitives (button, card, dialog, etc.)
│
├── lib/
│   ├── supabase/            # Database query functions (data access layer)
│   │   ├── client.ts        # Typed + untyped browser clients
│   │   ├── server.ts        # Server-side client with cookies
│   │   ├── inventory.ts     # Inventory queries: levels, transactions, stats, alerts
│   │   ├── categories.ts    # Category CRUD operations
│   │   ├── bags-of-hope.ts  # Bag queries, status transitions, fulfillment functions
│   │   ├── batches.ts       # Shipping batch operations
│   │   └── journal-entries.ts # Accounting journal entry queries
│   └── utils/               # Formatters, utilities, cn() for Tailwind
│
└── types/
    ├── database.ts          # Supabase generated types + helper types
    └── forms.ts             # Zod schemas for form validation
```

### Component Patterns

**Data Fetching**:
- Client components use `useEffect` to fetch data on mount
- Loading states with skeleton UI (animate-pulse)
- Error states with retry mechanism
- Functions imported from `lib/supabase/*` modules

**Form Handling**:
- React Hook Form + Zod for validation
- Form schemas defined in `types/forms.ts`
- Success feedback via Sonner toast notifications
- Form submission triggers data refetch in parent component

**UI Architecture**:
- All pages wrapped in `AppLayout` (provides sidebar + navbar)
- Responsive design: mobile-first with lg: breakpoint for desktop sidebar
- Radix UI primitives with Tailwind styling
- Icon library: Lucide React

### Type Safety Patterns

**Database Types** (`types/database.ts`):
- `Database` interface: full Supabase schema definition
- Helper types exported: `Category`, `InventoryTransaction`, `BagOfHope`, etc.
- Extended types with joins: `InventoryLevelWithCategory`, `InventoryTransactionWithCategory`
- Enum types: `AgeGroup`, `Gender`, `ItemType`, `BagStatus`, `TransactionType`
- Status label maps: `BAG_STATUS_LABELS`, `BATCH_STATUS_LABELS`

**Form Types** (`types/forms.ts`):
- Zod schemas define validation rules
- TypeScript types inferred: `IntakeFormData`, `PickItem`, `CategoryFormData`

### Key Business Rules

**Inventory Transactions**:
- Intake increases inventory (positive quantity)
- Pick decreases inventory (negative in DB via triggers)
- Unit values pulled from category's `standard_value_new` or `standard_value_used`
- Total value = quantity × unit_value

**Bag Status Transitions**:
- Enforced in `updateBagStatus()` via `STATUS_TRANSITIONS` map
- Cannot skip stages (e.g., pending → ready_to_ship invalid)
- Timestamps auto-set: picked_at, packed_at, shipped_at, delivered_at

**Reorder Alerts**:
- Triggered when `quantity_on_hand < reorder_point`
- Only active categories shown
- Dashboard displays count badge on Alerts tab

**Batch Management**:
- Bags assigned to batch via `batch_id` foreign key
- Batch status syncs with contained bags
- Batches have scheduled_pickup_at, picked_up_at, delivered_at timestamps

## Common Development Patterns

### Adding a New Page
1. Create route in `src/app/[route]/page.tsx`
2. Add navigation link in `src/components/layout/Sidebar.tsx`
3. Use `'use client'` if you need client-side data fetching or interactivity
4. Wrap content in proper layout structure (see existing pages)

### Adding a New Supabase Query
1. Add function to appropriate file in `src/lib/supabase/`
2. Use typed client (`createClient()`) for reads
3. Use untyped client (`createUntypedClient()`) for writes
4. Export typed return values using types from `types/database.ts`
5. Handle errors with console.error and throw

### Adding a New Form
1. Create Zod schema in `src/types/forms.ts`
2. Create form component in `src/components/forms/`
3. Use React Hook Form with `@hookform/resolvers/zod`
4. Import UI components from `@/components/ui/`
5. Add submit handler that calls Supabase function and shows toast
6. Trigger parent component refresh after successful submission

### Modifying Database Schema
1. Update types in `src/types/database.ts`
2. Update affected Supabase query functions
3. Update form schemas if forms are affected
4. Update components that display the changed data
5. Test data flow: form → Supabase → refetch → UI update

## Path Aliases

- `@/*` maps to `src/*` (configured in tsconfig.json)
- All imports use absolute paths: `import { Button } from '@/components/ui/button'`

## Styling

- Tailwind CSS 4 with utility-first approach
- CSS variables for theming in `globals.css`
- `cn()` utility from `lib/utils.ts` for conditional classes
- Responsive breakpoints: sm, md, lg, xl
- Dark mode support via CSS variables (not theme toggle implemented)

## Important Files

- `src/types/database.ts` - Complete database schema and type definitions
- `src/lib/supabase/client.ts` - Client initialization (note typed vs. untyped pattern)
- `src/app/page.tsx` - Dashboard page, good reference for data fetching patterns
- `src/lib/supabase/bags-of-hope.ts` - Status transition logic and fulfillment functions
- `src/components/layout/AppLayout.tsx` - App-wide layout wrapper
