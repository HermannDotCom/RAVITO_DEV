import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';

/**
 * Hook de sécurité pour la séparation stricte des profils
 * Garantit que chaque utilisateur n'accède qu'à ses propres données
 */
export const useProfileSecurity = () => {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur actuel peut accéder aux données d'un autre utilisateur
   */
  const canAccessUserData = (targetUserId: string): boolean => {
    if (!user) return false;
    
    // Les admins peuvent accéder à toutes les données
    if (user.role === 'admin') return true;
    
    // Les autres utilisateurs ne peuvent accéder qu'à leurs propres données
    return user.id === targetUserId;
  };

  /**
   * Vérifie si l'utilisateur peut effectuer une action spécifique
   */
  const canPerformAction = (action: string, targetRole?: UserRole): boolean => {
    if (!user) return false;

    switch (action) {
      case 'view_orders':
        return user.role === 'admin' || user.role === 'client' || user.role === 'supplier';
      
      case 'manage_users':
        return user.role === 'admin';
      
      case 'access_treasury':
        return user.role === 'admin';
      
      case 'place_order':
        return user.role === 'client' && user.isApproved;
      
      case 'accept_orders':
        return user.role === 'supplier' && user.isApproved;
      
      case 'view_analytics':
        return user.role === 'admin';
      
      default:
        return false;
    }
  };

  /**
   * Filtre les données selon les permissions de l'utilisateur
   */
  const filterDataByPermissions = <T extends { clientId?: string; supplierId?: string }>(
    data: T[], 
    dataType: 'orders' | 'ratings' | 'general'
  ): T[] => {
    if (!user) return [];
    
    // Les admins voient tout
    if (user.role === 'admin') return data;
    
    // Filtrage selon le type d'utilisateur
    switch (user.role) {
      case 'client':
        return data.filter(item => item.clientId === user.id);
      
      case 'supplier':
        return data.filter(item => item.supplierId === user.id);
      
      default:
        return [];
    }
  };

  /**
   * Masque les données sensibles selon le rôle de l'utilisateur
   */
  const sanitizeUserData = (userData: User): Partial<User> => {
    if (!user) return {};
    
    // Les admins voient toutes les données
    if (user.role === 'admin') return userData;
    
    // Les utilisateurs ne voient que leurs propres données complètes
    if (user.id === userData.id) return userData;
    
    // Pour les autres, masquer les données sensibles
    return {
      id: userData.id,
      name: userData.name,
      role: userData.role,
      rating: userData.rating,
      totalOrders: userData.totalOrders,
      isActive: userData.isActive
    };
  };

  /**
   * Vérifie l'intégrité de la session utilisateur
   */
  const validateSession = (): boolean => {
    if (!user) return false;
    
    // Vérifier que l'utilisateur a les propriétés requises
    const requiredFields = ['id', 'email', 'role', 'name'];
    const hasRequiredFields = requiredFields.every(field => user[field as keyof User]);
    
    if (!hasRequiredFields) {
      console.warn('🚨 Session utilisateur corrompue détectée');
      return false;
    }
    
    // Vérifier la cohérence du rôle
    const validRoles: UserRole[] = ['client', 'supplier', 'admin'];
    if (!validRoles.includes(user.role)) {
      console.warn('🚨 Rôle utilisateur invalide détecté');
      return false;
    }
    
    return true;
  };

  /**
   * Obtient les restrictions d'accès pour l'utilisateur actuel
   */
  const getAccessRestrictions = () => {
    if (!user) {
      return {
        canAccessCatalog: false,
        canAccessCart: false,
        canPlaceOrders: false,
        canAcceptOrders: false,
        canViewAnalytics: false,
        canManageUsers: false,
        restrictionReason: 'Non connecté'
      };
    }

    const baseRestrictions = {
      canAccessCatalog: user.role === 'client' && user.isApproved,
      canAccessCart: user.role === 'client' && user.isApproved,
      canPlaceOrders: user.role === 'client' && user.isApproved,
      canAcceptOrders: user.role === 'supplier' && user.isApproved,
      canViewAnalytics: user.role === 'admin',
      canManageUsers: user.role === 'admin',
      restrictionReason: ''
    };

    // Déterminer la raison de restriction
    if (!user.isApproved && user.role !== 'admin') {
      baseRestrictions.restrictionReason = 'Compte en attente d\'approbation';
    } else if (!user.isActive) {
      baseRestrictions.restrictionReason = 'Compte désactivé';
    }

    return baseRestrictions;
  };

  return {
    user,
    canAccessUserData,
    canPerformAction,
    filterDataByPermissions,
    sanitizeUserData,
    validateSession,
    getAccessRestrictions
  };
};