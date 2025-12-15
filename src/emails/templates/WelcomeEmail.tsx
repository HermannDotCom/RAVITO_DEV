import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  role: 'client' | 'supplier';
  businessName?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  userEmail,
  role,
  businessName,
  dashboardUrl = 'https://ravito.ci/dashboard',
}) => {
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
          Bienvenue sur RAVITO, {userName} ! 🎉
        </h1>

        {/* Personalized message */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#4B5563',
            margin: '0 0 24px 0',
          }}
        >
          {isSupplier
            ? `Nous sommes ravis de vous accueillir parmi nos fournisseurs partenaires ! Votre compte fournisseur est maintenant actif et prêt à recevoir des commandes.`
            : `Nous sommes ravis de vous compter parmi nos clients ! Votre compte est maintenant actif et vous pouvez commencer à passer vos commandes.`}
        </p>

        {/* Account summary */}
        {businessName && (
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
                fontSize: '14px',
                color: '#6B7280',
                margin: '0 0 8px 0',
                fontWeight: '600',
              }}
            >
              Récapitulatif de votre compte
            </p>
            <p style={{ fontSize: '14px', color: '#111827', margin: '4px 0' }}>
              <strong>Établissement :</strong> {businessName}
            </p>
            <p style={{ fontSize: '14px', color: '#111827', margin: '4px 0' }}>
              <strong>Rôle :</strong> {isSupplier ? 'Fournisseur' : 'Client'}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={dashboardUrl}
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
            Accéder à mon espace →
          </a>
        </div>

        {/* Features section */}
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '32px',
          }}
        >
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0',
            }}
          >
            {isSupplier
              ? 'Fonctionnalités disponibles :'
              : 'Vos fonctionnalités :'}
          </h2>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            {features.map((feature, index) => (
              <li
                key={index}
                style={{
                  fontSize: '14px',
                  color: '#4B5563',
                  marginBottom: '8px',
                  lineHeight: '1.5',
                }}
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Support section */}
        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#6B7280',
            margin: '32px 0 0 0',
            textAlign: 'center',
          }}
        >
          Besoin d'aide ? Contactez notre équipe support à{' '}
          <a
            href="mailto:support@ravito.ci"
            style={{ color: '#F97316', textDecoration: 'none' }}
          >
            support@ravito.ci
          </a>
        </p>
      </div>
    </BaseEmailTemplate>
  );
};

export const welcomeEmailSubject = (userName: string): string => {
  return `Bienvenue sur RAVITO, ${userName} ! 🎉`;
};

export const welcomeEmailPreview = (businessName?: string): string => {
  return businessName
    ? `Votre compte ${businessName} a été créé avec succès. Commencez dès maintenant !`
    : `Votre compte RAVITO a été créé avec succès. Commencez dès maintenant !`;
};
