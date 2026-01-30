import type {
  CommercialActivityStats,
  Recommendation,
  SalesCommissionSettings
} from '../types/sales';
import { formatCurrency } from '../types/sales';

/**
 * Generate personalized recommendations for a sales representative
 * Based on their activity, objectives, and performance
 */
export const generateRecommendations = (
  stats: CommercialActivityStats,
  settings: SalesCommissionSettings
): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Rule 1: CHR Objective not reached (and > 80%)
  const chrPercentage = stats.percentObjectiveChr;
  if (stats.objectiveChr > 0 && chrPercentage >= 80 && chrPercentage < 100) {
    recommendations.push({
      type: 'objective',
      icon: '🎯',
      title: 'Objectif CHR',
      message: `Il te reste ${stats.chrRemaining} CHR à activer en ${stats.daysLeftInMonth} jours.`,
      tip: `Concentre-toi sur les CHR déjà inscrits qui n'ont pas encore commandé ${formatCurrency(settings.chrActivationThreshold)}.`
    });
  }

  // Rule 2: CHR Objective far from target (< 80%)
  if (stats.objectiveChr > 0 && chrPercentage < 80 && stats.daysLeftInMonth > 0) {
    const dailyTarget = Math.ceil(stats.chrRemaining / Math.max(1, stats.daysLeftInMonth));
    recommendations.push({
      type: 'objective',
      icon: '🎯',
      title: 'Objectif CHR',
      message: `Il te reste ${stats.chrRemaining} CHR à activer en ${stats.daysLeftInMonth} jours.`,
      tip: `Objectif ambitieux ! Il faut environ ${dailyTarget} activation${dailyTarget > 1 ? 's' : ''} par jour. Continue tes efforts !`
    });
  }

  // Rule 3: Depot objective not reached
  if (stats.objectiveDepots > 0 && stats.percentObjectiveDepots < 100 && stats.depotRemaining > 0) {
    recommendations.push({
      type: 'objective',
      icon: '🏭',
      title: 'Objectif Dépôts',
      message: `Il te reste ${stats.depotRemaining} dépôt${stats.depotRemaining > 1 ? 's' : ''} à activer.`,
      tip: `Un dépôt est activé après ${settings.depotActivationDeliveries} livraisons. Relance les dépôts inscrits récemment.`
    });
  }

  // Rule 4: Bonus atteignable (80-99%)
  if (chrPercentage >= 80 && chrPercentage < 100) {
    recommendations.push({
      type: 'bonus',
      icon: '💰',
      title: 'Bonus proche !',
      message: `Tu es à ${Math.round(chrPercentage)}% de ton objectif CHR.`,
      tip: `Avec ${stats.chrRemaining} activation${stats.chrRemaining > 1 ? 's' : ''} de plus, tu débloques ${formatCurrency(settings.bonusChrObjective)} !`
    });
  }

  // Rule 5: Both objectives reached for combined bonus
  if (stats.percentObjectiveChr >= 100 && stats.percentObjectiveDepots >= 100) {
    recommendations.push({
      type: 'success',
      icon: '🎉',
      title: 'Objectifs atteints !',
      message: 'Tu as atteint tes objectifs CHR ET Dépôts !',
      tip: `Bonus combiné de ${formatCurrency(settings.bonusCombined)} débloqué ! Continue pour le bonus dépassement.`
    });
  }

  // Rule 6: Overshoot bonus close (110-119%)
  const totalObjective = stats.objectiveChr + stats.objectiveDepots;
  const totalRealized = stats.chrActivated + stats.depotActivated;
  const totalPercent = totalObjective > 0 ? (totalRealized / totalObjective) * 100 : 0;

  if (totalPercent >= 110 && totalPercent < settings.overshootTier1Threshold) {
    const remaining = Math.ceil((totalObjective * settings.overshootTier1Threshold / 100) - totalRealized);
    recommendations.push({
      type: 'bonus',
      icon: '🚀',
      title: 'Bonus dépassement proche !',
      message: `Tu es à ${Math.round(totalPercent)}% de tes objectifs combinés.`,
      tip: `Encore ${remaining} activation${remaining > 1 ? 's' : ''} et tu débloques ${formatCurrency(settings.overshootTier1Bonus)} !`
    });
  }

  // Rule 7: Tier 1 overshoot reached, Tier 2 close
  if (totalPercent >= settings.overshootTier1Threshold && totalPercent < settings.overshootTier2Threshold) {
    const remaining = Math.ceil((totalObjective * settings.overshootTier2Threshold / 100) - totalRealized);
    recommendations.push({
      type: 'bonus',
      icon: '🔥',
      title: 'Super performance !',
      message: `Tu as dépassé ${Math.round(totalPercent)}% de tes objectifs !`,
      tip: `${remaining} activation${remaining > 1 ? 's' : ''} de plus pour le bonus tier 2 de ${formatCurrency(settings.overshootTier2Bonus)} !`
    });
  }

  // Rule 8: Ranking motivation (top 3)
  if (stats.currentRank > 0 && stats.currentRank <= 3 && stats.ranking.length > 1) {
    const rankEmoji = stats.currentRank === 1 ? '🥇' : stats.currentRank === 2 ? '🥈' : '🥉';
    let message = `Tu es ${rankEmoji} ${stats.currentRank}${stats.currentRank === 1 ? 'er' : 'ème'} ce mois`;
    
    if (stats.currentRank > 1) {
      const firstPlace = stats.ranking[0];
      const gap = firstPlace.totalRegistered - stats.totalRegistered;
      message += `, à ${gap} inscription${gap > 1 ? 's' : ''} du 1er`;
    } else {
      message += ' ! Bravo !';
    }

    recommendations.push({
      type: 'ranking',
      icon: '🏆',
      title: 'Classement',
      message,
      tip: stats.currentRank === 1 
        ? `Continue ainsi pour remporter le bonus "Meilleur du mois" de ${formatCurrency(settings.bonusBestOfMonth)} !`
        : `Le bonus "Meilleur du mois" est de ${formatCurrency(settings.bonusBestOfMonth)} !`
    });
  }

  // Rule 9: Low activity warning (< 30% of objective with > 50% of month passed)
  const monthProgress = stats.daysLeftInMonth > 0 ? ((30 - stats.daysLeftInMonth) / 30) * 100 : 100;
  if (stats.objectiveChr > 0 && chrPercentage < 30 && monthProgress > 50) {
    recommendations.push({
      type: 'objective',
      icon: '⚠️',
      title: 'Accélère le rythme !',
      message: `Tu es à ${Math.round(chrPercentage)}% de ton objectif avec ${stats.daysLeftInMonth} jours restants.`,
      tip: 'Concentre tes efforts sur les zones à fort potentiel et réactive les anciens contacts.'
    });
  }

  // Rule 10: Excellent performance (> 120%)
  if (totalPercent >= 120) {
    recommendations.push({
      type: 'success',
      icon: '🌟',
      title: 'Performance exceptionnelle !',
      message: `Tu as dépassé tes objectifs de ${Math.round(totalPercent - 100)}% !`,
      tip: 'Bravo ! Ton bonus dépassement est maximisé. Continue pour te démarquer du classement !'
    });
  }

  // If no specific recommendations, add a general encouragement
  if (recommendations.length === 0) {
    if (stats.totalRegistered === 0) {
      recommendations.push({
        type: 'objective',
        icon: '🚀',
        title: 'Démarrage',
        message: 'Bienvenue dans ton espace commercial !',
        tip: 'Commence par inscrire tes premiers clients CHR et dépôts pour suivre tes performances.'
      });
    } else {
      recommendations.push({
        type: 'success',
        icon: '💪',
        title: 'Bon travail !',
        message: `Tu as déjà inscrit ${stats.totalRegistered} client${stats.totalRegistered > 1 ? 's' : ''}.`,
        tip: 'Continue sur ta lancée et vise l\'activation de tous tes inscrits !'
      });
    }
  }

  return recommendations;
};
