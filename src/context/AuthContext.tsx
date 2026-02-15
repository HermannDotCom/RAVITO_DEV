import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { setUser as setSentryUser } from '../lib/sentry';
import { 
  cacheAuthSession, 
  getCachedAuthSession, 
  clearAuthSessionCache,
  cacheUserProfile,
  getCachedUserProfile,
  clearAllOfflineCache
} from '../lib/offlineStorage';
import { syncManager } from '../lib/syncManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  refreshUserProfile: () => Promise<boolean>;
  isLoading: boolean;
  isInitializing: boolean;
  sessionError: string | null;
  refreshSession: () => Promise<boolean>;
  clearSessionError: () => void;
  setSessionError: (error: string | null) => void;
  isOfflineMode: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  zoneId?: string;
  businessName?: string;
  responsiblePerson?: string;
  businessHours?: string;
  coverageZone?: string;
  deliveryCapacity?: 'truck' | 'tricycle' | 'motorcycle';
  registeredBySalesRepId?: string; // Commercial qui inscrit (optionnel)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const initStartedRef = React.useRef(false);
  const refreshAttemptsRef = React.useRef(0);
  const MAX_REFRESH_ATTEMPTS = 2;

  const fetchUserProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Vérifier IMMÉDIATEMENT si on est en train de réinitialiser le mot de passe
      const isResettingPassword = sessionStorage.getItem('resetting_password') === 'true';
      if (isResettingPassword) {
        console.log('⏭️ Skipping profile fetch during password reset');
        return false;
      }

      console.log('Fetching profile for user:', userId);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      if (!profile) {
        console.error('Profile not found for user:', userId);
        console.error('This usually means the profile does not exist in the database or RLS policies are blocking access');
        return false;
      }

      console.log('Profile found:', { id: profile.id, role: profile.role, name: profile.name });
      const { data: authUserData } = await supabase.auth.getUser();

      let coordinates = undefined;

      const mappedUser: User = {
        id: profile.id,
        email: authUserData.user?.email || '',
        role: profile.role as UserRole,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        coordinates,
        zoneId: profile.zone_id || undefined,
        rating: profile.rating || 5.0,
        totalOrders: profile.total_orders || 0,
        isActive: profile.is_active,
        isApproved: profile.is_approved,
        approvalStatus: profile.approval_status as 'pending' | 'approved' | 'rejected',
        approvedAt: profile.approved_at ? new Date(profile.approved_at) : undefined,
        rejectedAt: profile.rejected_at ? new Date(profile.rejected_at) : undefined,
        rejectionReason: profile.rejection_reason || undefined,
        createdAt: new Date(profile.created_at),
        businessName: profile.business_name || undefined,
        businessHours: profile.business_hours || undefined,
        responsiblePerson: profile.responsible_person || undefined,
        coverageZone: profile.coverage_zone || undefined,
        deliveryCapacity: profile.delivery_capacity as any || undefined,
        deliveryLatitude: profile.delivery_latitude || null,
        deliveryLongitude: profile.delivery_longitude || null,
        deliveryInstructions: profile.delivery_instructions || null,
        storefrontImageUrl: profile.storefront_image_url || null,
        registeredBySalesRepId: profile.registered_by_sales_rep_id || null,
        isSuperAdmin: profile.is_super_admin || false
      };

      setUser(mappedUser);
      console.log('User set successfully:', mappedUser.email);
      
      // Cache user profile for offline access
      await cacheUserProfile(userId, mappedUser);
      
      // Définir l'utilisateur dans Sentry pour le tracking
      setSentryUser({
        id: mappedUser.id,
        email: mappedUser.email,
        role: mappedUser.role,
      });
      
      return true;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      await supabase.auth.signOut();
      return false;
    }
  }, []);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    let initializing = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check if online
        const isOnline = navigator.onLine && syncManager.getIsOnline();
        
        if (!isOnline) {
          console.log('📵 Offline mode detected, checking for cached session...');
          
          // Try to load cached session
          const cachedAuth = await getCachedAuthSession();
          
          if (cachedAuth) {
            console.log('✅ Cached session found, loading offline mode...');
            setSession(cachedAuth.session);
            setIsOfflineMode(true);
            
            // Try to load cached user profile
            const cachedProfile = await getCachedUserProfile(cachedAuth.user.id);
            if (cachedProfile) {
              console.log('✅ Cached profile found:', cachedProfile.email);
              setUser(cachedProfile);
              
              // Set Sentry user
              setSentryUser({
                id: cachedProfile.id,
                email: cachedProfile.email,
                role: cachedProfile.role,
              });
            } else {
              console.warn('⚠️ No cached profile found');
            }
          } else {
            console.log('⚠️ No cached session found, user needs to login online');
          }
          
          setIsInitializing(false);
          return;
        }
        
        // Online: Try to get session from Supabase
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          
          // If error, try to fall back to cached session
          const cachedAuth = await getCachedAuthSession();
          if (cachedAuth) {
            console.log('⚠️ Supabase session error, using cached session as fallback');
            setSession(cachedAuth.session);
            setIsOfflineMode(true);
            
            const cachedProfile = await getCachedUserProfile(cachedAuth.user.id);
            if (cachedProfile) {
              setUser(cachedProfile);
              setSentryUser({
                id: cachedProfile.id,
                email: cachedProfile.email,
                role: cachedProfile.role,
              });
            }
          }
          
          setIsInitializing(false);
          return;
        }

        console.log('Session retrieved:', currentSession ? 'Active session' : 'No session');
        setSession(currentSession);
        setIsOfflineMode(false);

        if (currentSession?.user) {
          // Cache the session
          await cacheAuthSession(currentSession, currentSession.user);
          
          const success = await fetchUserProfile(currentSession.user.id);
          if (!success) {
            console.warn('Failed to fetch profile during initialization');
          }
          
          // Cache user data for offline access
          if (success && user) {
            try {
              // Get organization ID if exists
              const { data: orgMember } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', currentSession.user.id)
                .eq('status', 'active')
                .maybeSingle();
              
              if (orgMember?.organization_id) {
                await syncManager.cacheUserData(currentSession.user.id, orgMember.organization_id);
              } else {
                await syncManager.cacheUserData(currentSession.user.id);
              }
            } catch (cacheError) {
              console.warn('Non-critical: Failed to cache user data:', cacheError);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Try to load cached session as last resort
        try {
          const cachedAuth = await getCachedAuthSession();
          if (cachedAuth) {
            console.log('🔄 Error during init, using cached session as fallback');
            setSession(cachedAuth.session);
            setIsOfflineMode(true);
            
            const cachedProfile = await getCachedUserProfile(cachedAuth.user.id);
            if (cachedProfile) {
              setUser(cachedProfile);
              setSentryUser({
                id: cachedProfile.id,
                email: cachedProfile.email,
                role: cachedProfile.role,
              });
            }
          }
        } catch (cacheError) {
          console.error('Failed to load cached session:', cacheError);
        }
      } finally {
        console.log('Auth initialization complete');
        initializing = false;
        setIsInitializing(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (initializing) {
        console.warn('Auth initialization timeout - forcing completion');
        initializing = false;
        setIsInitializing(false);
      }
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (initializing) {
        console.log('Ignoring auth state change during initialization:', event);
        return;
      }

      console.log('Auth state changed:', event);
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        // Cache session on sign in
        await cacheAuthSession(newSession, newSession.user);
        setIsOfflineMode(false);
        
        await fetchUserProfile(newSession.user.id);
        
        // Cache user data
        try {
          const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', newSession.user.id)
            .eq('status', 'active')
            .maybeSingle();
          
          if (orgMember?.organization_id) {
            await syncManager.cacheUserData(newSession.user.id, orgMember.organization_id);
          } else {
            await syncManager.cacheUserData(newSession.user.id);
          }
        } catch (error) {
          console.warn('Non-critical: Failed to cache user data on sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsOfflineMode(false);
        // Clear cached data on sign out
        await clearAuthSessionCache();
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        await cacheAuthSession(newSession, newSession.user);
        await fetchUserProfile(newSession.user.id);
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
        // Update cached session when token is refreshed
        await cacheAuthSession(newSession, newSession.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (!user || !session) return;

    if (user.isApproved || user.role === 'admin') return;

    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated via realtime:', payload);
          fetchUserProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.isApproved, user?.role, session, fetchUserProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('=== LOGIN START ===');
      console.log('Attempting login for:', email);
      console.log('Timestamp:', new Date().toISOString());

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user && data.session) {
        console.log('Auth successful! User ID:', data.user.id);
        console.log('Session created:', !!data.session);
        console.log('Now fetching profile...');

        // Cache session immediately after successful login
        await cacheAuthSession(data.session, data.user);

        const profileSuccess = await fetchUserProfile(data.user.id);

        // Cache user data for offline access
        if (profileSuccess) {
          try {
            const { data: orgMember } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', data.user.id)
              .eq('status', 'active')
              .maybeSingle();
            
            if (orgMember?.organization_id) {
              await syncManager.cacheUserData(data.user.id, orgMember.organization_id);
            } else {
              await syncManager.cacheUserData(data.user.id);
            }
          } catch (cacheError) {
            console.warn('Non-critical: Failed to cache user data after login:', cacheError);
          }
        }

        console.log('Profile fetch result:', profileSuccess);
        console.log('=== LOGIN END ===');
        setIsLoading(false);
        setIsOfflineMode(false);
        return profileSuccess;
      }

      console.error('No user returned from signInWithPassword');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login exception:', error);
      console.error('Exception stack:', error instanceof Error ? error.stack : 'No stack trace');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Starting registration for:', userData.email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            business_name: userData.businessName || null
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        setIsLoading(false);
        return false;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        setIsLoading(false);
        return false;
      }

      console.log('Auth user created, waiting for profile...');

      const maxRetries = 10;
      let profileFound = false;

      for (let i = 0; i < maxRetries && !profileFound; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Profile check ${i + 1}/${maxRetries}...`);

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile) {
          profileFound = true;
          console.log('Profile found, updating with additional data...');

          const updateData: Record<string, unknown> = {
            role: userData.role,
            name: userData.name,
            phone: userData.phone,
            address: userData.address,
          };

          // Add sales rep ID if provided
          if (userData.registeredBySalesRepId) {
            updateData.registered_by_sales_rep_id = userData.registeredBySalesRepId;
          }

          if (userData.role === 'client' && userData.zoneId) {
            updateData.zone_id = userData.zoneId;
          }

          if (userData.role === 'supplier') {
            updateData.business_name = userData.businessName || null;
            updateData.business_hours = userData.businessHours || null;
            updateData.responsible_person = userData.responsiblePerson || null;
            updateData.coverage_zone = userData.coverageZone || null;
            updateData.delivery_capacity = userData.deliveryCapacity || null;
          }

          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', authData.user.id);

          // Call edge function to ensure profile and organization are created
          try {
            console.log('Calling post-registration edge function...');
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (token) {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-registration`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: authData.user.id,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role,
                    businessName: userData.businessName || userData.name,
                  }),
                }
              );

              if (response.ok) {
                const result = await response.json();
                console.log('Post-registration completed:', result);
              } else {
                const error = await response.json();
                console.error('Post-registration error:', error);
              }
            }
          } catch (error) {
            console.error('Edge function call failed (non-critical):', error);
          }

          const success = await fetchUserProfile(authData.user.id);
          setIsLoading(false);
          return success;
        }
      }

      if (!profileFound) {
        console.error('Profile not created by trigger, logging out');
        await supabase.auth.signOut();
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Registration exception:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSessionError(null);
      setIsOfflineMode(false);
      refreshAttemptsRef.current = 0;
      
      // Clear all offline cache on logout
      await clearAllOfflineCache();
      
      // Effacer l'utilisateur de Sentry lors de la déconnexion
      setSentryUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Attempts to refresh the session
   * Returns true if successful, false otherwise
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Check if we've exceeded max attempts
    if (refreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS) {
      console.log('[AuthContext] Max refresh attempts reached');
      setSessionError('La récupération de session a échoué. Veuillez vous reconnecter.');
      return false;
    }

    refreshAttemptsRef.current += 1;

    try {
      console.log(`[AuthContext] Attempting session refresh (attempt ${refreshAttemptsRef.current}/${MAX_REFRESH_ATTEMPTS})`);
      
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[AuthContext] Session refresh failed:', error);
        
        if (refreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS) {
          setSessionError('La récupération de session a échoué. Veuillez vous reconnecter.');
        } else {
          setSessionError('Erreur lors de la récupération de session. Réessayez ou reconnectez-vous.');
        }
        
        return false;
      }

      if (data.session) {
        console.log('[AuthContext] Session refreshed successfully');
        setSession(data.session);
        setSessionError(null);
        refreshAttemptsRef.current = 0;
        
        // Cache refreshed session
        if (data.session.user) {
          await cacheAuthSession(data.session, data.session.user);
        }
        
        // Re-fetch user profile with new session
        if (data.session.user) {
          await fetchUserProfile(data.session.user.id);
        }
        
        return true;
      }

      console.warn('[AuthContext] No session returned after refresh');
      setSessionError('Session non trouvée. Veuillez vous reconnecter.');
      return false;

    } catch (error) {
      console.error('[AuthContext] Unexpected error during session refresh:', error);
      setSessionError('Une erreur inattendue s\'est produite. Veuillez vous reconnecter.');
      return false;
    }
  }, [fetchUserProfile]);

  /**
   * Clears the session error and resets refresh attempts
   */
  const clearSessionError = useCallback(() => {
    setSessionError(null);
    refreshAttemptsRef.current = 0;
  }, []);

  /**
   * Refresh the current user's profile from database
   */
  const refreshUserProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    return await fetchUserProfile(user.id);
  }, [user?.id, fetchUserProfile]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      register,
      refreshUserProfile,
      isLoading, 
      isInitializing,
      sessionError,
      refreshSession,
      clearSessionError,
      setSessionError,
      isOfflineMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};
