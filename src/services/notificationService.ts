import { supabase } from '../lib/supabase';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        is_read: false
      }]);

    if (error) throw error;

    console.log('Notification created successfully:', params.title);
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createAccountApprovedNotification = async (userId: string, userName: string, userRole: 'client' | 'supplier') => {
  const roleLabel = userRole === 'client' ? 'client' : 'fournisseur';

  await createNotification({
    userId,
    type: 'account_approved',
    title: 'Compte approuvé !',
    message: `Félicitations ${userName} ! Votre compte ${roleLabel} a été approuvé. Vous avez maintenant accès à toutes les fonctionnalités de DISTRI-NIGHT.`,
    data: { role: userRole }
  });
};

export const createAccountRejectedNotification = async (userId: string, userName: string, reason: string) => {
  await createNotification({
    userId,
    type: 'account_rejected',
    title: 'Compte non approuvé',
    message: `Bonjour ${userName}, votre demande de compte n'a pas été approuvée. Raison: ${reason}. Veuillez contacter DISTRI-NIGHT au +225 27 20 30 40 50 ou support@distri-night.ci pour plus d'informations.`,
    data: { reason }
  });
};

export const createZoneApprovedNotification = async (userId: string, zoneName: string) => {
  await createNotification({
    userId,
    type: 'zone_approved',
    title: 'Demande de zone approuvée !',
    message: `Votre demande pour couvrir la zone "${zoneName}" a été approuvée. Vous pouvez maintenant accepter des commandes dans cette zone.`,
    data: { zoneName }
  });
};

export const createZoneRejectedNotification = async (userId: string, zoneName: string, reason?: string) => {
  const messageBase = `Votre demande pour couvrir la zone "${zoneName}" n'a pas été approuvée.`;
  const messageReason = reason ? ` Raison: ${reason}.` : '';
  const messageContact = ' Veuillez contacter DISTRI-NIGHT au +225 27 20 30 40 50 ou partenaires@distri-night.ci pour plus d\'informations.';

  await createNotification({
    userId,
    type: 'zone_rejected',
    title: 'Demande de zone refusée',
    message: messageBase + messageReason + messageContact,
    data: { zoneName, reason }
  });
};
