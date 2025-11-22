import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Award, Zap } from 'lucide-react';

interface OrderCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  orderAmount?: number;
  achievements?: Array<{ name: string; icon: string }>;
  mysteryBonus?: number;
}

export const OrderCelebration: React.FC<OrderCelebrationProps> = ({
  isVisible,
  onComplete,
  orderAmount,
  achievements = [],
  mysteryBonus
}) => {
  useEffect(() => {
    if (isVisible) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Auto-close after 4 seconds
      const timeout = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{ zIndex: 9999 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="h-20 w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                🎉 Commande Acceptée!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6"
              >
                Votre commande a été acceptée avec succès
                {orderAmount && (
                  <span className="block mt-2 text-2xl font-bold text-orange-600">
                    {orderAmount.toLocaleString()} FCFA
                  </span>
                )}
              </motion.p>

              {mysteryBonus && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4 mb-4"
                >
                  <Zap className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-bold text-lg">Mystery Bonus Unlocked!</p>
                  <p className="text-2xl font-bold">{mysteryBonus}% de réduction</p>
                </motion.div>
              )}

              {achievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-yellow-600 mr-2" />
                    <p className="font-bold text-yellow-900">
                      Nouveau Badge Débloqué!
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.7 + index * 0.1, type: 'spring' }}
                        className="text-4xl"
                      >
                        {achievement.icon}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-2">
                    {achievements.map((achievement, index) => (
                      <p key={index} className="text-sm text-yellow-800">
                        {achievement.name}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-sm text-gray-500"
              >
                Préparation en cours...
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
