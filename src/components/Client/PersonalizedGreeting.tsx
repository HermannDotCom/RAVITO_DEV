import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getPersonalizedGreeting } from '../../services/orderMomentumService';
import { useAuth } from '../../context/AuthContext';

interface PersonalizedGreetingProps {
  supplierName?: string;
  supplierPhoto?: string;
  onClose?: () => void;
  autoHide?: boolean;
}

export const PersonalizedGreeting: React.FC<PersonalizedGreetingProps> = ({
  supplierName,
  supplierPhoto,
  onClose,
  autoHide = true
}) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (user) {
      const greetingText = getPersonalizedGreeting(user.name);
      setGreeting(greetingText);
    }

    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, autoHide, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden"
          >
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 20 - 10, 0],
                    opacity: [0.2, 0.8, 0.2]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2 + Math.random() * 2,
                    delay: i * 0.3
                  }}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                >
                  <Sparkles className="h-4 w-4 text-white opacity-50" />
                </motion.div>
              ))}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden"
                >
                  {supplierPhoto ? (
                    <img 
                      src={supplierPhoto} 
                      alt={supplierName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-br from-orange-300 to-pink-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </motion.div>

                <div className="flex-1">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold"
                  >
                    {greeting}
                  </motion.p>
                  {supplierName && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-white text-opacity-90"
                    >
                      Votre fournisseur: {supplierName}
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={handleClose}
                  className="h-8 w-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-white font-bold">×</span>
                </button>
              </div>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-1 bg-white bg-opacity-50 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-full w-1/3 bg-white bg-opacity-80"
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
