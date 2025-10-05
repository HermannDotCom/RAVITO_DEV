import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      const { data: authUser } = await supabase.auth.getUser();
      setUser({
        id: profile.id,
        email: authUser.user?.email || '',
        role: profile.role,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        rating: profile.rating || 5.0,
        totalOrders: profile.total_orders || 0,
        isActive: profile.is_active,
        isApproved: profile.is_approved,
        approvalStatus: profile.approval_status,
        createdAt: new Date(profile.created_at),
        businessName: profile.business_name,
        businessHours: profile.business_hours,
        responsiblePerson: profile.responsible_person,
        coverageZone: profile.coverage_zone,
        deliveryCapacity: profile.delivery_capacity
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    if (data.user) await fetchUserProfile(data.user.id);
    return true;
  };

  const register = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });
    if (error || !data.user) return false;

    const { error: profileError } = await supabase.from('profiles').insert([{
      id: data.user.id,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      address: userData.address,
      is_active: true,
      is_approved: false,
      approval_status: 'pending'
    }]);

    if (profileError) return false;
    await fetchUserProfile(data.user.id);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
