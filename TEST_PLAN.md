# Intake Form Testing Plan

## Prerequisites

### 1. Apply Database Fix (REQUIRED)
Before testing, you **MUST** apply the SQL fix to your Supabase database:

**Steps:**
1. Go to: https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/sql
2. Copy the entire contents of `apply-intake-fix.sql`
3. Paste into the SQL Editor
4. Click "Run" or press Cmd+Enter
5. Verify success message appears

**What This Does:**
- Removes the restrictive RLS policy blocking intake transactions
- Creates a new policy allowing all authenticated users to create transactions
- Auto-creates staff profiles for new and existing users

---

## Test Environment

- **Dev Server**: http://localhost:3000
- **Test Page**: http://localhost:3000/intake
- **Database**: Supabase Cloud (yzomcvqfdrqhmcuribhv.supabase.co)

---

## Test Cases

### Test 1: Basic Intake Logging (Donation, New Condition)

**Steps:**
1. Navigate to http://localhost:3000/intake
2. Leave filters as "All ages" and "All"
3. Select any category (e.g., "Baby Boy Tops")
4. Keep quantity as 1
5. Ensure "Donation" is checked
6. Ensure "New" is checked
7. Click "Log Intake"

**Expected Result:**
- ✅ Success toast appears: "Added 1 Baby Boy Tops"
- ✅ Value displays in toast (e.g., "Value: $8.00")
- ✅ Session summary updates showing:
  - Total Items: 1
  - Total Value: $8.00
  - Transaction listed in summary

**If It Fails:**
- Check browser console (F12) for error messages
- Verify you applied the SQL fix in Supabase
- Check Network tab for 401/403 errors (authentication issue)

---

### Test 2: Intake with Used Condition (50% Value)

**Steps:**
1. Select a category (e.g., "School Age Girl Bottoms")
2. Quantity: 3
3. Source: Donation
4. Condition: Select "Used"
5. Click "Log Intake"

**Expected Result:**
- ✅ Success toast: "Added 3 School Age Girl Bottoms"
- ✅ Value should be 50% of new value × quantity
  - Example: If new = $15.00, used = $7.50 × 3 = $22.50
- ✅ Session summary updates correctly

---

### Test 3: Purchase with Receipt Reference

**Steps:**
1. Select a category
2. Quantity: 2
3. Source: Select "Purchase" checkbox
4. Condition: New
5. Receipt Reference field appears - enter "RCP-12345"
6. Click "Log Intake"

**Expected Result:**
- ✅ Success toast appears
- ✅ Receipt reference is saved (verify in database)
- ✅ Session summary updates

---

### Test 4: Multiple Items (Add Another)

**Steps:**
1. Select category (e.g., "Toys")
2. Quantity: 5
3. Click "Log & Add Another"
4. Verify category stays selected
5. Change quantity to 3
6. Click "Log & Add Another" again
7. Repeat 2-3 times

**Expected Result:**
- ✅ Each submission shows success toast
- ✅ Category remains selected after each submission
- ✅ Session summary accumulates all transactions
- ✅ Total Items and Total Value update correctly

---

### Test 5: Filter by Age Group and Gender

**Steps:**
1. Select Age Group: "Toddler"
2. Select Gender: "Girl"
3. Open Category dropdown

**Expected Result:**
- ✅ Only toddler girl categories shown (e.g., "Toddler Girl Tops", "Toddler Girl Bottoms")
- ✅ Neutral categories also shown (e.g., "Toiletries", "Toys")
- ✅ No baby, school age, or teen categories visible

---

### Test 6: Value Calculation Display

**Steps:**
1. Select "Teen Boy Bottoms" (standard value: $20.00)
2. Quantity: 4
3. Condition: New
4. Observe "Calculated Value" section

**Expected Result:**
- ✅ Shows: $80.00 (4 × $20.00)
- ✅ Shows: "New @ $20.00 each"

5. Change condition to "Used"

**Expected Result:**
- ✅ Shows: $40.00 (4 × $10.00, since used is 50%)
- ✅ Shows: "Used @ $10.00 each"

---

### Test 7: Reset Form

**Steps:**
1. Select a category
2. Change quantity to 10
3. Add notes: "Test notes"
4. Click "Reset" button

**Expected Result:**
- ✅ Category cleared
- ✅ Quantity back to 1
- ✅ Notes cleared
- ✅ Filters reset to "All ages" and "All"
- ✅ Session summary unchanged (previous transactions remain)

---

### Test 8: Verify Data in Dashboard

**Steps:**
1. After logging several intake transactions
2. Navigate to http://localhost:3000 (Dashboard)
3. Check the inventory table

**Expected Result:**
- ✅ Inventory levels updated for categories you logged
- ✅ "Quantity on Hand" increased
- ✅ "Last Intake" timestamp shows today
- ✅ Recent transactions shown in activity feed

---

## Common Issues and Troubleshooting

### Issue: "Failed to log intake" error

**Possible Causes:**
1. **RLS Policy Not Applied**
   - Solution: Apply `apply-intake-fix.sql` in Supabase SQL Editor

2. **Not Authenticated**
   - Solution: Sign in/up at your auth page
   - Check: Browser console should show user authenticated

3. **Network Error**
   - Solution: Check `.env` file has correct Supabase URL and key
   - Verify: Can you access other pages that read data?

### Issue: Success toast appears but inventory doesn't update

**Diagnosis:**
- Transaction created but triggers not firing
- Check Supabase logs for trigger errors
- Verify migrations were applied in order

### Issue: Browser console shows 401 Unauthorized

**Solution:**
- User not authenticated
- Sign out and sign back in
- Clear browser cache and cookies
- Check Supabase Auth settings

### Issue: Browser console shows 403 Forbidden

**Solution:**
- RLS policy still blocking
- Verify you ran the SQL fix
- Check: `SELECT * FROM staff_profiles WHERE id = auth.uid()`
- Should return a row with `can_intake = true`

---

## Verification Queries

Run these in Supabase SQL Editor to verify:

### Check RLS Policy
```sql
SELECT * FROM pg_policies
WHERE tablename = 'inventory_transactions'
AND policyname = 'Authenticated users can create transactions';
```
Should return 1 row.

### Check Staff Profiles Created
```sql
SELECT COUNT(*) FROM staff_profiles;
```
Should match number of auth.users.

### Check Recent Transactions
```sql
SELECT
  it.*,
  c.name as category_name
FROM inventory_transactions it
JOIN categories c ON c.id = it.category_id
ORDER BY it.created_at DESC
LIMIT 10;
```
Should show your test transactions.

---

## Success Criteria

All tests pass when:
- ✅ SQL fix applied successfully
- ✅ Can log intake transactions without errors
- ✅ Success toasts appear for each submission
- ✅ Session summary updates correctly
- ✅ Dashboard shows updated inventory levels
- ✅ No console errors in browser
- ✅ Database contains transaction records
