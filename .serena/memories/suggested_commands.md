# Suggested Commands for LOTC Inventory System

## Development Commands

### Start Development Server
```bash
npm run dev
```
Opens at http://localhost:3000 with Turbopack hot reloading

### Build for Production
```bash
npm run build
```
Creates optimized production build in `.next/` directory

### Start Production Server
```bash
npm start
```
Runs production build locally (requires `npm run build` first)

### Run Linter
```bash
npm run lint
```
Runs ESLint with Next.js configuration

### Install Dependencies
```bash
npm install
```
Installs all dependencies from package.json

## Git Commands (Darwin/macOS)
```bash
git status              # Check working tree status
git add .               # Stage all changes
git commit -m "msg"     # Commit with message
git push                # Push to remote
git pull                # Pull from remote
git log --oneline -10   # View recent commits
```

## System Commands (Darwin/macOS)
```bash
ls -la                  # List files with details
cd <directory>          # Change directory
grep -r "pattern" .     # Search for pattern in files
find . -name "*.tsx"    # Find files by pattern
cat <file>              # Display file contents
```

## Environment Setup
Required `.env` or `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Navigation
- Dashboard: http://localhost:3000
- Intake: http://localhost:3000/intake
- Inventory: http://localhost:3000/inventory
- Pick Lists: http://localhost:3000/pick
- Fulfillment: http://localhost:3000/request
- Accounting: http://localhost:3000/accounting
- Settings: http://localhost:3000/settings
