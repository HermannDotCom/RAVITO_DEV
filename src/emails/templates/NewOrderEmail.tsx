import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';
import { formatAmount } from '../utils';

interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface NewOrderEmailProps {
  supplierName: string;
  supplierEmail?: string;
  orderId: string;
  clientName: string;
  clientAddress: string;
  clientZone: string;
  items: OrderItem[];
  totalAmount: number;
  dashboardUrl: string;
}

export const NewOrderEmail: React.FC<NewOrderEmailProps> = ({
  supplierName,
  supplierEmail,
  orderId,
  clientName,
  clientAddress,
  clientZone,
  items,
  totalAmount,
  dashboardUrl,
}) => {
  return (
    <BaseEmailTemplate recipientEmail={supplierEmail}>
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
          🔔 Nouvelle commande disponible !
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
          Bonjour {supplierName},
        </p>
        <p
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#4B5563',
            margin: '0 0 32px 0',
          }}
        >
          Une nouvelle commande est disponible dans votre zone de livraison.
          Consultez les détails ci-dessous et faites votre meilleure offre !
        </p>

        {/* Order card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #F97316',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Order ID */}
          <div style={{ marginBottom: '20px' }}>
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0 0 4px 0',
                fontWeight: '600',
              }}
            >
              Numéro de commande
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#F97316',
                margin: '0',
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              }}
            >
              #{orderId}
            </p>
          </div>

          {/* Client info */}
          <div
            style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                }}
              >
                Client
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: '#111827',
                  margin: '0',
                  fontWeight: '600',
                }}
              >
                {clientName}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                }}
              >
                Zone
              </p>
              <p style={{ fontSize: '15px', color: '#111827', margin: '0' }}>
                {clientZone}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                }}
              >
                Adresse de livraison
              </p>
              <p style={{ fontSize: '15px', color: '#111827', margin: '0' }}>
                {clientAddress}
              </p>
            </div>
          </div>

          {/* Items list */}
          <div
            style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#6B7280',
                margin: '0 0 12px 0',
                fontWeight: '600',
              }}
            >
              Articles commandés
            </p>
            <div
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              {items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: index < items.length - 1 ? '8px' : '0',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4B5563',
                    }}
                  >
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total amount */}
          <div
            style={{
              borderTop: '2px solid #F97316',
              paddingTop: '16px',
              textAlign: 'right',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: '0 0 4px 0',
              }}
            >
              Montant estimé
            </p>
            <p
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#F97316',
                margin: '0',
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              }}
            >
              {formatAmount(totalAmount)} FCFA
            </p>
          </div>
        </div>

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
            📋 Voir la commande et faire une offre
          </a>
        </div>

        {/* Urgency message */}
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#C2410C',
              margin: '0',
            }}
          >
            💡 Répondez rapidement pour augmenter vos chances d'obtenir cette
            commande !
          </p>
        </div>
      </div>
    </BaseEmailTemplate>
  );
};

export const newOrderSubject = (orderId: string, zone: string): string => {
  return `🔔 Nouvelle commande #${orderId} - ${zone}`;
};

export const newOrderPreview = (
  clientName: string,
  totalAmount: number
): string => {
  return `Nouvelle commande de ${clientName} - ${formatAmount(totalAmount)} FCFA`;
};
