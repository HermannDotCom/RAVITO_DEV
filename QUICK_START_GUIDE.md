# Quick Start Guide - RAVITO Pre-Launch Features

## 🚀 Quick Overview

This PR adds 3 main features:
1. **Sales Rep Selector** in registration
2. **Storefront Photo Upload** in profiles
3. **Cleaner Profile Pages**

---

## 📦 What You Need to Do

### 1. Create Storage Bucket (5 minutes)

Go to your [Supabase Dashboard](https://supabase.com/dashboard):

1. Select your RAVITO project
2. Click **Storage** in sidebar
3. Click **"New bucket"**
4. Enter name: `storefront-images`
5. Check ✅ **"Public bucket"**
6. Click **"Create bucket"**

✅ Done! The bucket is ready.

### 2. Run Migrations (2 minutes)

The migrations will run automatically, or you can run them manually:

```bash
supabase migration up
```

This creates:
- ✅ `sales_representatives` table
- ✅ Columns in `profiles` table
- ✅ Storage policies

### 3. Add Test Data (3 minutes)

Add some test sales reps to see the selector working:

```sql
INSERT INTO sales_representatives (name, phone, email, is_active) VALUES
  ('Kouamé Jean', '07 12 34 56 78', 'kouame.jean@ravito.ci', true),
  ('Diallo Mamadou', '07 23 45 67 89', 'diallo.mamadou@ravito.ci', true),
  ('Traoré Issa', '07 34 56 78 90', 'traore.issa@ravito.ci', true);
```

Run this in your Supabase SQL Editor.

---

## 🧪 Testing the Features

### Test 1: Sales Rep Selector (Registration)

1. Open app in **incognito mode**
2. Click **"S'inscrire"**
3. Choose **Client** or **Fournisseur**
4. Look for **"Commercial qui vous inscrit"** dropdown
5. Should show:
   - Default: "Inscription directe (sans commercial)"
   - The 3 sales reps you added

✅ **Expected**: Selector appears and shows sales reps

### Test 2: Storefront Photo Upload (Client Profile)

1. Login as a **Client**
2. Go to **"Mon Profil"**
3. Scroll down to **"📸 Photo de la devanture"**
4. Click **"Prendre une photo"** or **"Choisir un fichier"**
5. Select an image
6. Wait for compression and upload
7. See success message ✅

✅ **Expected**: Image appears, compressed to WebP < 500KB

### Test 3: Storefront Photo Upload (Supplier Profile)

1. Login as a **Fournisseur**
2. Go to **"Mon Profil"**
3. Scroll down to **"📸 Photo de la devanture"**
4. Upload an image
5. See success message ✅

✅ **Expected**: Image appears, old image deleted if exists

### Test 4: Profile Cleanup

**Client Profile**:
- ✅ Should NOT see duplicate "Statistics" in main content
- ✅ Should still see stats in left sidebar

**Supplier Profile**:
- ✅ Should NOT see "Performances" section
- ✅ Should NOT see "Évaluations récentes" section

---

## 📱 Mobile Testing

Test on mobile devices or mobile emulator:

1. **Camera Access**: "Prendre une photo" should open camera
2. **File Picker**: "Choisir un fichier" should open gallery
3. **Compression**: Large images should compress to < 500KB
4. **Responsive**: All UI should look good on small screens

---

## 🔍 Verify Everything Works

### Check Database

```sql
-- Check if tables exist
SELECT * FROM sales_representatives LIMIT 5;

-- Check if columns exist
SELECT registered_by_sales_rep_id, storefront_image_url 
FROM profiles LIMIT 5;
```

### Check Storage

1. Go to **Storage** > **storefront-images**
2. After uploading an image, you should see folder: `{user-id}/`
3. Inside: `storefront_1234567890.webp` (or similar)

### Check Policies

1. Go to **Storage** > **Policies**
2. Should see 4 policies for `storefront-images`:
   - Public read access ✅
   - Authenticated users can upload ✅
   - Users can update ✅
   - Users can delete ✅

---

## 🐛 Common Issues

### Issue: "Bucket does not exist"
**Fix**: Create the bucket in Supabase Dashboard (see step 1)

### Issue: Selector doesn't show
**Fix**: Add at least 1 active sales rep (see step 3)

### Issue: Upload fails
**Fix**: 
1. Check bucket is public
2. Check policies are created
3. Check image is JPEG/PNG/WebP

### Issue: Image too large
**Fix**: Compression should handle it. If not, file is probably > 5MB

---

## 📊 What Changed

### Files Created
- ✅ `src/services/salesRepresentativeService.ts`
- ✅ `src/services/storefrontImageService.ts`
- ✅ `src/hooks/useSalesRepresentatives.ts`
- ✅ `src/components/Shared/StorefrontImageUpload.tsx`
- ✅ 3 migration files

### Files Modified
- 📝 `src/components/Auth/RegisterFormStep1.tsx`
- 📝 `src/components/Client/ClientProfile.tsx`
- 📝 `src/components/Supplier/SupplierProfile.tsx`
- 📝 `src/context/AuthContext.tsx`
- 📝 `src/types/index.ts`

---

## 🎯 Success Criteria

All features working when:

- [x] Build completes without errors ✅
- [ ] Bucket created in Supabase
- [ ] Migrations applied successfully
- [ ] Sales reps selector appears in registration
- [ ] Image upload works on Client profile
- [ ] Image upload works on Supplier profile
- [ ] Images compressed to WebP < 500KB
- [ ] Old images deleted on new upload
- [ ] Profile pages cleaned up
- [ ] No regressions in other features

---

## 📚 More Info

- **Full Technical Details**: See `IMPLEMENTATION_SUMMARY_PRE_LAUNCH.md`
- **Step-by-Step Setup**: See `MANUAL_SETUP_INSTRUCTIONS.md`
- **Troubleshooting**: See section 7 in `MANUAL_SETUP_INSTRUCTIONS.md`

---

## 🆘 Need Help?

1. Check the error message in browser console
2. Check Supabase logs in Dashboard
3. Review `MANUAL_SETUP_INSTRUCTIONS.md`
4. Check storage policies are correct

---

## ⏱️ Estimated Time

- **Setup**: 10 minutes
- **Testing**: 15 minutes
- **Total**: 25 minutes

---

**Ready to go? Start with step 1: Create the storage bucket!** 🚀
