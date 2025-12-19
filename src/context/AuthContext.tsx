import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { setUser as setSentryUser } from '../lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  isLoading: boolean;
  isInitializing: boolean;
  sessionError: string | null;
  refreshSession: () => Promise<boolean>;
  clearSessionError: () => void;
  setSessionError: (error: string | null) => void;
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
  const initStartedRef = React.useRef(false);
  const refreshAttemptsRef = React.useRef(0);
  const MAX_REFRESH_ATTEMPTS = 2;

  const fetchUserProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
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

      console.log('Profile found:', { id: profile.id, role: profile.role, email: profile.email });
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
        deliveryCapacity: profile.delivery_capacity as any || undefined
      };

      setUser(mappedUser);
      console.log('User set successfully:', mappedUser.email);
      
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
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setIsInitializing(false);
          return;
        }

        console.log('Session retrieved:', currentSession ? 'Active session' : 'No session');
        setSession(currentSession);

        if (currentSession?.user) {
          const success = await fetchUserProfile(currentSession.user.id);
          if (!success) {
            console.warn('Failed to fetch profile during initialization');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
        await fetchUserProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        await fetchUserProfile(newSession.user.id);
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

      if (data.user) {
        console.log('Auth successful! User ID:', data.user.id);
        console.log('Session created:', !!data.session);
        console.log('Now fetching profile...');

        const profileSuccess = await fetchUserProfile(data.user.id);

        console.log('Profile fetch result:', profileSuccess);
        console.log('=== LOGIN END ===');
        setIsLoading(false);
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
            role: userData.role as 'client' | 'supplier',
            phone: userData.phone,
            address: userData.address
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

      console.log('Auth user created, waiting for profile to be available...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      let retries = 0;
      const maxRetries = 8;
      let profileFound = false;

      while (retries < maxRetries && !profileFound) {
        console.log(`Profile check attempt ${retries + 1}/${maxRetries}...`);

        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (existingProfile) {
          console.log('Profile exists, updating with full data...');
          profileFound = true;

          const coordinates = userData.coordinates || { lat: 5.3364, lng: -4.0267 };
          const updateData: any = {
            role: userData.role as 'client' | 'supplier',
            name: userData.name,
            phone: userData.phone,
            address: userData.address,
            coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
          };

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

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Profile update error:', updateError);
          }

          const profileSuccess = await fetchUserProfile(authData.user.id);
          setIsLoading(false);
          return profileSuccess;
        } else if (checkError) {
          console.error('Error checking profile:', checkError);
        } else {
          console.log('Profile not found yet, will try to create it...');

          const coordinates = userData.coordinates || { lat: 5.3364, lng: -4.0267 };
          const profileData: any = {
            id: authData.user.id,
            email: userData.email,
            role: userData.role as 'client' | 'supplier',
            name: userData.name,
            phone: userData.phone,
            address: userData.address,
            coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
            zone_id: (userData.role === 'client' && userData.zoneId) ? userData.zoneId : null,
            business_name: userData.businessName || null,
            business_hours: userData.businessHours || null,
            responsible_person: userData.responsiblePerson || null,
            coverage_zone: userData.coverageZone || null,
            delivery_capacity: userData.deliveryCapacity || null,
            is_active: true,
            is_approved: false,
            approval_status: 'pending'
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .maybeSingle();

          if (createdProfile) {
            console.log('Profile created successfully');
            profileFound = true;
            const profileSuccess = await fetchUserProfile(authData.user.id);
            setIsLoading(false);
            return profileSuccess;
          } else if (createError) {
            console.error('Profile creation error:', createError);
          }
        }

        retries++;
        if (retries < maxRetries && !profileFound) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      if (!profileFound) {
        console.error('Failed to create or find profile after multiple attempts');
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
      refreshAttemptsRef.current = 0;
      
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      register, 
      isLoading, 
      isInitializing,
      sessionError,
      refreshSession,
      clearSessionError,
      setSessionError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
