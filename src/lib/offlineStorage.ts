/**
 * Offline Storage Manager for RAVITO
 * Manages IndexedDB cache for user data, organization, subscription, and auth session
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User } from '../types';
import { Organization, OrganizationMember } from '../types/team';
import { Subscription } from '../types/subscription';
import { Session, User as AuthUser } from '@supabase/supabase-js';

const DB_NAME = 'ravito-offline-v2';
const DB_VERSION = 2;

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface AuthSessionCache {
  session: Session;
  user: AuthUser;
  timestamp: number;
  expiresAt: number;
}

interface OfflineDBSchema extends DBSchema {
  userProfile: {
    key: string;
    value: CachedData<User>;
  };
  organization: {
    key: string;
    value: CachedData<Organization>;
  };
  subscription: {
    key: string;
    value: CachedData<Subscription>;
  };
  teamMembers: {
    key: string;
    value: CachedData<OrganizationMember[]>;
  };
  authSession: {
    key: string;
    value: AuthSessionCache;
  };
  syncMeta: {
    key: string;
    value: {
      key: string;
      value: any;
      timestamp: number;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

/**
 * Initialize the offline database
 */
export const initOfflineDB = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading offline DB from version ${oldVersion} to ${newVersion}`);

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile');
      }
      if (!db.objectStoreNames.contains('organization')) {
        db.createObjectStore('organization');
      }
      if (!db.objectStoreNames.contains('subscription')) {
        db.createObjectStore('subscription');
      }
      if (!db.objectStoreNames.contains('teamMembers')) {
        db.createObjectStore('teamMembers');
      }
      if (!db.objectStoreNames.contains('authSession')) {
        db.createObjectStore('authSession');
      }
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta');
      }
    },
  });

  console.log('✅ Offline database initialized');
  return dbInstance;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = <T>(cached: CachedData<T> | undefined): boolean => {
  if (!cached) return false;
  return Date.now() < cached.expiresAt;
};

/**
 * Create cached data with TTL
 */
const createCachedData = <T>(data: T, ttl: number = CACHE_TTL): CachedData<T> => {
  const now = Date.now();
  return {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  };
};

// ============================================
// USER PROFILE CACHE
// ============================================

export const cacheUserProfile = async (userId: string, profile: User): Promise<void> => {
  const db = await initOfflineDB();
  await db.put('userProfile', createCachedData(profile), userId);
  console.log('✅ User profile cached:', userId);
};

export const getCachedUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('userProfile', userId);
    
    if (isCacheValid(cached)) {
      console.log('✅ Using cached user profile:', userId);
      return cached.data;
    }
    
    console.log('⚠️ Cached user profile expired or not found');
    return null;
  } catch (error) {
    console.error('Error getting cached user profile:', error);
    return null;
  }
};

export const clearUserProfileCache = async (userId: string): Promise<void> => {
  const db = await initOfflineDB();
  await db.delete('userProfile', userId);
  console.log('🗑️ User profile cache cleared:', userId);
};

// ============================================
// ORGANIZATION CACHE
// ============================================

export const cacheOrganization = async (orgId: string, organization: Organization): Promise<void> => {
  const db = await initOfflineDB();
  await db.put('organization', createCachedData(organization), orgId);
  console.log('✅ Organization cached:', orgId);
};

export const getCachedOrganization = async (orgId: string): Promise<Organization | null> => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('organization', orgId);
    
    if (isCacheValid(cached)) {
      console.log('✅ Using cached organization:', orgId);
      return cached.data;
    }
    
    console.log('⚠️ Cached organization expired or not found');
    return null;
  } catch (error) {
    console.error('Error getting cached organization:', error);
    return null;
  }
};

// ============================================
// SUBSCRIPTION CACHE
// ============================================

export const cacheSubscription = async (orgId: string, subscription: Subscription): Promise<void> => {
  const db = await initOfflineDB();
  await db.put('subscription', createCachedData(subscription), orgId);
  console.log('✅ Subscription cached for org:', orgId);
};

export const getCachedSubscription = async (orgId: string): Promise<Subscription | null> => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('subscription', orgId);
    
    if (isCacheValid(cached)) {
      console.log('✅ Using cached subscription for org:', orgId);
      return cached.data;
    }
    
    console.log('⚠️ Cached subscription expired or not found');
    return null;
  } catch (error) {
    console.error('Error getting cached subscription:', error);
    return null;
  }
};

// ============================================
// TEAM MEMBERS CACHE
// ============================================

export const cacheTeamMembers = async (orgId: string, members: OrganizationMember[]): Promise<void> => {
  const db = await initOfflineDB();
  await db.put('teamMembers', createCachedData(members), orgId);
  console.log('✅ Team members cached for org:', orgId);
};

export const getCachedTeamMembers = async (orgId: string): Promise<OrganizationMember[] | null> => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('teamMembers', orgId);
    
    if (isCacheValid(cached)) {
      console.log('✅ Using cached team members for org:', orgId);
      return cached.data;
    }
    
    console.log('⚠️ Cached team members expired or not found');
    return null;
  } catch (error) {
    console.error('Error getting cached team members:', error);
    return null;
  }
};

// ============================================
// AUTH SESSION CACHE
// ============================================

export const cacheAuthSession = async (session: Session, user: AuthUser): Promise<void> => {
  const db = await initOfflineDB();
  const now = Date.now();
  
  // Use session expiration if available, otherwise use default TTL
  const sessionExpiresAt = session.expires_at ? session.expires_at * 1000 : now + CACHE_TTL;
  
  const sessionCache: AuthSessionCache = {
    session,
    user,
    timestamp: now,
    expiresAt: sessionExpiresAt,
  };
  
  await db.put('authSession', sessionCache, 'current');
  console.log('✅ Auth session cached, expires at:', new Date(sessionExpiresAt));
};

export const getCachedAuthSession = async (): Promise<{ session: Session; user: AuthUser } | null> => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('authSession', 'current');
    
    if (!cached) {
      console.log('⚠️ No cached auth session found');
      return null;
    }
    
    // Check if session is still valid
    if (Date.now() < cached.expiresAt) {
      console.log('✅ Using cached auth session');
      return {
        session: cached.session,
        user: cached.user,
      };
    }
    
    console.log('⚠️ Cached auth session expired');
    return null;
  } catch (error) {
    console.error('Error getting cached auth session:', error);
    return null;
  }
};

export const clearAuthSessionCache = async (): Promise<void> => {
  const db = await initOfflineDB();
  await db.delete('authSession', 'current');
  console.log('🗑️ Auth session cache cleared');
};

// ============================================
// SYNC METADATA
// ============================================

export const setLastSyncTime = async (key: string, timestamp: number): Promise<void> => {
  const db = await initOfflineDB();
  await db.put('syncMeta', { key, value: timestamp, timestamp }, key);
};

export const getLastSyncTime = async (key: string): Promise<number | null> => {
  try {
    const db = await initOfflineDB();
    const meta = await db.get('syncMeta', key);
    return meta?.value || null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

// ============================================
// CLEAR ALL CACHE
// ============================================

export const clearAllOfflineCache = async (): Promise<void> => {
  const db = await initOfflineDB();
  
  await Promise.all([
    db.clear('userProfile'),
    db.clear('organization'),
    db.clear('subscription'),
    db.clear('teamMembers'),
    db.clear('authSession'),
    db.clear('syncMeta'),
  ]);
  
  console.log('🗑️ All offline cache cleared');
};

// ============================================
// CACHE STATISTICS
// ============================================

export const getCacheStats = async (): Promise<{
  hasUserProfile: boolean;
  hasOrganization: boolean;
  hasSubscription: boolean;
  hasTeamMembers: boolean;
  hasAuthSession: boolean;
  lastSync: number | null;
}> => {
  try {
    const db = await initOfflineDB();
    
    const [userProfiles, organizations, subscriptions, teamMembers, authSessions] = await Promise.all([
      db.count('userProfile'),
      db.count('organization'),
      db.count('subscription'),
      db.count('teamMembers'),
      db.count('authSession'),
    ]);
    
    const lastSync = await getLastSyncTime('global');
    
    return {
      hasUserProfile: userProfiles > 0,
      hasOrganization: organizations > 0,
      hasSubscription: subscriptions > 0,
      hasTeamMembers: teamMembers > 0,
      hasAuthSession: authSessions > 0,
      lastSync,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      hasUserProfile: false,
      hasOrganization: false,
      hasSubscription: false,
      hasTeamMembers: false,
      hasAuthSession: false,
      lastSync: null,
    };
  }
};
