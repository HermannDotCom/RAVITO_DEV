import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://ravito.ci';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'RAVITO <noreply@ravito.ci>';

// CORS: Wildcard allowed for Edge Functions called from browser clients
// Edge Functions are protected by Supabase auth and RLS policies
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    // Generate the reset link via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${SITE_URL}/reset-password`,
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      // Security: Don't reveal if email exists or not
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const resetLink = data.properties?.action_link;
    
    if (!resetLink) {
      throw new Error('Failed to generate reset link');
    }

    // Get user profile for personalization
    let userName = 'Utilisateur';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.name) {
        userName = profile.name;
      }
    } catch (profileError) {
      console.log('Could not fetch profile, using default name');
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
        background: linear-gradient(135deg, #F97316, #EA580C);
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
      
      .title {
        font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 24px 0;
        line-height: 1.3;
      }
      
      .text {
        font-size: 16px;
        line-height: 1.6;
        color: #4B5563;
        margin: 0 0 24px 0;
      }
      
      .button {
        display: inline-block;
        background-color: #F97316;
        color: #FFFFFF;
        font-size: 16px;
        font-weight: 600;
        font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
        margin: 20px 0;
      }
      
      .button:hover {
        background-color: #EA580C;
      }
      
      .warning {
        background-color: #FEF3C7;
        border: 1px solid #F59E0B;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
      }
      
      .warning-title {
        font-size: 14px;
        font-weight: 600;
        color: #92400E;
        margin: 0 0 8px 0;
      }
      
      .warning-text {
        font-size: 13px;
        color: #78350F;
        margin: 0;
        line-height: 1.5;
      }
      
      .link-box {
        background-color: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
      }
      
      .link-text {
        font-size: 12px;
        color: #6B7280;
        word-break: break-all;
        margin: 0;
        font-family: 'Courier New', monospace;
      }
      
      .footer {
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
        margin: 0;
      }
      
      @media only screen and (max-width: 600px) {
        .email-content {
          padding: 24px !important;
        }
        
        .email-header {
          padding: 24px !important;
        }
        
        .footer {
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
          <h1 class="title">🔐 Réinitialisation du mot de passe</h1>
          
          <p class="text">Bonjour ${userName},</p>
          <p class="text">
            Vous avez demandé la réinitialisation de votre mot de passe sur RAVITO.
          </p>
          <p class="text">
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
          </div>
          
          <div class="warning">
            <p class="warning-title">⚠️ Ce lien expirera dans 1 heure.</p>
            <p class="warning-text">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>
          
          <div class="link-box">
            <p style="font-size: 13px; color: #6B7280; margin: 0 0 8px 0; font-weight: 600;">
              Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :
            </p>
            <p class="link-text">${resetLink}</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-slogan">
            Le ravitaillement qui ne dort jamais 🌙
          </p>
          <p class="footer-copyright">
            © ${new Date().getFullYear()} RAVITO. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: 'Réinitialisation de votre mot de passe RAVITO',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', errorText);
      throw new Error('Failed to send email');
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de réinitialisation envoyé avec succès.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-password-reset function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue. Veuillez réessayer.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
