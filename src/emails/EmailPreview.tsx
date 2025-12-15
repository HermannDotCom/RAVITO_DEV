import React, { useState } from 'react';
import {
  WelcomeEmail,
  PasswordResetEmail,
  NewOrderEmail,
  DeliveryConfirmationEmail,
} from './templates';

/**
 * Component to preview email templates in the browser
 * Useful for development and testing
 */
export const EmailPreview: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome-client');

  const templates = [
    { id: 'welcome-client', label: 'Bienvenue Client' },
    { id: 'welcome-supplier', label: 'Bienvenue Fournisseur' },
    { id: 'password-reset', label: 'Réinitialisation Mot de Passe' },
    { id: 'new-order', label: 'Nouvelle Commande' },
    { id: 'delivery-confirmation', label: 'Confirmation Livraison' },
  ];

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'welcome-client':
        return (
          <WelcomeEmail
            userName="Marie"
            userEmail="marie@restaurant.com"
            role="client"
            businessName="Restaurant Le Soleil"
            dashboardUrl="https://ravito.ci/dashboard"
          />
        );
      
      case 'welcome-supplier':
        return (
          <WelcomeEmail
            userName="Amadou"
            userEmail="amadou@fournisseur.com"
            role="supplier"
            businessName="Fournisseur ABC"
            dashboardUrl="https://ravito.ci/supplier/dashboard"
          />
        );
      
      case 'password-reset':
        return (
          <PasswordResetEmail
            userName="Marie"
            userEmail="marie@restaurant.com"
            resetUrl="https://ravito.ci/reset-password?token=abc123xyz789"
            expirationMinutes={30}
          />
        );
      
      case 'new-order':
        return (
          <NewOrderEmail
            supplierName="Amadou Traoré"
            supplierEmail="amadou@fournisseur.com"
            orderId="ORD-2024-001"
            clientName="Restaurant Le Soleil"
            clientAddress="Rue 12, Boulevard Latrille"
            clientZone="Cocody"
            items={[
              { name: 'Riz parfumé', quantity: 25, unit: 'kg' },
              { name: 'Huile végétale', quantity: 10, unit: 'L' },
              { name: 'Tomates fraîches', quantity: 15, unit: 'kg' },
              { name: 'Oignons', quantity: 8, unit: 'kg' },
            ]}
            totalAmount={125000}
            dashboardUrl="https://ravito.ci/supplier/orders/ORD-2024-001"
          />
        );
      
      case 'delivery-confirmation':
        return (
          <DeliveryConfirmationEmail
            clientName="Marie"
            clientEmail="marie@restaurant.com"
            orderId="ORD-2024-001"
            supplierName="Fournisseur ABC"
            deliveryTime="Aujourd'hui à 14h30"
            totalAmount={125000}
            ratingUrl="https://ravito.ci/orders/ORD-2024-001/rate"
          />
        );
      
      default:
        return <div>Sélectionnez un template</div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '280px',
          backgroundColor: '#F4F4F5',
          padding: '20px',
          borderRight: '1px solid #E5E7EB',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '20px',
          }}
        >
          Email Templates
        </h2>
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '8px',
              backgroundColor:
                selectedTemplate === template.id ? '#F97316' : '#FFFFFF',
              color: selectedTemplate === template.id ? '#FFFFFF' : '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedTemplate === template.id ? '600' : '400',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedTemplate !== template.id) {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTemplate !== template.id) {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }
            }}
          >
            {template.label}
          </button>
        ))}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#FFF7ED',
            borderRadius: '8px',
            border: '1px solid #FED7AA',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#92400E',
              margin: '0',
              lineHeight: '1.5',
            }}
          >
            <strong>Note :</strong> Ces templates sont optimisés pour les
            clients email (Gmail, Outlook, etc.) et peuvent apparaître
            différemment dans le navigateur.
          </p>
        </div>
      </div>

      {/* Preview area */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          overflowY: 'auto',
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
};
