# Offline-First Mode Implementation

## Overview

RAVITO now includes a complete offline-first functionality to handle network connectivity issues common in Côte d'Ivoire. Users can continue using the application even without an internet connection, with their data cached locally and synchronized when connectivity is restored.

## Features

### 1. **Session Persistence**
- Auth sessions are cached in IndexedDB
- Users remain logged in even after network loss
- Sessions automatically restore when the app is reopened offline

### 2. **Data Caching**
- User profile
- Organization details
- Subscription information
- Team members
- Cache expires after 7 days (configurable)

### 3. **Action Queue**
- Actions performed offline are queued for later synchronization
- Automatic retry mechanism with exponential backoff
- Maximum 3 retry attempts per action
- Descriptive error messages for failed actions

### 4. **Automatic Synchronization**
- Auto-sync when network connection is restored
- Manual sync button available
- Sync status indicators
- Progress tracking for sync operations

### 5. **UI Indicators**
- Offline mode banner at the top of the app
- Connection status indicator showing:
  - Online/offline state
  - Pending actions count
  - Last sync time
  - Manual sync button
  - Sync progress

## Technical Implementation

### Core Components

#### 1. `src/lib/offlineStorage.ts`
- IndexedDB wrapper using the `idb` library
- Manages caching of user data with TTL
- Functions:
  - `cacheUserProfile()` / `getCachedUserProfile()`
  - `cacheOrganization()` / `getCachedOrganization()`
  - `cacheSubscription()` / `getCachedSubscription()`
  - `cacheTeamMembers()` / `getCachedTeamMembers()`
  - `cacheAuthSession()` / `getCachedAuthSession()`
  - `clearAllOfflineCache()`
  - `getCacheStats()`

#### 2. `src/lib/syncManager.ts`
- Centralized sync management
- Listens to online/offline events
- Processes action queue
- Conflict resolution (server-wins strategy for v1)
- Functions:
  - `syncOfflineActions()` - Process pending actions
  - `forceSync()` - Manual sync trigger
  - `cacheUserData()` - Cache user-related data
  - Event handlers for status changes

#### 3. `src/hooks/useOffline.ts`
- React hook for offline state management
- Returns:
  - `isOnline`: Browser online status
  - `isOfflineMode`: App in offline mode
  - `hasPendingActions`: Has queued actions
  - `pendingActionsCount`: Number of pending actions
  - `lastSyncTime`: Last successful sync
  - `syncStatus`: Current sync status
  - `forceSync()`: Manual sync function

#### 4. `src/context/AuthContext.tsx`
- Enhanced with offline support
- Caches sessions on login/refresh
- Loads cached session when offline
- New prop: `isOfflineMode`

#### 5. `src/components/Shared/ConnectionStatusIndicator.tsx`
- Enhanced status indicator
- Shows pending actions count
- Manual sync button
- Last sync time display
- Auto-hides when fully connected

#### 6. `src/components/Shared/OfflineBanner.tsx`
- Banner shown at top when in offline mode
- Informs users of limited functionality

### Database Schema

The offline database (`ravito-offline-v2`) uses IndexedDB with the following stores:

```typescript
{
  userProfile: { key: userId, value: CachedData<User> }
  organization: { key: orgId, value: CachedData<Organization> }
  subscription: { key: orgId, value: CachedData<Subscription> }
  teamMembers: { key: orgId, value: CachedData<OrganizationMember[]> }
  authSession: { key: 'current', value: AuthSessionCache }
  syncMeta: { key: string, value: { timestamp, value } }
}
```

## User Scenarios

### Scenario 1: User loses network after login
1. ✅ User remains logged in (session cached)
2. ✅ Can view cached data (profile, team, subscription)
3. ✅ Actions are queued with status indicator
4. ✅ Offline banner shows at top
5. ✅ Auto-sync when network returns

### Scenario 2: User opens app without network
1. ✅ If cached session valid: auto-login with cached data
2. ✅ Offline banner shows "Mode hors ligne - Certaines fonctionnalités limitées"
3. ❌ Cannot create account or login (requires network)

### Scenario 3: Actions queued with conflicts
1. ✅ Sync attempts to execute queued actions
2. ✅ Server-wins conflict resolution (v1)
3. ✅ Failed actions logged with descriptive errors
4. ✅ Max 3 retries per action

## Configuration

### Cache TTL
Default: 7 days
Location: `src/lib/offlineStorage.ts`
```typescript
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Polling Interval
Default: 15 seconds (when offline)
Location: `src/hooks/useOffline.ts`
```typescript
const interval = setInterval(updatePendingActions, 15000);
```

### Max Retry Attempts
Default: 3 retries
Location: `src/lib/offlineManager/syncQueue.ts`
```typescript
const MAX_RETRIES = 3;
```

## Security Considerations

1. **No sensitive data in plain text**: Passwords are never cached
2. **Session expiration**: Cached sessions respect Supabase token expiration
3. **Secure storage**: IndexedDB is origin-isolated
4. **Cache clearing**: All cache cleared on logout

## Browser Support

Requires browsers with IndexedDB support:
- Chrome/Edge 24+
- Firefox 16+
- Safari 10+
- iOS Safari 10+
- Android Browser 4.4+

## Known Limitations

1. **First login requires network**: Cannot create account or login for first time offline
2. **Limited offline actions**: Some operations (subscriptions, payments) require network
3. **Cache size**: IndexedDB typically has ~50MB minimum quota
4. **Conflict resolution**: V1 uses server-wins strategy (may overwrite local changes)

## Future Enhancements

1. **Smart conflict resolution**: Detect and handle conflicts more intelligently
2. **Selective sync**: Allow users to choose what to sync
3. **Background sync**: Use Service Worker Background Sync API
4. **Offline analytics**: Track offline usage patterns
5. **Progressive data loading**: Load critical data first

## Testing

To test offline functionality:

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Select "Offline" from throttling dropdown

2. **Manual testing**:
   - Login while online
   - Disable network
   - Verify app remains functional
   - Perform actions (they should queue)
   - Re-enable network
   - Verify auto-sync

3. **Check cache**:
   - Open DevTools
   - Go to Application tab
   - Check IndexedDB > ravito-offline-v2

## Troubleshooting

### Issue: User not staying logged in offline
- Check if session is being cached (console logs)
- Verify IndexedDB is enabled in browser
- Check session expiration time

### Issue: Actions not syncing
- Check network connectivity
- Verify pending actions in IndexedDB
- Check sync status in indicator
- Look for errors in console

### Issue: Old cached data
- Cache expires after 7 days
- Manual logout clears all cache
- Check last sync time in indicator

## Dependencies

- `idb`: ^8.0.2 - IndexedDB wrapper library

## Files Modified/Created

### Created:
- `src/lib/offlineStorage.ts`
- `src/lib/syncManager.ts`
- `src/hooks/useOffline.ts`
- `src/components/Shared/OfflineBanner.tsx`

### Modified:
- `src/context/AuthContext.tsx`
- `src/components/Shared/ConnectionStatusIndicator.tsx`
- `src/App.tsx`
- `package.json`
