import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Edge Function pour traiter les relances d'abonnement
 * Cette fonction doit être appelée quotidiennement via un cron job
 *
 * Configuration du cron dans Supabase:
 * pg_cron.schedule(
 *   'daily-subscription-reminders',
 *   '0 9 * * *', -- Tous les jours à 9h
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://your-project.supabase.co/functions/v1/subscription-reminders',
 *     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *   );
 *   $$
 * );
 */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting subscription reminders job...");

    // ==========================================
    // 1. TRAITER LES RELANCES
    // ==========================================

    const { data: settings, error: settingsError } = await supabase
      .from("subscription_settings")
      .select("*")
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings) throw new Error("Settings not found");

    const reminderDays = settings.reminder_days;

    // Récupérer les factures en attente
    const { data: invoices, error: invoicesError } = await supabase
      .from("subscription_invoices")
      .select(`
        *,
        subscriptions (
          *,
          subscription_plans (billing_cycle),
          organizations (id, name, owner_id)
        )
      `)
      .eq("status", "pending");

    if (invoicesError) throw invoicesError;

    let remindersSent = 0;
    let reminderErrors = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const invoice of invoices || []) {
      try {
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Marquer comme overdue si échue
        if (daysUntilDue < 0) {
          await supabase
            .from("subscription_invoices")
            .update({ status: "overdue" })
            .eq("id", invoice.id);
          continue;
        }

        // Vérifier si on doit envoyer une relance
        const billingCycle = invoice.subscriptions.subscription_plans.billing_cycle;
        const reminderDaysForCycle = reminderDays[billingCycle] || [];

        if (reminderDaysForCycle.includes(daysUntilDue)) {
          // Vérifier si pas déjà envoyée
          const { data: existingReminder } = await supabase
            .from("subscription_reminders")
            .select("id")
            .eq("invoice_id", invoice.id)
            .eq("days_before_due", daysUntilDue)
            .maybeSingle();

          if (!existingReminder) {
            // Créer notification
            const { data: notification, error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: invoice.subscriptions.organizations.owner_id,
                type: "subscription_reminder",
                title: `Rappel de paiement - ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""}`,
                message: `Votre facture ${invoice.invoice_number} arrive à échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""}. Montant: ${invoice.amount} FCFA`,
                priority: daysUntilDue <= 7 ? "high" : "medium",
              })
              .select()
              .single();

            if (notifError) {
              console.error("Error creating notification:", notifError);
              reminderErrors++;
              continue;
            }

            // Déterminer le type de relance
            let reminderType = "j_minus_2";
            if (daysUntilDue >= 90) reminderType = "j_minus_90";
            else if (daysUntilDue >= 60) reminderType = "j_minus_60";
            else if (daysUntilDue >= 30) reminderType = "j_minus_30";
            else if (daysUntilDue >= 15) reminderType = "j_minus_15";
            else if (daysUntilDue >= 7) reminderType = "j_minus_7";

            // Enregistrer la relance
            await supabase.from("subscription_reminders").insert({
              subscription_id: invoice.subscription_id,
              invoice_id: invoice.id,
              reminder_type: reminderType,
              days_before_due: daysUntilDue,
              notification_id: notification.id,
            });

            remindersSent++;
          }
        }
      } catch (error) {
        console.error(`Error processing reminder for invoice ${invoice.id}:`, error);
        reminderErrors++;
      }
    }

    // ==========================================
    // 2. SUSPENDRE LES ABONNEMENTS EXPIRÉS
    // ==========================================

    let subscriptionsSuspended = 0;
    let suspensionErrors = 0;

    if (settings.auto_suspend_after_trial) {
      const gracePeriodDays = settings.grace_period_days || 0;
      const suspensionDate = new Date(today);
      suspensionDate.setDate(suspensionDate.getDate() - gracePeriodDays);

      const { data: expiredSubs, error: expiredError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          organizations (name, owner_id)
        `)
        .eq("status", "pending_payment")
        .lte("next_billing_date", suspensionDate.toISOString());

      if (expiredError) throw expiredError;

      for (const subscription of expiredSubs || []) {
        try {
          await supabase
            .from("subscriptions")
            .update({
              status: "suspended",
              suspended_at: new Date().toISOString(),
              cancellation_reason: "Suspension automatique pour non-paiement",
            })
            .eq("id", subscription.id);

          await supabase.from("notifications").insert({
            user_id: subscription.organizations.owner_id,
            type: "subscription_suspended",
            title: "Abonnement suspendu",
            message: `Votre abonnement Ravito Gestion a été suspendu pour non-paiement. Contactez-nous pour régulariser votre situation.`,
            priority: "high",
          });

          subscriptionsSuspended++;
        } catch (error) {
          console.error(`Error suspending subscription ${subscription.id}:`, error);
          suspensionErrors++;
        }
      }
    }

    // ==========================================
    // RÉSULTAT
    // ==========================================

    const result = {
      success: true,
      remindersSent,
      reminderErrors,
      subscriptionsSuspended,
      suspensionErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("Subscription reminders job completed:", result);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in subscription-reminders function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
