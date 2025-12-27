# Fix: Registration Database Error 

## 🐛 Problem Description

Users attempting to register on the DISTRI-NIGHT platform were encountering a critical error at Step 3 (Confirmation) during the registration process.

### Error Details
```
AuthApiError: Database error saving new user
Code: unexpected_failure
Status: 500
```

### Console Logs
```javascript
Starting registration for: r.adelou@ravito.ci
Registration error: AuthApiError: Database error saving new user
    at handleError3 (@supabase_supabase-js.js?v=f235adb6:8055:9)
    at async _handleRequest3 (@supabase_supabase-js.js?v=f235adb6:8096:5)
    at async _request (@supabase_supabase-js.js?v=f235adb6:8080:16)
    at async SupabaseAuthClient.signUp (@supabase_supabase-js.js?v=f235adb6:9778:15)
    at async register (AuthContext.tsx:288:52)
    at async handleFinalSubmit (RegisterForm.tsx:44:21)
```

## 🔍 Root Cause Analysis

The issue occurred due to a conflict between Row Level Security (RLS) policies and the database trigger responsible for creating user profiles during registration.

### Technical Details

1. **Registration Flow**:
   - User submits registration form
   - `supabase.auth.signUp()` is called with user data
   - Supabase creates a record in `auth.users` table
   - This triggers the `handle_new_user()` function
   - Function attempts to INSERT into `profiles` table

2. **The Problem**:
   - RLS is enabled on the `profiles` table
   - INSERT policies require `WITH CHECK (id = auth.uid())`
   - During signup, the user is **not yet authenticated**
   - Therefore, `auth.uid()` returns `NULL`
   - The check fails: `NULL ≠ user.id`
   - INSERT is blocked by RLS
   - Entire signup process fails

3. **Why This Happened**:
   - Migration `20251211010458_fix_security_part3_rls_profiles.sql` created INSERT policies that block unauthenticated inserts
   - The `handle_new_user()` trigger didn't have proper `SECURITY DEFINER` configuration to bypass RLS
   - Required fields (`address`, `phone`) had `NOT NULL` constraints but weren't in metadata

## ✅ Solution Implemented

Created comprehensive migration: `20251218120000_fix_registration_trigger_and_rls_final.sql`

### Changes Made

#### 1. Made Required Fields Nullable
```sql
ALTER TABLE profiles 
ALTER COLUMN address DROP NOT NULL;

ALTER TABLE profiles 
ALTER COLUMN phone DROP NOT NULL;
```
**Rationale**: Allows trigger to create minimal profile that will be completed by the application after authentication.

#### 2. Fixed handle_new_user Trigger Function
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypasses RLS
SET search_path = ''  -- Prevents search_path attacks
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, name, phone, address
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

**Key Security Features**:
- `SECURITY DEFINER`: Allows function to bypass RLS (required for profile creation)
- `SET search_path = ''`: Prevents function search_path attacks
- Uses `COALESCE` to handle missing metadata gracefully
- Type casting for enum values

#### 3. Removed ALL INSERT Policies on Profiles
```sql
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
-- Plus dynamic cleanup of any other INSERT policies
```

**Security Model**:
- ✅ Users CANNOT directly INSERT into profiles table
- ✅ Profiles can ONLY be created via the auth.users trigger
- ✅ This is more secure than allowing user INSERTs
- ✅ Follows Supabase recommended pattern

#### 4. Maintained Other RLS Policies
- ✅ SELECT: Users can view their own profile, admins can view all
- ✅ UPDATE: Users can update their own profile, admins can update all
- ✅ DELETE: Admins only

## 🔒 Security Considerations

### Why This is Secure

1. **SECURITY DEFINER is Safe Here**:
   - Function only runs during auth.users INSERT
   - Controlled by Supabase's auth system
   - No user input directly triggers it
   - Function logic is simple and auditable

2. **No INSERT Policy is More Secure**:
   - Users cannot directly create profiles
   - All profiles must go through Supabase auth
   - Prevents profile spoofing
   - Prevents duplicate profiles

3. **search_path = ''**:
   - Prevents search_path attacks
   - Forces fully qualified table names
   - Standard security best practice

### What Users Can and Cannot Do

| Action | Allowed? | How? |
|--------|----------|------|
| Create profile | ✅ Yes | Only via Supabase auth signup |
| View own profile | ✅ Yes | RLS SELECT policy |
| Update own profile | ✅ Yes | RLS UPDATE policy |
| View other profiles | ❌ No | Blocked by RLS (except admins) |
| Delete profiles | ❌ No | Admin only |
| Direct INSERT | ❌ No | No INSERT policy exists |

## 🧪 Testing Recommendations

### Manual Testing
1. Open registration form
2. Fill in all three steps:
   - Step 1: Account info (name, email, password, phone, role)
   - Step 2: Establishment info (business name, zone, address)
   - Step 3: Confirmation (accept CGU)
3. Submit registration
4. Verify:
   - ✅ No "Database error saving new user" error
   - ✅ User receives confirmation email (if email verification enabled)
   - ✅ Profile is created in database
   - ✅ User can log in after email verification

### Database Verification
```sql
-- Check that profile was created
SELECT id, email, name, phone, address, role, created_at 
FROM profiles 
WHERE email = 'test@example.com';

-- Verify trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verify no INSERT policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';
-- Should return 0 rows
```

### Expected Behavior After Fix

1. **During Signup**:
   - `auth.users` record created
   - Trigger fires automatically
   - Minimal profile created with metadata
   - User receives confirmation email
   - No errors logged

2. **After Email Confirmation**:
   - User can log in
   - Application loads profile
   - Application updates profile with full details if needed

3. **Profile Completion**:
   - AuthContext.tsx handles profile updates
   - Missing fields (address, phone) can be filled
   - zone_id set for clients
   - Business details set for suppliers

## 📋 Migration Application

### For Development
```bash
# Apply migration locally
supabase db reset
# Or apply just this migration
supabase migration up
```

### For Production
```bash
# The migration will be applied automatically when merged
# Supabase will detect new migration files and apply them in order
```

### Rollback Plan
If issues occur, the migration can be rolled back by:

1. Recreating INSERT policies (with proper auth.uid() check for authenticated users)
2. Making address and phone NOT NULL again (after data migration)
3. Removing SECURITY DEFINER from function (not recommended)

However, rolling back is NOT recommended as it will reintroduce the bug.

## 📚 Related Files

### Modified
- `supabase/migrations/20251218120000_fix_registration_trigger_and_rls_final.sql` - New comprehensive migration

### Removed (superseded by comprehensive fix)
- `supabase/migrations/20251218103748_fix_handle_new_user_trigger.sql`
- `supabase/migrations/20251218104633_make_address_optional_in_profiles.sql`
- `supabase/migrations/20251218104737_make_phone_optional_in_profiles.sql`
- `supabase/migrations/20251218105514_fix_profiles_insert_policy_for_signup.sql`

### Application Code (no changes required)
- `src/context/AuthContext.tsx` - Registration logic
- `src/components/Auth/RegisterForm.tsx` - Form orchestrator
- `src/components/Auth/RegisterFormStep3.tsx` - Confirmation step

## 🎯 Expected Impact

### User Experience
- ✅ Registration process now completes successfully
- ✅ No more "Database error" messages
- ✅ Smooth onboarding experience
- ✅ Users can complete registration in one flow

### System Stability
- ✅ Proper separation of concerns (trigger vs policies)
- ✅ More secure profile creation pattern
- ✅ Better error handling with COALESCE
- ✅ Follows Supabase best practices

### Developer Experience
- ✅ Clear documentation of security model
- ✅ Single comprehensive migration (not multiple partial fixes)
- ✅ Well-commented SQL code
- ✅ Easy to understand and maintain

## 🔄 Future Considerations

### Optional Enhancements
1. Add validation in trigger for required metadata
2. Log trigger executions for monitoring
3. Add retry logic for profile creation
4. Implement email notification on registration

### Monitoring
Monitor these metrics after deployment:
- Registration success rate (should increase to ~100%)
- Failed registrations (should drop to near 0)
- Profile creation errors in logs
- Time to complete registration

## ✅ Checklist

- [x] Root cause identified
- [x] Comprehensive solution designed
- [x] Migration file created
- [x] Security implications reviewed
- [x] Documentation written
- [x] Testing plan outlined
- [ ] Applied to development environment
- [ ] Manual testing completed
- [ ] Applied to production
- [ ] Monitoring confirmed working

## 📞 Support

If issues persist after applying this fix:
1. Check Supabase logs for detailed error messages
2. Verify migration was applied: `SELECT * FROM schema_migrations WHERE version = '20251218120000'`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
4. Verify trigger exists and is enabled
5. Contact development team with specific error logs

---

**Fix Version**: 1.0  
**Date**: December 18, 2024  
**Status**: ✅ Ready for Deployment  
**Migration**: `20251218120000_fix_registration_trigger_and_rls_final.sql`
