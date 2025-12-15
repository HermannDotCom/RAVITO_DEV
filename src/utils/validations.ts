/**
 * Validation du téléphone ivoirien
 * Formats acceptés: 07XXXXXXXX, 05XXXXXXXX, 01XXXXXXXX
 */
export const validatePhoneCI = (phone: string): { isValid: boolean; error: string } => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned) {
    return { isValid: false, error: 'Le numéro de téléphone est requis' };
  }
  
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Le numéro doit contenir 10 chiffres' };
  }
  
  if (!/^(07|05|01)\d{8}$/.test(cleaned)) {
    return { isValid: false, error: 'Le numéro doit commencer par 07, 05 ou 01' };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Formatage automatique du téléphone: XX XX XX XX XX
 */
export const formatPhoneCI = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const limited = cleaned.slice(0, 10);
  
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
  if (limited.length <= 8) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`;
};

/**
 * Validation email
 * Uses a simple but effective regex pattern that covers most common email formats.
 * More complex patterns exist but add minimal value for this use case.
 */
export const validateEmail = (email: string): { isValid: boolean; error: string } => {
  if (!email) {
    return { isValid: false, error: 'L\'email est requis' };
  }
  
  // Simple but effective pattern that covers 99% of real-world email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Validation et force du mot de passe
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Très faible' | 'Faible' | 'Moyen' | 'Fort' | 'Très fort';
  color: string;
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordStrength => {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else errors.push('Au moins 8 caractères');
  
  if (password.length >= 12) score++;
  
  if (/[A-Z]/.test(password)) score++;
  else errors.push('Au moins une majuscule');
  
  if (/[0-9]/.test(password)) score++;
  else errors.push('Au moins un chiffre');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const labels: PasswordStrength['label'][] = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];
  
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
    isValid: score >= 2 && password.length >= 8,
    errors,
  };
};

/**
 * Validation nom complet (prénom + nom)
 */
export const validateFullName = (name: string): { isValid: boolean; error: string } => {
  if (!name || name.trim().length < 3) {
    return { isValid: false, error: 'Le nom complet est requis' };
  }
  
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { isValid: false, error: 'Veuillez entrer votre prénom et nom' };
  }
  
  return { isValid: true, error: '' };
};
