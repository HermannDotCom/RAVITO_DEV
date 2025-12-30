import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface WelcomeMemberEmailProps {
  memberName: string;
  organizationName: string;
  email: string;
  password: string;
  role: string;
  loginUrl?: string;
}

export const WelcomeMemberEmail: React.FC<WelcomeMemberEmailProps> = ({
  memberName,
  organizationName,
  email,
  password,
  role,
  loginUrl = 'https://ravito.ci/login',
}) => {
  return (
    <BaseEmailTemplate recipientEmail={email}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 24px 0',
            lineHeight: '1.3',
          }}
        >
          Bienvenue dans l'équipe {organizationName} ! 👋
        </h1>

        {/* Introduction */}
        <p
          style={{
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: '16px',
            color: '#4B5563',
            lineHeight: '1.6',
            margin: '0 0 24px 0',
          }}
        >
          Bonjour <strong>{memberName}</strong>,
        </p>

        <p
          style={{
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: '16px',
            color: '#4B5563',
            lineHeight: '1.6',
            margin: '0 0 24px 0',
          }}
        >
          Vous avez été ajouté(e) comme membre de l'équipe <strong>{organizationName}</strong> sur RAVITO avec le rôle de <strong>{role}</strong>.
        </p>

        {/* Credentials Box */}
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '24px',
            margin: '0 0 24px 0',
          }}
        >
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: '18px',
              fontWeight: '600',
              color: '#92400E',
              margin: '0 0 16px 0',
            }}
          >
            🔐 Vos identifiants de connexion
          </h2>
          
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                color: '#92400E',
                marginBottom: '4px',
              }}
            >
              Email :
            </div>
            <div
              style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: '16px',
                color: '#1F2937',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
              }}
            >
              {email}
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                color: '#92400E',
                marginBottom: '4px',
              }}
            >
              Mot de passe temporaire :
            </div>
            <div
              style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: '16px',
                color: '#1F2937',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: "'Courier New', monospace",
              }}
            >
              {password}
            </div>
          </div>

          <p
            style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: '14px',
              color: '#92400E',
              lineHeight: '1.5',
              margin: '16px 0 0 0',
            }}
          >
            ⚠️ <strong>Important :</strong> Nous vous recommandons fortement de changer ce mot de passe lors de votre première connexion pour des raisons de sécurité.
          </p>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={loginUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '16px 32px',
              borderRadius: '8px',
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(234, 88, 12, 0.2)',
            }}
          >
            Se connecter maintenant
          </a>
        </div>

        {/* Instructions */}
        <div
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: '12px',
            padding: '20px',
            margin: '0 0 24px 0',
          }}
        >
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 12px 0',
            }}
          >
            Pour vous connecter :
          </h3>
          <ol
            style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: '14px',
              color: '#4B5563',
              lineHeight: '1.6',
              paddingLeft: '20px',
              margin: '0',
            }}
          >
            <li style={{ marginBottom: '8px' }}>Cliquez sur le bouton "Se connecter maintenant" ci-dessus</li>
            <li style={{ marginBottom: '8px' }}>Entrez votre adresse email et votre mot de passe temporaire</li>
            <li style={{ marginBottom: '8px' }}>Une fois connecté(e), changez votre mot de passe dans les paramètres de votre profil</li>
          </ol>
        </div>

        {/* Footer message */}
        <p
          style={{
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.6',
            margin: '0 0 16px 0',
          }}
        >
          Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à contacter votre administrateur ou notre équipe support.
        </p>

        <p
          style={{
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.6',
            margin: '0',
          }}
        >
          À bientôt sur RAVITO !<br />
          L'équipe RAVITO 🚀
        </p>
      </div>
    </BaseEmailTemplate>
  );
};
