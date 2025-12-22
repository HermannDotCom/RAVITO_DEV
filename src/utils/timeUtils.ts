/**
 * Détermine si l'heure actuelle se situe dans la plage de "nuit" (22h00 à 06h00).
 * @returns {boolean} Vrai si l'heure est nocturne.
 */
export const isNightTime = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  
  // Heure de début de nuit (22h)
  const NIGHT_START_HOUR = 22;
  // Heure de fin de nuit (6h)
  const NIGHT_END_HOUR = 6;

  // La nuit est entre 22h et 0h (>= 22) OU entre 0h et 6h (< 6)
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};
