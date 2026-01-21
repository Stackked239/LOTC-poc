# LOTC Inventory Management System - Project Overview

## Purpose
A comprehensive Next.js application for managing "Bags of Hope" donation fulfillment workflow for Least of These Carolinas. The system tracks:
- Inventory intake (donations/purchases)
- Pick lists for fulfillment requests
- Batch shipping and courier management
- Accounting journal entries for financial tracking

## Core Business Domain
**Inventory System**: Categories with age groups (baby/toddler/school_age/teen/neutral), gender (boy/girl/neutral), and item types. Tracks new vs. used item valuations and inventory levels.

**Fulfillment Workflow**: Bags of Hope progress through stages:
- Pick Stage: pending → picking (creating bags for child requests)
- Pack Stage: packing (preparing picked items)
- Ship Stage: ready_to_ship → in_transit → ready_for_pickup → delivered

**Batch Shipping**: Groups multiple bags for courier pickup with tracking info

**Accounting Integration**: Auto-generated journal entries from inventory transactions with double-entry bookkeeping

## Tech Stack
- **Next.js 16.1.4** with App Router and Turbopack
- **React 19** with React Server Components
- **TypeScript 5** with strict mode enabled
- **Supabase** with SSR support (`@supabase/ssr`)
- **Tailwind CSS 4** with shadcn/ui components
- **React Hook Form + Zod** for form validation
- **Lucide React** for icons
- **Sonner** for toast notifications

## Project Structure
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components (layout, forms, ui)
├── lib/              # Business logic and utilities
│   ├── supabase/    # Database query functions
│   └── utils/       # Helper functions
└── types/           # TypeScript type definitions
```

## Key Features
- Dashboard with stats, inventory table, and reorder alerts
- Intake form for logging donations/purchases
- Pick list creation and management
- Bag fulfillment tracking (pick/pack/ship tabs)
- Batch shipping management
- Journal entries for accounting
- Category management with valuations
