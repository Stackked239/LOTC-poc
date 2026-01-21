# Task Completion Checklist

When completing a task in this project, follow these steps:

## 1. Code Quality
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Fix any linting issues before committing
- [ ] Ensure TypeScript types are properly defined (no `any` types)
- [ ] Verify proper use of typed vs. untyped Supabase clients

## 2. Testing
- [ ] Test functionality in the browser (http://localhost:3000)
- [ ] Verify data flow: form → Supabase → refetch → UI update
- [ ] Check loading states display correctly
- [ ] Verify error handling shows user-friendly messages
- [ ] Test responsive design on mobile and desktop breakpoints

## 3. Code Style
- [ ] Use absolute imports with `@/` prefix
- [ ] Follow naming conventions (PascalCase components, camelCase functions)
- [ ] Add `'use client'` directive for client components
- [ ] Use `cn()` utility for conditional Tailwind classes
- [ ] Keep Tailwind classes utility-first

## 4. Type Safety
- [ ] Import types from `types/database.ts`
- [ ] Define form schemas in `types/forms.ts` with Zod
- [ ] Use helper types for joined data
- [ ] Ensure proper type inference

## 5. Data Layer
- [ ] Add queries to appropriate file in `lib/supabase/`
- [ ] Use typed client for reads, untyped client for writes
- [ ] Handle errors with console.error and throw
- [ ] Export typed return values

## 6. Documentation
- [ ] Update CLAUDE.md if architectural patterns change
- [ ] Add comments for complex business logic
- [ ] Update type definitions if database schema changes

## 7. Git
- [ ] Stage changes: `git add .`
- [ ] Commit with descriptive message: `git commit -m "feat: description"`
- [ ] Push to remote: `git push`

## 8. Build Verification
- [ ] Run `npm run build` to ensure production build succeeds
- [ ] Fix any build errors or warnings
