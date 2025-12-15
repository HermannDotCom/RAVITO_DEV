import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'RAVITO <noreply@ravito.ci>';

// CORS: Wildcard allowed for Edge Functions called from browser clients
// Edge Functions are protected by Supabase auth and RLS policies
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'welcome' | 'password_reset' | 'new_order' | 'delivery_confirmation';
  to: string;
  data: Record<string, unknown>;
}

interface EmailContent {
  subject: string;
  html: string;
}

// Format amount in FCFA with French number formatting
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Base email template HTML
function buildBaseEmailTemplate(content: string, recipientEmail?: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
      
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', Arial, sans-serif;
        background-color: #F4F4F5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .email-wrapper {
        width: 100%;
        background-color: #F4F4F5;
        padding: 20px 0;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #FFFFFF;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .email-header {
        background-color: #F97316;
        padding: 32px;
        text-align: center;
      }
      
      .logo {
        width: 60px;
        height: 60px;
        background-color: #FFFFFF;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        font-size: 32px;
        font-weight: 700;
        color: #F97316;
        margin: 0 auto;
        line-height: 60px;
      }
      
      .email-content {
        padding: 32px;
      }
      
      .email-footer {
        background-color: #F4F4F5;
        padding: 24px 32px;
        text-align: center;
        border-top: 1px solid #E5E7EB;
      }
      
      .footer-slogan {
        font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 12px 0;
      }
      
      .footer-copyright {
        font-size: 12px;
        color: #6B7280;
        margin: 0 0 16px 0;
      }
      
      .footer-links {
        margin: 16px 0;
      }
      
      .footer-link {
        color: #F97316;
        text-decoration: none;
        font-size: 12px;
        margin: 0 8px;
      }
      
      .footer-link:hover {
        text-decoration: underline;
      }
      
      .footer-email-info {
        font-size: 11px;
        color: #9CA3AF;
        margin-top: 16px;
      }
      
      @media only screen and (max-width: 600px) {
        .email-content {
          padding: 24px !important;
        }
        
        .email-header {
          padding: 24px !important;
        }
        
        .email-footer {
          padding: 20px 24px !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <div class="logo">R</div>
        </div>
        <div class="email-content">
          ${content}
        </div>
        <div class="email-footer">
          <p class="footer-slogan">
            Le ravitaillement qui ne dort jamais 🌙
          </p>
          <p class="footer-copyright">
            © ${currentYear} RAVITO. Tous droits réservés.
          </p>
          <div class="footer-links">
            <a href="https://ravito.ci" class="footer-link">ravito.ci</a>
            <span style="color: #D1D5DB;">•</span>
            <a href="https://ravito.ci/cgu" class="footer-link">CGU</a>
            <span style="color: #D1D5DB;">•</span>
            <a href="mailto:support@ravito.ci" class="footer-link">Support</a>
          </div>
          ${recipientEmail ? `<p class="footer-email-info">Cet email a été envoyé à ${recipientEmail}</p>` : ''}
        </div>
      </div>
    </div>
  </body>
</html>`;
}

// Build welcome email HTML
function buildWelcomeEmailHtml(data: Record<string, unknown>): string {
  const userName = String(data.userName || 'Utilisateur');
  const userEmail = String(data.userEmail || '');
  const role = String(data.role || 'client');
  const businessName = data.businessName ? String(data.businessName) : undefined;
  const dashboardUrl = String(data.dashboardUrl || 'https://ravito.ci/dashboard');
  
  const isSupplier = role === 'supplier';
  const features = isSupplier
    ? [
        'Réception des commandes en temps réel',
        'Gestion des livraisons et tournées',
        'Suivi de vos revenus et statistiques',
        'Configuration de vos zones de livraison',
      ]
    : [
        'Accès au catalogue complet de produits',
        'Passez vos commandes 24/7',
        'Suivi en temps réel de vos commandes',
        'Gestion de votre trésorerie',
      ];

  const content = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
      <h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; line-height: 1.3;">
        Bienvenue sur RAVITO, ${userName} ! 🎉
      </h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0;">
        ${isSupplier
          ? `Nous sommes ravis de vous accueillir parmi nos fournisseurs partenaires ! Votre compte fournisseur est maintenant actif et prêt à recevoir des commandes.`
          : `Nous sommes ravis de vous compter parmi nos clients ! Votre compte est maintenant actif et vous pouvez commencer à passer vos commandes.`}
      </p>
      
      ${businessName ? `
      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0; font-weight: 600;">
          Récapitulatif de votre compte
        </p>
        <p style="font-size: 14px; color: #111827; margin: 4px 0;">
          <strong>Établissement :</strong> ${businessName}
        </p>
        <p style="font-size: 14px; color: #111827; margin: 4px 0;">
          <strong>Rôle :</strong> ${isSupplier ? 'Fournisseur' : 'Client'}
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #F97316; color: #FFFFFF; font-size: 16px; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);">
          Accéder à mon espace →
        </a>
      </div>
      
      <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 20px; margin-top: 32px;">
        <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
          ${isSupplier ? 'Fonctionnalités disponibles :' : 'Vos fonctionnalités :'}
        </h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${features.map(f => `<li style="font-size: 14px; color: #4B5563; margin-bottom: 8px; line-height: 1.5;">${f}</li>`).join('\n          ')}
        </ul>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #6B7280; margin: 32px 0 0 0; text-align: center;">
        Besoin d'aide ? Contactez notre équipe support à 
        <a href="mailto:support@ravito.ci" style="color: #F97316; text-decoration: none;">support@ravito.ci</a>
      </p>
    </div>
  `;

  return buildBaseEmailTemplate(content, userEmail);
}

// Build password reset email HTML
function buildPasswordResetEmailHtml(data: Record<string, unknown>): string {
  const userName = data.userName ? String(data.userName) : 'Utilisateur';
  const userEmail = String(data.userEmail || '');
  const resetUrl = String(data.resetUrl || '');
  const expirationMinutes = Number(data.expirationMinutes || 60);

  const content = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
      <h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; line-height: 1.3;">
        Réinitialisation de mot de passe
      </h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0;">
        Bonjour ${userName},
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0;">
        Vous avez demandé la réinitialisation de votre mot de passe RAVITO.
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #F97316; color: #FFFFFF; font-size: 16px; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);">
          🔐 Réinitialiser mon mot de passe
        </a>
      </div>
      
      <div style="background-color: #FFFBEB; border: 2px solid #FCD34D; border-radius: 8px; padding: 16px; margin-top: 24px; margin-bottom: 24px;">
        <p style="font-size: 14px; font-weight: 600; color: #92400E; margin: 0 0 8px 0;">
          ⚠️ Ce lien expire dans ${expirationMinutes} minutes
        </p>
        <p style="font-size: 13px; color: #78350F; margin: 0; line-height: 1.5;">
          Pour des raisons de sécurité, ce lien de réinitialisation n'est
          valide que pendant ${expirationMinutes} minutes. Passé ce délai, vous
          devrez refaire une demande de réinitialisation.
        </p>
      </div>
      
      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #6B7280; margin: 0 0 8px 0; font-weight: 600;">
          Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :
        </p>
        <p style="font-size: 12px; color: #F97316; margin: 0; word-break: break-all; font-family: 'Courier New', monospace;">
          ${resetUrl}
        </p>
      </div>
      
      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 32px;">
        <p style="font-size: 14px; line-height: 1.6; color: #6B7280; margin: 0; text-align: center;">
          <strong>Note de sécurité :</strong> Si vous n'avez pas demandé cette
          réinitialisation, vous pouvez ignorer cet email en toute sécurité.
          Votre mot de passe actuel reste inchangé.
        </p>
      </div>
    </div>
  `;

  return buildBaseEmailTemplate(content, userEmail);
}

// Build new order email HTML
function buildNewOrderEmailHtml(data: Record<string, unknown>): string {
  const supplierName = String(data.supplierName || 'Fournisseur');
  const orderId = String(data.orderId || '');
  const clientName = String(data.clientName || '');
  const clientZone = String(data.clientZone || '');
  const items = (data.items as Array<{ name: string; quantity: number; unit: string }>) || [];
  const totalAmount = Number(data.totalAmount || 0);
  const dashboardUrl = String(data.dashboardUrl || 'https://ravito.ci/supplier/orders');

  const content = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
      <h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; line-height: 1.3;">
        🔔 Nouvelle commande disponible !
      </h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0;">
        Bonjour ${supplierName},
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 32px 0;">
        Une nouvelle commande est disponible dans votre zone de livraison.
        Consultez les détails ci-dessous et faites votre meilleure offre !
      </p>
      
      <div style="background-color: #FFFFFF; border: 2px solid #F97316; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="margin-bottom: 20px;">
          <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0; font-weight: 600;">
            Numéro de commande
          </p>
          <p style="font-size: 24px; font-weight: 700; color: #F97316; margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            #${orderId}
          </p>
        </div>
        
        <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-bottom: 16px;">
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; color: #6B7280; margin: 0 0 4px 0; font-weight: 600;">Client</p>
            <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 600;">${clientName}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; color: #6B7280; margin: 0 0 4px 0; font-weight: 600;">Zone</p>
            <p style="font-size: 15px; color: #111827; margin: 0;">${clientZone}</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-bottom: 16px;">
          <p style="font-size: 13px; color: #6B7280; margin: 0 0 12px 0; font-weight: 600;">
            Articles commandés
          </p>
          <div style="background-color: #F9FAFB; border-radius: 8px; padding: 12px;">
            ${items.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #111827;">${item.name}</span>
                <span style="font-size: 14px; font-weight: 600; color: #4B5563;">${item.quantity} ${item.unit}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="border-top: 2px solid #F97316; padding-top: 16px; text-align: right;">
          <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0;">Montant estimé</p>
          <p style="font-size: 28px; font-weight: 700; color: #F97316; margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            ${formatAmount(totalAmount)} FCFA
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #F97316; color: #FFFFFF; font-size: 16px; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);">
          📋 Voir la commande et faire une offre
        </a>
      </div>
      
      <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 14px; font-weight: 600; color: #C2410C; margin: 0;">
          💡 Répondez rapidement pour augmenter vos chances d'obtenir cette commande !
        </p>
      </div>
    </div>
  `;

  return buildBaseEmailTemplate(content);
}

// Build delivery confirmation email HTML
function buildDeliveryConfirmationEmailHtml(data: Record<string, unknown>): string {
  const clientName = String(data.clientName || 'Client');
  const clientEmail = String(data.clientEmail || '');
  const orderId = String(data.orderId || '');
  const supplierName = String(data.supplierName || '');
  const deliveryTime = String(data.deliveryTime || '');
  const totalAmount = Number(data.totalAmount || 0);
  const ratingUrl = data.ratingUrl ? String(data.ratingUrl) : undefined;

  const content = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; background-color: #10B981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
          <span style="font-size: 48px; color: #FFFFFF; line-height: 80px;">✓</span>
        </div>
      </div>
      
      <h1 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; line-height: 1.3; text-align: center;">
        Livraison effectuée ! 🎉
      </h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0 0 32px 0; text-align: center;">
        Bonjour ${clientName}, votre commande a été livrée avec succès.
      </p>
      
      <div style="background-color: #ECFDF5; border: 2px solid #10B981; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px;">
          <p style="font-size: 13px; color: #065F46; margin: 0 0 4px 0; font-weight: 600;">Commande</p>
          <p style="font-size: 20px; font-weight: 700; color: #059669; margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            #${orderId}
          </p>
        </div>
        
        <div style="border-top: 1px solid #A7F3D0; padding-top: 16px; margin-bottom: 12px;">
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; color: #065F46; margin: 0 0 4px 0; font-weight: 600;">Fournisseur</p>
            <p style="font-size: 15px; color: #047857; margin: 0; font-weight: 600;">${supplierName}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; color: #065F46; margin: 0 0 4px 0; font-weight: 600;">Heure de livraison</p>
            <p style="font-size: 15px; color: #047857; margin: 0;">${deliveryTime}</p>
          </div>
          
          <div style="border-top: 2px solid #10B981; padding-top: 12px; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <p style="font-size: 15px; color: #065F46; margin: 0; font-weight: 600;">Total</p>
              <p style="font-size: 20px; font-weight: 700; color: #059669; margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                ${formatAmount(totalAmount)} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div style="background-color: #FFF7ED; border: 2px solid #FDBA74; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
          Comment s'est passée votre livraison ?
        </h2>
        
        <div style="margin-bottom: 20px;">
          <span style="font-size: 32px; letter-spacing: 4px;">⭐⭐⭐⭐⭐</span>
        </div>
        
        ${ratingUrl ? `
        <a href="${ratingUrl}" style="display: inline-block; background-color: #F97316; color: #FFFFFF; font-size: 16px; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);">
          Évaluer ma livraison
        </a>
        ` : ''}
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin: 0;">
          Merci de votre confiance ! À très bientôt sur RAVITO. 🧡
        </p>
      </div>
    </div>
  `;

  return buildBaseEmailTemplate(content, clientEmail);
}

// Build email content based on type
function buildEmailContent(type: string, data: Record<string, unknown>): EmailContent {
  switch (type) {
    case 'welcome': {
      const userName = String(data.userName || 'Utilisateur');
      return {
        subject: `Bienvenue sur RAVITO, ${userName} ! 🎉`,
        html: buildWelcomeEmailHtml(data),
      };
    }
    case 'password_reset':
      return {
        subject: 'Réinitialisation de votre mot de passe RAVITO',
        html: buildPasswordResetEmailHtml(data),
      };
    case 'new_order': {
      const orderId = String(data.orderId || '');
      const clientZone = String(data.clientZone || '');
      return {
        subject: `🔔 Nouvelle commande #${orderId} - ${clientZone}`,
        html: buildNewOrderEmailHtml(data),
      };
    }
    case 'delivery_confirmation': {
      const orderId = String(data.orderId || '');
      return {
        subject: `✅ Livraison effectuée - Commande #${orderId}`,
        html: buildDeliveryConfirmationEmailHtml(data),
      };
    }
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json() as EmailRequest;

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailContent = buildEmailContent(type, data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    // Log email (non-blocking - don't fail if logging fails)
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      await supabase.from('email_logs').insert({
        type,
        recipient: to,
        resend_id: result.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log email (non-fatal):', logError);
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
