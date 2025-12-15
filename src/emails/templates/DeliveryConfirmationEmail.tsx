import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface DeliveryConfirmationEmailProps {
  clientName: string;
  clientEmail?: string;
  orderId: string;
  supplierName: string;
  deliveryTime: string;
  totalAmount: number;
  ratingUrl?: string;
}

export const DeliveryConfirmationEmail: React.FC<
  DeliveryConfirmationEmailProps
> = ({
  clientName,
  clientEmail,
  orderId,
  supplierName,
  deliveryTime,
  totalAmount,
  ratingUrl,
}) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <BaseEmailTemplate recipientEmail={clientEmail}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
        {/* Success icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <span style={{ fontSize: '48px', color: '#FFFFFF' }}>✓</span>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 24px 0',
            lineHeight: '1.3',
            textAlign: 'center',
          }}
        >
          Livraison effectuée ! 🎉
        </h1>

        {/* Message */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#4B5563',
            margin: '0 0 32px 0',
            textAlign: 'center',
          }}
        >
          Bonjour {clientName}, votre commande a été livrée avec succès.
        </p>

        {/* Order summary card */}
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <p
              style={{
                fontSize: '13px',
                color: '#065F46',
                margin: '0 0 4px 0',
                fontWeight: '600',
              }}
            >
              Commande
            </p>
            <p
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#059669',
                margin: '0',
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              }}
            >
              #{orderId}
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid #A7F3D0',
              paddingTop: '16px',
              marginBottom: '12px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#065F46',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                }}
              >
                Fournisseur
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: '#047857',
                  margin: '0',
                  fontWeight: '600',
                }}
              >
                {supplierName}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#065F46',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                }}
              >
                Heure de livraison
              </p>
              <p style={{ fontSize: '15px', color: '#047857', margin: '0' }}>
                {deliveryTime}
              </p>
            </div>

            <div
              style={{
                borderTop: '2px solid #10B981',
                paddingTop: '12px',
                marginTop: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#065F46',
                    margin: '0',
                    fontWeight: '600',
                  }}
                >
                  Total
                </p>
                <p
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#059669',
                    margin: '0',
                    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
                  }}
                >
                  {formatAmount(totalAmount)} FCFA
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating section */}
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '2px solid #FDBA74',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'center',
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
            Comment s'est passée votre livraison ?
          </h2>

          {/* Star rating visual */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '32px', letterSpacing: '4px' }}>
              ⭐⭐⭐⭐⭐
            </span>
          </div>

          {/* Rating button */}
          {ratingUrl && (
            <a
              href={ratingUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
                padding: '12px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
              }}
            >
              Évaluer ma livraison
            </a>
          )}
        </div>

        {/* Thank you message */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <p
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#4B5563',
              margin: '0',
            }}
          >
            Merci de votre confiance ! À très bientôt sur RAVITO. 🧡
          </p>
        </div>
      </div>
    </BaseEmailTemplate>
  );
};

export const deliveryConfirmationSubject = (orderId: string): string => {
  return `✅ Livraison effectuée - Commande #${orderId}`;
};

export const deliveryConfirmationPreview = (supplierName: string): string => {
  return `Votre commande de ${supplierName} a été livrée. Partagez votre avis !`;
};
