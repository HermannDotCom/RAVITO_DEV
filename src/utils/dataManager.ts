/**
 * Gestionnaire de données pour RAVITO
 * Gère la purge sécurisée des commandes et la séparation des profils
 * 
 * Note: Transfers are now stored in Supabase database and no longer in localStorage
 */

export interface DataBackup {
  timestamp: Date;
  orders: any[];
  ratings: any[];
  commissionSettings: any;
  metadata: {
    totalOrders: number;
    totalRevenue: number;
    backupReason: string;
  };
}

/**
 * Sauvegarde complète des données avant purge
 * Note: Transfers are excluded as they are now stored in Supabase
 */
export const createDataBackup = (reason: string = 'Purge manuelle'): DataBackup => {
  const orders = JSON.parse(localStorage.getItem('distri-night-orders') || '[]');
  const ratings = JSON.parse(localStorage.getItem('distri-night-ratings') || '[]');
  const commissionSettings = JSON.parse(localStorage.getItem('distri-night-commission-settings') || '{}');

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

  const backup: DataBackup = {
    timestamp: new Date(),
    orders,
    ratings,
    commissionSettings,
    metadata: {
      totalOrders: orders.length,
      totalRevenue,
      backupReason: reason
    }
  };

  // Sauvegarder la backup avec timestamp
  const backupKey = `distri-night-backup-${Date.now()}`;
  localStorage.setItem(backupKey, JSON.stringify(backup));
  
  // Maintenir une liste des backups
  const backupList = JSON.parse(localStorage.getItem('distri-night-backups') || '[]');
  backupList.push({
    key: backupKey,
    timestamp: backup.timestamp,
    orderCount: backup.metadata.totalOrders,
    revenue: backup.metadata.totalRevenue,
    reason: backup.metadata.backupReason
  });
  localStorage.setItem('distri-night-backups', JSON.stringify(backupList));

  return backup;
};

/**
 * Purge sécurisée de toutes les commandes
 * Note: Transfers are not purged as they are stored in Supabase
 */
export const purgeAllOrders = (createBackup: boolean = true): boolean => {
  try {
    // Créer une sauvegarde avant purge
    if (createBackup) {
      createDataBackup('Purge complète des commandes');
    }

    // Supprimer toutes les données de commandes
    localStorage.removeItem('distri-night-orders');
    localStorage.removeItem('distri-night-ratings');
    // Note: distri-night-transfers is no longer used
    
    // Réinitialiser les compteurs
    const users = JSON.parse(localStorage.getItem('distri-night-users') || '[]');
    const resetUsers = users.map((user: any) => ({
      ...user,
      totalOrders: 0,
      rating: 5.0 // Reset to default rating
    }));
    localStorage.setItem('distri-night-users', JSON.stringify(resetUsers));

    // Log de l'opération
    console.log('✅ Purge des commandes effectuée avec succès');
    console.log('📦 Sauvegarde créée automatiquement');
    console.log('ℹ️  Les transferts sont conservés dans Supabase');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la purge des commandes:', error);
    return false;
  }
};

/**
 * Restaurer des données depuis une sauvegarde
 * Note: Transfers are not restored as they are in Supabase
 */
export const restoreFromBackup = (backupKey: string): boolean => {
  try {
    const backup = localStorage.getItem(backupKey);
    if (!backup) {
      throw new Error('Sauvegarde introuvable');
    }

    const data: DataBackup = JSON.parse(backup);
    
    // Restaurer les données
    localStorage.setItem('distri-night-orders', JSON.stringify(data.orders));
    localStorage.setItem('distri-night-ratings', JSON.stringify(data.ratings));
    localStorage.setItem('distri-night-commission-settings', JSON.stringify(data.commissionSettings));

    console.log('✅ Restauration effectuée avec succès');
    console.log('ℹ️  Les transferts ne sont pas restaurés (stockés dans Supabase)');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    return false;
  }
};

/**
 * Obtenir la liste des sauvegardes disponibles
 */
export const getAvailableBackups = () => {
  return JSON.parse(localStorage.getItem('distri-night-backups') || '[]');
};

/**
 * Validation de sécurité pour les profils utilisateurs
 */
export const validateUserProfileAccess = (currentUser: any, targetUserId: string): boolean => {
  // Un utilisateur ne peut accéder qu'à ses propres données
  if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
    console.warn('🚨 Tentative d\'accès non autorisé détectée');
    return false;
  }
  return true;
};

/**
 * Nettoyage sécurisé des données sensibles
 */
export const sanitizeUserData = (userData: any, requestingUserRole: string) => {
  // Les admins voient tout, les autres utilisateurs voient des données limitées
  if (requestingUserRole === 'admin') {
    return userData;
  }

  // Masquer les données sensibles pour les non-admins
  const sanitized = { ...userData };
  delete sanitized.phone;
  delete sanitized.address;
  delete sanitized.coordinates;
  
  return sanitized;
};

/**
 * Vérification d'intégrité des données
 */
export const verifyDataIntegrity = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    // Vérifier la cohérence des commandes
    const orders = JSON.parse(localStorage.getItem('distri-night-orders') || '[]');
    const users = JSON.parse(localStorage.getItem('distri-night-users') || '[]');
    
    orders.forEach((order: any) => {
      // Vérifier que le client existe
      const client = users.find((u: any) => u.id === order.clientId);
      if (!client) {
        errors.push(`Commande ${order.id}: Client ${order.clientId} introuvable`);
      }
      
      // Vérifier que le fournisseur existe (si assigné)
      if (order.supplierId) {
        const supplier = users.find((u: any) => u.id === order.supplierId);
        if (!supplier) {
          errors.push(`Commande ${order.id}: Fournisseur ${order.supplierId} introuvable`);
        }
      }
    });
    
  } catch (error) {
    errors.push('Erreur lors de la vérification des données');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};