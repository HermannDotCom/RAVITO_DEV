# Optimized Checkout Flow - Implementation Documentation

## Overview

This implementation adds an optimized checkout flow that pre-fills delivery address information from the user's profile, with the ability to modify it for specific orders.

## Features Implemented

### 1. LocationPicker Component (`src/components/Shared/LocationPicker.tsx`)

A reusable map component built with Mapbox GL that provides:

- **Interactive Map**: Drag-and-drop marker positioning
- **Search Functionality**: Address search with Mapbox Geocoding API
- **GPS Location**: Get current user location
- **Read-only Mode**: Display saved addresses without editing
- **Edit Mode**: Full interactivity for address selection
- **Delivery Instructions**: Optional field for delivery notes
- **Responsive Design**: Works on mobile and desktop

**Props:**
```typescript
interface LocationPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
  initialInstructions?: string;
  onLocationChange?: (location: LocationData) => void;
  readOnly?: boolean;
  height?: string;
  showSearchBar?: boolean;
  showGpsButton?: boolean;
  showInstructions?: boolean;
}
```

### 2. Checkout Form Enhancements

**Pre-fill from Profile:**
- Delivery zone
- Delivery address
- GPS coordinates (latitude/longitude)
- Delivery instructions

**New Checkbox:**
- "Modifier l'adresse de livraison pour cette commande"
- Toggles between read-only (profile address) and edit mode
- Default: uses profile address (checked = modify, unchecked = use profile)

**UI Improvements:**
- Removed "Mode de paiement" section (premature)
- Reduced "Frais RAVITO" font size (now `text-xs text-gray-500`)
- Cleaner, less cluttered interface

### 3. Client Profile Integration

The ClientProfile component now uses LocationPicker for address management:

- **Edit Mode**: Interactive map with search and GPS buttons
- **View Mode**: Read-only map display
- Saves coordinates and instructions to profile

### 4. Database Schema

New columns added to `profiles` table:
- `delivery_latitude` (DECIMAL(10, 8))
- `delivery_longitude` (DECIMAL(11, 8))
- `delivery_instructions` (TEXT)

New columns added to `orders` table:
- `delivery_latitude` (DECIMAL(10, 8))
- `delivery_longitude` (DECIMAL(11, 8))
- `delivery_instructions` (TEXT)
- `uses_profile_address` (BOOLEAN, default: true)

Migration file: `supabase/migrations/20251223121939_add_geolocation_columns.sql`

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

**Getting a Mapbox Token:**
1. Sign up at [mapbox.com](https://account.mapbox.com/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new token or use your default public token
4. Add it to your `.env` file

### Graceful Degradation

If `VITE_MAPBOX_TOKEN` is not configured:
- A warning message is displayed to users
- Map functionality is disabled
- Address can still be entered manually via text input
- No errors or crashes occur

## Benefits

1. **Faster Checkout**: Users don't need to re-enter address for every order
2. **Data Consistency**: Profile and order data stay synchronized
3. **Flexibility**: Can temporarily modify address for special deliveries
4. **Better UX**: Visual map interface is more intuitive than text input
5. **Accuracy**: GPS coordinates ensure precise location data
6. **Cleaner UI**: Removed distracting elements, reduced visual noise

## Usage Flow

### Client Perspective

1. **First Time Setup** (in Profile):
   - Click "Modifier" in profile
   - Use LocationPicker to set delivery address
   - Search or use GPS to find location
   - Add delivery instructions
   - Save profile

2. **Regular Checkout**:
   - Go to checkout
   - See profile address pre-filled (read-only map)
   - Review and confirm order

3. **Special Delivery** (different address):
   - Go to checkout
   - Check "Modifier l'adresse pour cette commande"
   - Interactive map appears
   - Select new location
   - Add special instructions
   - This address is saved to order only, profile unchanged

### Technical Flow

```
User Profile (AuthContext)
    ↓
CheckoutForm initialization
    ↓
State pre-filled from user data
    ↓
User modifies? (checkbox)
    ↓ No          ↓ Yes
Read-only    Edit mode
    ↓            ↓
Use profile  LocationPicker
coordinates  updates state
    ↓            ↓
    ↓←───────────↓
         ↓
Order submission
    ↓
OrderContext.placeOrder()
    ↓
orderService.createOrder()
    ↓
Save to database with:
- coordinates
- instructions  
- uses_profile_address flag
```

## Testing Checklist

- [ ] Build succeeds without errors
- [ ] Linter shows no new issues
- [ ] Profile page loads LocationPicker correctly
- [ ] Can save address in profile with coordinates
- [ ] Checkout pre-fills from profile
- [ ] Read-only map displays correctly
- [ ] Checkbox toggles between modes
- [ ] Can modify address for specific order
- [ ] Order saves with correct coordinates
- [ ] Works without Mapbox token (graceful degradation)
- [ ] Mobile responsive
- [ ] Search functionality works
- [ ] GPS button works (with permission)

## Known Limitations

1. **Mapbox Dependency**: Requires valid Mapbox token for full functionality
2. **Browser Permissions**: GPS feature needs user permission
3. **Alert() Usage**: Still uses browser alerts (consistent with existing codebase)
4. **Internet Required**: Map tiles require internet connection

## Future Improvements

1. Replace `alert()` with toast notification system
2. Add offline map caching
3. Add distance calculation to supplier
4. Add delivery zone boundaries visualization
5. Add favorite locations feature
6. Add address history/autocomplete

## Troubleshooting

**Map doesn't load:**
- Check `VITE_MAPBOX_TOKEN` is set
- Check browser console for errors
- Verify Mapbox token is valid

**GPS doesn't work:**
- Check browser permissions
- Ensure site is served over HTTPS (required for geolocation)

**Address search not working:**
- Verify Mapbox token has geocoding access
- Check network requests in browser DevTools

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Check Mapbox account status
4. Review migration was applied to database
