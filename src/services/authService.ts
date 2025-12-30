import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: data?.message || 'Email envoyé avec succès' 
      };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de l\'envoi de l\'email' 
      };
    }
  },

  /**
   * Réinitialise le mot de passe avec le nouveau mot de passe
   * Note: Supabase gère automatiquement le token via l'URL
   */
  async resetPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Mot de passe mis à jour avec succès' 
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la réinitialisation' 
      };
    }
  },
};
