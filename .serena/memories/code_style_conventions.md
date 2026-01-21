# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`)
- **Target**: ES2017
- **Module**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to `src/*`

## Code Style Guidelines

### File Organization
- Use absolute imports: `import { Button } from '@/components/ui/button'`
- All files use `.tsx` for React components, `.ts` for utilities
- Client components must have `'use client'` directive at the top
- Server components (default) for SSR data fetching

### Component Patterns
- **Functional components** with TypeScript
- **React Hook Form** for all forms with Zod validation
- **Data fetching**: Client components use `useEffect`, server components use async functions
- **Loading states**: Show skeleton UI with `animate-pulse`
- **Error handling**: Log errors and show user-friendly messages

### Naming Conventions
- **Components**: PascalCase (e.g., `InventoryTable`, `BagCard`)
- **Files**: kebab-case for pages (e.g., `page.tsx`), PascalCase for components (e.g., `Navbar.tsx`)
- **Functions**: camelCase (e.g., `getInventoryLevels`, `updateBagStatus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `BAG_STATUS_LABELS`)
- **Types/Interfaces**: PascalCase (e.g., `InventoryTransaction`, `BagOfHope`)

### Type Safety
- Always export and use types from `types/database.ts`
- Define Zod schemas in `types/forms.ts` for form validation
- Use helper types for joined data (e.g., `InventoryLevelWithCategory`)
- Prefer type inference over explicit types where clear

### Styling
- **Tailwind CSS 4** utility-first approach
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Mobile-first responsive design with breakpoints: sm, md, lg, xl
- CSS variables for theming in `globals.css`

## Linting
- ESLint with Next.js configuration (`eslint-config-next`)
- Run `npm run lint` before committing
- Configuration in `eslint.config.mjs`
