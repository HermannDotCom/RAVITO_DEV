import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Rating, UserRole } from '../types';
import { useAuth } from './AuthContext';

interface RatingContextType {
  submitRating: (orderId: string, ratings: RatingData, toUserId: string, toUserRole: UserRole) => Promise<boolean>;
  getOrderRatings: (orderId: string) => Promise<{ clientRating?: Rating; supplierRating?: Rating }>;
  canShowRatings: (orderId: string, clientRating?: Rating, supplierRating?: Rating) => boolean;
  needsRating: (orderId: string, clientRating?: Rating, supplierRating?: Rating) => boolean;
  getUserRatings: (userId: string) => Promise<Rating[]>;
}

interface RatingData {
  punctuality: number;
  quality: number;
  communication: number;
  overall: number;
  comment?: string;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const useRating = () => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};

export const RatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const submitRating = async (
    orderId: string,
    ratings: RatingData,
    toUserId: string,
    toUserRole: UserRole
  ): Promise<boolean> => {
    if (!user) {
      console.error('User must be authenticated to submit rating');
      return false;
    }

    try {
      const ratingData = {
        order_id: orderId,
        from_user_id: user.id,
        to_user_id: toUserId,
        from_user_role: user.role,
        to_user_role: toUserRole,
        punctuality: ratings.punctuality,
        quality: ratings.quality,
        communication: ratings.communication,
        overall: ratings.overall,
        comment: ratings.comment || null
      };

      const { error } = await supabase
        .from('ratings')
        .insert([ratingData]);

      if (error) {
        console.error('Error submitting rating:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception submitting rating:', error);
      return false;
    }
  };

  const getOrderRatings = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching order ratings:', error);
        return {};
      }

      const clientRating = data?.find(r => r.from_user_role === 'client');
      const supplierRating = data?.find(r => r.from_user_role === 'supplier');

      return {
        clientRating: clientRating ? mapDatabaseRatingToApp(clientRating) : undefined,
        supplierRating: supplierRating ? mapDatabaseRatingToApp(supplierRating) : undefined
      };
    } catch (error) {
      console.error('Exception fetching order ratings:', error);
      return {};
    }
  };

  const canShowRatings = (
    orderId: string,
    clientRating?: Rating,
    supplierRating?: Rating
  ): boolean => {
    return !!(clientRating && supplierRating);
  };

  const needsRating = (
    orderId: string,
    clientRating?: Rating,
    supplierRating?: Rating
  ): boolean => {
    if (!user) return false;

    if (user.role === 'client') {
      return !clientRating;
    } else if (user.role === 'supplier') {
      return !supplierRating;
    }

    return false;
  };

  const getUserRatings = async (userId: string): Promise<Rating[]> => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user ratings:', error);
        return [];
      }

      return data?.map(mapDatabaseRatingToApp) || [];
    } catch (error) {
      console.error('Exception fetching user ratings:', error);
      return [];
    }
  };

  const mapDatabaseRatingToApp = (dbRating: any): Rating => {
    return {
      id: dbRating.id,
      orderId: dbRating.order_id,
      fromUserId: dbRating.from_user_id,
      toUserId: dbRating.to_user_id,
      fromUserRole: dbRating.from_user_role as UserRole,
      toUserRole: dbRating.to_user_role as UserRole,
      punctuality: dbRating.punctuality,
      quality: dbRating.quality,
      communication: dbRating.communication,
      overall: dbRating.overall,
      comment: dbRating.comment,
      createdAt: new Date(dbRating.created_at)
    };
  };

  return (
    <RatingContext.Provider value={{
      submitRating,
      getOrderRatings,
      canShowRatings,
      needsRating,
      getUserRatings
    }}>
      {children}
    </RatingContext.Provider>
  );
};
