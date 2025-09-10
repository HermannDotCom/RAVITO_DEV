import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { getDemoAccountByCredentials, DemoAccount } from '../data/demoAccounts';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithDemo: (demoAccount: DemoAccount) => void;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  businessName?: string;
  responsiblePerson?: string;
  businessHours?: string;
  preferredPayments?: string[];
  coverageZone?: string;
  availableProducts?: string[];
  deliveryCapacity?: string;
  acceptedPayments?: string[];
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('distri-night-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Convert createdAt back to Date object if it exists
      if (parsedUser.createdAt) {
        parsedUser.createdAt = new Date(parsedUser.createdAt);
      }
      setUser(parsedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Check for demo accounts first
    const demoAccount = getDemoAccountByCredentials(email, password);
    if (demoAccount) {
      setUser(demoAccount.userData);
      localStorage.setItem('distri-night-user', JSON.stringify(demoAccount.userData));
      setIsLoading(false);
      return true;
    }
    
    // Simulate API call for regular login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, any other email/password combination will create a basic client account
    const basicUser: User = {
      id: Date.now().toString(),
      email,
      role: 'client',
      name: 'Utilisateur Test',
      phone: '+225 XX XX XX XX XX',
      address: 'Abidjan, Côte d\'Ivoire',
      coordinates: { lat: 5.3364, lng: -4.0267 },
      rating: 5.0,
      totalOrders: 0,
      isActive: true,
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date()
    };
    
    setUser(basicUser);
    localStorage.setItem('distri-night-user', JSON.stringify(basicUser));
    setIsLoading(false);
    return true;
  };

  const loginWithDemo = (demoAccount: DemoAccount) => {
    setUser(demoAccount.userData);
    localStorage.setItem('distri-night-user', JSON.stringify(demoAccount.userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('distri-night-user');
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      role: userData.role,
      name: userData.name,
      phone: userData.phone,
      address: userData.address,
      rating: 5,
      totalOrders: 0,
      isActive: true,
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date()
    };
    
    setUser(newUser);
    localStorage.setItem('distri-night-user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithDemo, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};