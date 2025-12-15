import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface PasswordResetEmailProps {
  userName: string;
  userEmail: string;
  resetUrl: string;
  expirationMinutes?: number;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  userEmail,
  resetUrl,
  expirationMinutes = 30,
}) => {
  return (
    <BaseEmailTemplate recipientEmail={userEmail}>
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
          Réinitialisation de mot de passe
        </h1>

        {/* Message */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#4B5563',
            margin: '0 0 24px 0',
          }}
        >
          Bonjour {userName},
        </p>
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#4B5563',
            margin: '0 0 24px 0',
          }}
        >
          Vous avez demandé la réinitialisation de votre mot de passe RAVITO.
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={resetUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              padding: '14px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
            }}
          >
            🔐 Réinitialiser mon mot de passe
          </a>
        </div>

        {/* Warning box */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '2px solid #FCD34D',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#92400E',
              margin: '0 0 8px 0',
            }}
          >
            ⚠️ Ce lien expire dans {expirationMinutes} minutes
          </p>
          <p
            style={{
              fontSize: '13px',
              color: '#78350F',
              margin: '0',
              lineHeight: '1.5',
            }}
          >
            Pour des raisons de sécurité, ce lien de réinitialisation n'est
            valide que pendant {expirationMinutes} minutes. Passé ce délai, vous
            devrez refaire une demande de réinitialisation.
          </p>
        </div>

        {/* Alternative link section */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: '#6B7280',
              margin: '0 0 8px 0',
              fontWeight: '600',
            }}
          >
            Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :
          </p>
          <p
            style={{
              fontSize: '12px',
              color: '#F97316',
              margin: '0',
              wordBreak: 'break-all',
              fontFamily: "'Courier New', monospace",
            }}
          >
            {resetUrl}
          </p>
        </div>

        {/* Security notice */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: '20px',
            marginTop: '32px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#6B7280',
              margin: '0',
              textAlign: 'center',
            }}
          >
            <strong>Note de sécurité :</strong> Si vous n'avez pas demandé cette
            réinitialisation, vous pouvez ignorer cet email en toute sécurité.
            Votre mot de passe actuel reste inchangé.
          </p>
        </div>
      </div>
    </BaseEmailTemplate>
  );
};

export const passwordResetSubject = (): string => {
  return 'Réinitialisation de votre mot de passe RAVITO';
};

export const passwordResetPreview = (): string => {
  return 'Cliquez sur le lien pour réinitialiser votre mot de passe. Ce lien expire bientôt.';
};
