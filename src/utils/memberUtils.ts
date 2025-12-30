import type { OrganizationMember } from '../types/team';

/**
 * Get display name from member email
 * Extracts name from email and capitalizes it
 */
export const getMemberDisplayName = (member: OrganizationMember): string => {
  if (member.email && member.email.includes('@')) {
    const name = member.email.split('@')[0];
    // Handle dot-separated names (e.g., "john.doe" -> "John Doe")
    // Filter out empty parts from consecutive dots
    return name
      .split('.')
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return member.email || 'Membre';
};

/**
 * Get initials from member email for avatar
 */
export const getMemberInitials = (member: OrganizationMember): string => {
  const email = member.email;
  if (email && email.includes('@')) {
    const parts = email.split('@')[0].split('.').filter(part => part.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 1).toUpperCase();
    }
  }
  return 'M';
};

/**
 * Format date and time in French format
 */
export const formatDateTime = (date: Date | null): string => {
  if (!date) return 'Jamais connecté';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date in short French format
 */
export const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
