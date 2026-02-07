import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function calculatePeriodEnd(
  startDate: Date,
  billingCycle: string
): Date {
  const date = new Date(startDate);

  switch (billingCycle) {
    case "monthly": {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    }
    case "semesterly": {
      const month = date.getMonth();
      if (month < 6) {
        return new Date(date.getFullYear(), 5, 30, 23, 59, 59, 999);
      } else {
        return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      }
    }
    case "annually": {
      return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    default:
      throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }
}

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
    // 0. EXPIRER LES ESSAIS GRATUITS
    // ==========================================

    let trialsExpired = 0;
    let trialErrors = 0;

    const now = new Date();
    const todayISO = now.toISOString();

    const { data: expiredTrials, error: trialsError } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        subscription_plans (*),
        organizations (id, name, owner_id)
      `
      )
      .eq("status", "trial")
      .lte("trial_end_date", todayISO);

    if (trialsError) throw trialsError;

    for (const sub of expiredTrials || []) {
      try {
        const plan = sub.subscription_plans;
        if (!plan) {
          console.error(`No plan found for subscription ${sub.id}`);
          trialErrors++;
          continue;
        }

        const trialEndDate = new Date(sub.trial_end_date);
        const periodEnd = calculatePeriodEnd(trialEndDate, plan.billing_cycle);

        const daysRemaining = Math.ceil(
          (periodEnd.getTime() - trialEndDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const totalDaysInPeriod = plan.days_in_cycle;
        const amount = Math.round(
          (parseFloat(plan.price) * daysRemaining) / totalDaysInPeriod
        );

        const { data: invoiceNumber, error: numberError } = await supabase.rpc(
          "generate_invoice_number"
        );

        if (numberError) {
          console.error(
            `Error generating invoice number for sub ${sub.id}:`,
            numberError
          );
          trialErrors++;
          continue;
        }

        const { error: invoiceError } = await supabase
          .from("subscription_invoices")
          .insert({
            subscription_id: sub.id,
            organization_id: sub.organization_id,
            invoice_number: invoiceNumber,
            amount: amount,
            amount_due: amount,
            prorata_amount: amount,
            days_calculated: daysRemaining,
            is_prorata: true,
            period_start: trialEndDate.toISOString().split("T")[0],
            period_end: periodEnd.toISOString().split("T")[0],
            due_date: periodEnd.toISOString().split("T")[0],
            status: "pending",
          });

        if (invoiceError) {
          console.error(
            `Error creating invoice for sub ${sub.id}:`,
            invoiceError
          );
          trialErrors++;
          continue;
        }

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "pending_payment",
            current_period_start: trialEndDate.toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_date: periodEnd.toISOString().split("T")[0],
            amount_due: amount,
            is_prorata: true,
            prorata_days: daysRemaining,
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error(
            `Error updating subscription ${sub.id}:`,
            updateError
          );
          trialErrors++;
          continue;
        }

        const ownerId = sub.organizations?.owner_id;
        if (ownerId) {
          await supabase.from("notifications").insert({
            user_id: ownerId,
            type: "subscription_reminder",
            title: "Fin de votre essai gratuit",
            message: `Votre periode d'essai est terminee. Une facture de ${amount} FCFA a ete generee. Veuillez proceder au paiement pour continuer a utiliser Ravito Gestion.`,
            priority: "high",
          });
        }

        console.log(
          `Trial expired for subscription ${sub.id}: invoice ${invoiceNumber}, amount ${amount} FCFA`
        );
        trialsExpired++;
      } catch (error) {
        console.error(
          `Error processing trial expiration for sub ${sub.id}:`,
          error
        );
        trialErrors++;
      }
    }

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

    const { data: invoices, error: invoicesError } = await supabase
      .from("subscription_invoices")
      .select(
        `
        *,
        subscriptions (
          *,
          subscription_plans (billing_cycle),
          organizations (id, name, owner_id)
        )
      `
      )
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

        if (daysUntilDue < 0) {
          await supabase
            .from("subscription_invoices")
            .update({ status: "overdue" })
            .eq("id", invoice.id);
          continue;
        }

        const billingCycle =
          invoice.subscriptions.subscription_plans.billing_cycle;
        const reminderDaysForCycle = reminderDays[billingCycle] || [];

        if (reminderDaysForCycle.includes(daysUntilDue)) {
          const { data: existingReminder } = await supabase
            .from("subscription_reminders")
            .select("id")
            .eq("invoice_id", invoice.id)
            .eq("days_before_due", daysUntilDue)
            .maybeSingle();

          if (!existingReminder) {
            const { data: notification, error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: invoice.subscriptions.organizations.owner_id,
                type: "subscription_reminder",
                title: `Rappel de paiement - ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""}`,
                message: `Votre facture ${invoice.invoice_number} arrive a echeance dans ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""}. Montant: ${invoice.amount} FCFA`,
                priority: daysUntilDue <= 7 ? "high" : "medium",
              })
              .select()
              .single();

            if (notifError) {
              console.error("Error creating notification:", notifError);
              reminderErrors++;
              continue;
            }

            let reminderType = "j_minus_2";
            if (daysUntilDue >= 90) reminderType = "j_minus_90";
            else if (daysUntilDue >= 60) reminderType = "j_minus_60";
            else if (daysUntilDue >= 30) reminderType = "j_minus_30";
            else if (daysUntilDue >= 15) reminderType = "j_minus_15";
            else if (daysUntilDue >= 7) reminderType = "j_minus_7";

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
        console.error(
          `Error processing reminder for invoice ${invoice.id}:`,
          error
        );
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
        .select(
          `
          *,
          organizations (name, owner_id)
        `
        )
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
              cancellation_reason:
                "Suspension automatique pour non-paiement",
            })
            .eq("id", subscription.id);

          await supabase.from("notifications").insert({
            user_id: subscription.organizations.owner_id,
            type: "subscription_suspended",
            title: "Abonnement suspendu",
            message:
              "Votre abonnement Ravito Gestion a ete suspendu pour non-paiement. Contactez-nous pour regulariser votre situation.",
            priority: "high",
          });

          subscriptionsSuspended++;
        } catch (error) {
          console.error(
            `Error suspending subscription ${subscription.id}:`,
            error
          );
          suspensionErrors++;
        }
      }
    }

    // ==========================================
    // RÉSULTAT
    // ==========================================

    const result = {
      success: true,
      trialsExpired,
      trialErrors,
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
