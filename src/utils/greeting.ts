/**
 * Get time-based greeting message with emoji and contextual text
 * @returns Object with emoji, greeting, and contextual message
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { 
      emoji: '🌅', 
      greeting: 'Bonjour', 
      message: 'Prêt pour une nouvelle journée ?' 
    };
  }
  
  if (hour >= 12 && hour < 18) {
    return { 
      emoji: '☀️', 
      greeting: 'Bon après-midi', 
      message: 'Les commandes vous attendent !' 
    };
  }
  
  if (hour >= 18 && hour < 22) {
    return { 
      emoji: '🌆', 
      greeting: 'Bonsoir', 
      message: 'La soirée commence !' 
    };
  }
  
  return { 
    emoji: '🌙', 
    greeting: 'Bonne nuit', 
    message: 'RAVITO ne dort jamais !' 
  };
};
