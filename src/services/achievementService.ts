import { supabase } from '../lib/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'night_owl' | 'consistent_king' | 'speed_demon' | 'early_bird' | 'big_spender' | 'explorer';
  criteria: {
    threshold: number;
    metric: string;
  };
  unlockedAt?: Date;
}

export interface UserAchievement {
  userId: string;
  achievementType: Achievement['type'];
  unlockedAt: Date;
  progress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'night_owl',
    name: 'Night Owl 🦉',
    description: 'Commande après 2h du matin',
    icon: '🦉',
    type: 'night_owl',
    criteria: { threshold: 1, metric: 'late_night_orders' }
  },
  {
    id: 'consistent_king',
    name: 'Consistent King 👑',
    description: '10+ commandes effectuées',
    icon: '👑',
    type: 'consistent_king',
    criteria: { threshold: 10, metric: 'total_orders' }
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon ⚡',
    description: 'Paiement le plus rapide (< 2 min)',
    icon: '⚡',
    type: 'speed_demon',
    criteria: { threshold: 120, metric: 'payment_speed_seconds' }
  },
  {
    id: 'early_bird',
    name: 'Early Bird 🌅',
    description: 'Commande avant 8h du matin',
    icon: '🌅',
    type: 'early_bird',
    criteria: { threshold: 1, metric: 'early_morning_orders' }
  },
  {
    id: 'big_spender',
    name: 'Big Spender 💰',
    description: 'Commande de plus de 100 000 FCFA',
    icon: '💰',
    type: 'big_spender',
    criteria: { threshold: 100000, metric: 'order_amount' }
  },
  {
    id: 'explorer',
    name: 'Explorer 🗺️',
    description: 'Commandé dans 5 zones différentes',
    icon: '🗺️',
    type: 'explorer',
    criteria: { threshold: 5, metric: 'unique_zones' }
  }
];

export async function checkAndUnlockAchievements(
  userId: string,
  orderId: string,
  orderData: {
    totalAmount: number;
    createdAt: Date;
    zoneId: string;
    paidAt?: Date;
  }
): Promise<Achievement[]> {
  try {
    const newAchievements: Achievement[] = [];

    // Get user's order history
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, zone_id, paid_at')
      .eq('client_id', userId);

    if (error || !orders) {
      console.error('Error fetching orders:', error);
      return [];
    }

    // Get existing achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_type')
      .eq('user_id', userId);

    const unlockedTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);

    // Check Night Owl (after 2am)
    const hour = orderData.createdAt.getHours();
    if (hour >= 2 && hour < 6 && !unlockedTypes.has('night_owl')) {
      const achievement = ACHIEVEMENTS.find(a => a.type === 'night_owl')!;
      await unlockAchievement(userId, 'night_owl');
      newAchievements.push(achievement);
    }

    // Check Early Bird (before 8am)
    if (hour >= 5 && hour < 8 && !unlockedTypes.has('early_bird')) {
      const achievement = ACHIEVEMENTS.find(a => a.type === 'early_bird')!;
      await unlockAchievement(userId, 'early_bird');
      newAchievements.push(achievement);
    }

    // Check Consistent King (10+ orders)
    if (orders.length >= 10 && !unlockedTypes.has('consistent_king')) {
      const achievement = ACHIEVEMENTS.find(a => a.type === 'consistent_king')!;
      await unlockAchievement(userId, 'consistent_king');
      newAchievements.push(achievement);
    }

    // Check Big Spender (> 100,000 FCFA)
    if (orderData.totalAmount >= 100000 && !unlockedTypes.has('big_spender')) {
      const achievement = ACHIEVEMENTS.find(a => a.type === 'big_spender')!;
      await unlockAchievement(userId, 'big_spender');
      newAchievements.push(achievement);
    }

    // Check Speed Demon (payment within 2 minutes)
    if (orderData.paidAt) {
      const paymentSpeed = (orderData.paidAt.getTime() - orderData.createdAt.getTime()) / 1000;
      if (paymentSpeed <= 120 && !unlockedTypes.has('speed_demon')) {
        const achievement = ACHIEVEMENTS.find(a => a.type === 'speed_demon')!;
        await unlockAchievement(userId, 'speed_demon');
        newAchievements.push(achievement);
      }
    }

    // Check Explorer (5 unique zones)
    const uniqueZones = new Set(orders.map(o => o.zone_id).filter(Boolean));
    if (uniqueZones.size >= 5 && !unlockedTypes.has('explorer')) {
      const achievement = ACHIEVEMENTS.find(a => a.type === 'explorer')!;
      await unlockAchievement(userId, 'explorer');
      newAchievements.push(achievement);
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

async function unlockAchievement(userId: string, achievementType: Achievement['type']): Promise<void> {
  try {
    await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        unlocked_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_type, unlocked_at')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }

    return data.map(ua => {
      const achievement = ACHIEVEMENTS.find(a => a.type === ua.achievement_type)!;
      return {
        ...achievement,
        unlockedAt: new Date(ua.unlocked_at)
      };
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
}

export function getAchievementProgress(_userId: string, _achievementType: Achievement['type']): Promise<number> {
  // This could be enhanced to show progress towards achievements
  return Promise.resolve(0);
}

export { ACHIEVEMENTS };
