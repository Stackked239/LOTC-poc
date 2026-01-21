# Architecture Patterns

## Key Design Patterns

### 1. Client-Side Filtering Pattern
Large datasets (inventory levels, alerts) are fetched once and filtered client-side:
```typescript
// Fetch all data once
const allLevels = await getInventoryLevels()
// Filter client-side for responsive UI
const filtered = allLevels.filter(level => 
  level.age_group === selectedAge && 
  level.item_type.includes(searchTerm)
)
```
**Benefit**: Reduces database queries while maintaining responsive UI

### 2. Data Flow Pattern
**Inventory Transactions**:
1. User submits form (intake/pick)
2. Transaction created with automatic `unit_value` from category
3. Database triggers update `inventory_levels` table
4. Database triggers generate journal entries

**Bag Fulfillment Flow**:
1. Create bag (pending status) with child demographics
2. Start picking → status: picking
3. Complete pick with items → creates pick transactions, status: packing
4. Complete packing → status: ready_to_ship
5. Add to batch or ship individually → status: in_transit
6. Mark delivered

### 3. Status Transition Validation
Enforced in `updateBagStatus()` via `STATUS_TRANSITIONS` map:
```typescript
const STATUS_TRANSITIONS = {
  pending: ['picking'],
  picking: ['packing'],
  packing: ['ready_to_ship'],
  // etc.
}
```
Cannot skip stages or make invalid transitions.

### 4. Component Architecture
- **Layout**: All pages wrapped in `AppLayout` (sidebar + navbar)
- **Forms**: React Hook Form + Zod validation, Sonner toasts for feedback
- **Data Fetching**: `useEffect` for client components, async functions for server
- **Loading States**: Skeleton UI with `animate-pulse`
- **Error States**: User-friendly messages with retry mechanism

### 5. Type Safety Pattern
```typescript
// Database types
import { Category, InventoryTransaction } from '@/types/database'

// Form types
import { IntakeFormData, intakeFormSchema } from '@/types/forms'

// Extended types for joins
type InventoryLevelWithCategory = InventoryLevel & {
  category: Category
}
```

## Business Rules

### Inventory Transactions
- Intake increases inventory (positive quantity)
- Pick decreases inventory (negative in DB via triggers)
- Unit values from category's `standard_value_new` or `standard_value_used`
- Total value = quantity × unit_value

### Reorder Alerts
- Triggered when `quantity_on_hand < reorder_point`
- Only shown for active categories
- Dashboard displays count badge

### Accounting Integration
- Journal entries auto-generated from inventory transactions
- Double-entry bookkeeping with debit/credit accounts
- Workflow: draft → approved → exported
