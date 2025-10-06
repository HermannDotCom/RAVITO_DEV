import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  isLoading: boolean;
  isInitializing: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  coordinates?: { lat: number; lng: number };
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

  useEffect(() => {
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
          await fetchUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        console.log('Auth initialization complete');
        setIsInitializing(false);
      }
    };

    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing completion');
      setIsInitializing(false);
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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
  }, []);

  const fetchUserProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        await supabase.auth.signOut();
        return false;
      }

      if (!profile) {
        console.error('Profile not found for user:', userId);
        await supabase.auth.signOut();
        return false;
      }

      console.log('Profile found:', profile);
      const { data: authUserData } = await supabase.auth.getUser();

      const mappedUser: User = {
        id: profile.id,
        email: authUserData.user?.email || '',
        role: profile.role as UserRole,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        coordinates: profile.coordinates ? {
          lat: (profile.coordinates as any).coordinates[1],
          lng: (profile.coordinates as any).coordinates[0]
        } : undefined,
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
      return true;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      await supabase.auth.signOut();
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        console.log('Auth successful, fetching profile...');
        const profileSuccess = await fetchUserProfile(data.user.id);
        setIsLoading(false);
        return profileSuccess;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login exception:', error);
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
            role: userData.role
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

      console.log('Auth user created, creating profile...');
      const coordinates = userData.coordinates || { lat: 5.3364, lng: -4.0267 };

      const profileData: any = {
        id: authData.user.id,
        role: userData.role,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
        business_name: userData.businessName || null,
        business_hours: userData.businessHours || null,
        responsible_person: userData.responsiblePerson || null,
        coverage_zone: userData.coverageZone || null,
        delivery_capacity: userData.deliveryCapacity || null,
        is_active: true,
        is_approved: false,
        approval_status: 'pending'
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.signOut();
        setIsLoading(false);
        return false;
      }

      console.log('Profile created, fetching profile...');
      const profileSuccess = await fetchUserProfile(authData.user.id);
      setIsLoading(false);
      return profileSuccess;
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, register, isLoading, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};
