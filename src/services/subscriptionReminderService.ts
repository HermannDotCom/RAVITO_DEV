import { supabase } from '../lib/supabase';
import type { SubscriptionSettings, ReminderType } from '../types/subscription';

/**
 * Service de gestion des relances de paiement
 *
 * Ce service doit être exécuté par un job automatique (cron) pour envoyer
 * les relances aux utilisateurs avant l'échéance de leur facture.
 */

// ============================================
// HELPER: Calculer le type de relance
// ============================================

const getReminderType = (daysBeforeDue: number): ReminderType => {
  if (daysBeforeDue >= 90) return 'j_minus_90';
  if (daysBeforeDue >= 60) return 'j_minus_60';
  if (daysBeforeDue >= 30) return 'j_minus_30';
  if (daysBeforeDue >= 15) return 'j_minus_15';
  if (daysBeforeDue >= 7) return 'j_minus_7';
  return 'j_minus_2';
};

// ============================================
// PROCESS REMINDERS
// ============================================

/**
 * Processus principal de traitement des relances
 * À exécuter quotidiennement via un job automatique
 */
export const processReminders = async (): Promise<{
  sent: number;
  errors: number;
}> => {
  try {
    // Récupérer les paramètres
    const { data: settings, error: settingsError } = await supabase
      .from('subscription_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings) throw new Error('Settings not found');

    const reminderDays = settings.reminder_days;

    // Récupérer toutes les factures en attente avec leurs abonnements
    const { data: invoices, error: invoicesError } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        subscriptions (
          *,
          subscription_plans (billing_cycle),
          organizations (id, name, owner_id)
        )
      `)
      .eq('status', 'pending');

    if (invoicesError) throw invoicesError;

    let sent = 0;
    let errors = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const invoice of invoices || []) {
      try {
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          // Facture en retard - marquer comme overdue
          await supabase
            .from('subscription_invoices')
            .update({ status: 'overdue' })
            .eq('id', invoice.id);
          continue;
        }

        // Vérifier si on doit envoyer une relance aujourd'hui
        const billingCycle = invoice.subscriptions.subscription_plans.billing_cycle;
        const reminderDaysForCycle = reminderDays[billingCycle] || [];

        if (reminderDaysForCycle.includes(daysUntilDue)) {
          // Vérifier si la relance n'a pas déjà été envoyée
          const { data: existingReminder } = await supabase
            .from('subscription_reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('days_before_due', daysUntilDue)
            .maybeSingle();

          if (!existingReminder) {
            // Envoyer la notification
            const reminderType = getReminderType(daysUntilDue);

            const { data: notification, error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: invoice.subscriptions.organizations.owner_id,
                type: 'subscription_reminder',
                title: `Rappel de paiement - ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`,
                message: `Votre facture ${invoice.invoice_number} arrive à échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}. Montant: ${invoice.amount} FCFA`,
                priority: daysUntilDue <= 7 ? 'high' : 'medium'
              })
              .select()
              .single();

            if (notifError) {
              console.error('Error creating notification:', notifError);
              errors++;
              continue;
            }

            // Enregistrer la relance
            await supabase
              .from('subscription_reminders')
              .insert({
                subscription_id: invoice.subscription_id,
                invoice_id: invoice.id,
                reminder_type: reminderType,
                days_before_due: daysUntilDue,
                notification_id: notification.id
              });

            sent++;
          }
        }
      } catch (error) {
        console.error(`Error processing reminder for invoice ${invoice.id}:`, error);
        errors++;
      }
    }

    return { sent, errors };
  } catch (error) {
    console.error('Error processing reminders:', error);
    throw error;
  }
};

// ============================================
// AUTO-SUSPEND EXPIRED SUBSCRIPTIONS
// ============================================

/**
 * Suspendre automatiquement les abonnements expirés
 * À exécuter quotidiennement via un job automatique
 */
export const autoSuspendExpiredSubscriptions = async (): Promise<{
  suspended: number;
  errors: number;
}> => {
  try {
    // Récupérer les paramètres
    const { data: settings, error: settingsError } = await supabase
      .from('subscription_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings || !settings.auto_suspend_after_trial) {
      return { suspended: 0, errors: 0 };
    }

    const gracePeriodDays = settings.grace_period_days || 0;

    // Récupérer les abonnements à suspendre
    const today = new Date();
    const suspensionDate = new Date(today);
    suspensionDate.setDate(suspensionDate.getDate() - gracePeriodDays);

    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        organizations (name, owner_id)
      `)
      .eq('status', 'pending_payment')
      .lte('next_billing_date', suspensionDate.toISOString());

    if (subsError) throw subsError;

    let suspended = 0;
    let errors = 0;

    for (const subscription of subscriptions || []) {
      try {
        // Suspendre l'abonnement
        await supabase
          .from('subscriptions')
          .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            cancellation_reason: 'Suspension automatique pour non-paiement'
          })
          .eq('id', subscription.id);

        // Envoyer une notification
        await supabase
          .from('notifications')
          .insert({
            user_id: subscription.organizations.owner_id,
            type: 'subscription_suspended',
            title: 'Abonnement suspendu',
            message: `Votre abonnement Ravito Gestion a été suspendu pour non-paiement. Contactez-nous pour régulariser votre situation.`,
            priority: 'high'
          });

        suspended++;
      } catch (error) {
        console.error(`Error suspending subscription ${subscription.id}:`, error);
        errors++;
      }
    }

    return { suspended, errors };
  } catch (error) {
    console.error('Error auto-suspending subscriptions:', error);
    throw error;
  }
};

/**
 * Job principal à exécuter quotidiennement
 * Combine l'envoi des relances et la suspension automatique
 */
export const runDailySubscriptionJob = async (): Promise<{
  remindersSent: number;
  reminderErrors: number;
  subscriptionsSuspended: number;
  suspensionErrors: number;
}> => {
  console.log('Starting daily subscription job...');

  const reminders = await processReminders();
  const suspensions = await autoSuspendExpiredSubscriptions();

  console.log('Daily subscription job completed:', {
    remindersSent: reminders.sent,
    reminderErrors: reminders.errors,
    subscriptionsSuspended: suspensions.suspended,
    suspensionErrors: suspensions.errors
  });

  return {
    remindersSent: reminders.sent,
    reminderErrors: reminders.errors,
    subscriptionsSuspended: suspensions.suspended,
    suspensionErrors: suspensions.errors
  };
};
