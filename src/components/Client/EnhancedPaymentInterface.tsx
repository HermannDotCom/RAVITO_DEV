import React, { useState, useEffect } from 'react';
import { PaymentInterface } from './PaymentInterface';
import { OrderCelebration } from '../Shared/OrderCelebration';
import { Order } from '../../types';
import { checkAndUnlockAchievements } from '../../services/achievementService';
import { generateMysteryBonus } from '../../services/orderMomentumService';
import { useAuth } from '../../context/AuthContext';

interface EnhancedPaymentInterfaceProps {
  order: Order;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const EnhancedPaymentInterface: React.FC<EnhancedPaymentInterfaceProps> = ({
  order,
  onPaymentSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievements, setAchievements] = useState<Array<{ name: string; icon: string }>>([]);
  const [mysteryBonus, setMysteryBonus] = useState<number | undefined>();

  const handlePaymentSuccess = async () => {
    if (!user) {
      onPaymentSuccess();
      return;
    }

    // Check for achievements
    const newAchievements = await checkAndUnlockAchievements(
      user.id,
      order.id,
      {
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        zoneId: order.zoneId || '',
        paidAt: new Date()
      }
    );

    // Check for mystery bonus (only for display, already applied)
    const bonus = await generateMysteryBonus();

    if (newAchievements.length > 0) {
      setAchievements(newAchievements.map(a => ({ name: a.name, icon: a.icon })));
    }

    if (bonus) {
      setMysteryBonus(bonus);
    }

    // Show celebration
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    onPaymentSuccess();
  };

  return (
    <>
      <PaymentInterface
        order={order}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={onCancel}
      />

      <OrderCelebration
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        orderAmount={order.totalAmount}
        achievements={achievements}
        mysteryBonus={mysteryBonus}
      />
    </>
  );
};
