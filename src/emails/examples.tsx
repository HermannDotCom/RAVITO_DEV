/**
 * Email Templates Examples
 * 
 * This file demonstrates how to use each email template with realistic data.
 * Use these examples as a reference for integrating the templates into your application.
 */

import React from 'react';
import {
  WelcomeEmail,
  welcomeEmailSubject,
  welcomeEmailPreview,
  PasswordResetEmail,
  passwordResetSubject,
  passwordResetPreview,
  NewOrderEmail,
  newOrderSubject,
  newOrderPreview,
  DeliveryConfirmationEmail,
  deliveryConfirmationSubject,
  deliveryConfirmationPreview,
} from './index';

// ============================================
// 1. WELCOME EMAIL - Client Example
// ============================================
export const WelcomeClientExample = () => {
  const subject = welcomeEmailSubject('Marie Kouassi');
  const preview = welcomeEmailPreview('Restaurant Le Soleil');
  
  console.log('Subject:', subject);
  console.log('Preview:', preview);

  return (
    <WelcomeEmail
      userName="Marie"
      userEmail="marie@restaurant-soleil.com"
      role="client"
      businessName="Restaurant Le Soleil"
      dashboardUrl="https://ravito.ci/dashboard"
    />
  );
};

// ============================================
// 2. WELCOME EMAIL - Supplier Example
// ============================================
export const WelcomeSupplierExample = () => {
  const subject = welcomeEmailSubject('Amadou Traoré');
  const preview = welcomeEmailPreview('Fournisseur ABC Distribution');
  
  console.log('Subject:', subject);
  console.log('Preview:', preview);

  return (
    <WelcomeEmail
      userName="Amadou"
      userEmail="amadou@abc-distribution.com"
      role="supplier"
      businessName="ABC Distribution"
      dashboardUrl="https://ravito.ci/supplier/dashboard"
    />
  );
};

// ============================================
// 3. PASSWORD RESET EMAIL Example
// ============================================
export const PasswordResetExample = () => {
  const subject = passwordResetSubject();
  const preview = passwordResetPreview();
  
  console.log('Subject:', subject);
  console.log('Preview:', preview);

  return (
    <PasswordResetEmail
      userName="Marie"
      userEmail="marie@restaurant-soleil.com"
      resetUrl="https://ravito.ci/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
      expirationMinutes={30}
    />
  );
};

// ============================================
// 4. NEW ORDER EMAIL Example
// ============================================
export const NewOrderExample = () => {
  const orderId = 'ORD-2024-12-001';
  const zone = 'Cocody';
  const clientName = 'Restaurant Le Soleil';
  const totalAmount = 125000;
  
  const subject = newOrderSubject(orderId, zone);
  const preview = newOrderPreview(clientName, totalAmount);
  
  console.log('Subject:', subject);
  console.log('Preview:', preview);

  return (
    <NewOrderEmail
      supplierName="Amadou Traoré"
      supplierEmail="amadou@abc-distribution.com"
      orderId={orderId}
      clientName={clientName}
      clientAddress="Rue 12, Boulevard Latrille, Cocody"
      clientZone={zone}
      items={[
        { name: 'Riz parfumé thaï (sac 50kg)', quantity: 2, unit: 'sacs' },
        { name: 'Huile végétale Dinor (bidon 25L)', quantity: 4, unit: 'bidons' },
        { name: 'Tomates fraîches', quantity: 25, unit: 'kg' },
        { name: 'Oignons blancs', quantity: 15, unit: 'kg' },
        { name: 'Poivrons verts', quantity: 10, unit: 'kg' },
        { name: 'Ail', quantity: 5, unit: 'kg' },
      ]}
      totalAmount={totalAmount}
      dashboardUrl={`https://ravito.ci/supplier/orders/${orderId}`}
    />
  );
};

// ============================================
// 5. DELIVERY CONFIRMATION EMAIL Example
// ============================================
export const DeliveryConfirmationExample = () => {
  const orderId = 'ORD-2024-12-001';
  const supplierName = 'ABC Distribution';
  const totalAmount = 125000;
  
  const subject = deliveryConfirmationSubject(orderId);
  const preview = deliveryConfirmationPreview(supplierName);
  
  console.log('Subject:', subject);
  console.log('Preview:', preview);

  return (
    <DeliveryConfirmationEmail
      clientName="Marie"
      clientEmail="marie@restaurant-soleil.com"
      orderId={orderId}
      supplierName={supplierName}
      deliveryTime="Aujourd'hui à 14h30"
      totalAmount={totalAmount}
      ratingUrl={`https://ravito.ci/orders/${orderId}/rate`}
    />
  );
};

// ============================================
// 6. FULL WORKFLOW Example
// ============================================
export const EmailWorkflowExample = () => {
  /**
   * This demonstrates a complete workflow from registration to delivery
   * 
   * SCENARIO:
   * 1. Marie registers as a client - receives welcome email
   * 2. Marie forgets password - receives reset email
   * 3. Marie places an order - Amadou (supplier) receives notification
   * 4. Amadou delivers - Marie receives confirmation
   */

  const workflow = {
    // Step 1: Registration
    registration: {
      client: WelcomeClientExample(),
      supplier: WelcomeSupplierExample(),
    },
    
    // Step 2: Password Reset
    passwordReset: PasswordResetExample(),
    
    // Step 3: New Order
    newOrder: NewOrderExample(),
    
    // Step 4: Delivery Confirmation
    deliveryConfirmation: DeliveryConfirmationExample(),
  };

  return workflow;
};

// ============================================
// 7. USAGE IN BACKEND SERVICE
// ============================================
export const emailServiceExample = `
// Example: Sending emails with a service

import { renderToString } from 'react-dom/server';
import { WelcomeEmail, welcomeEmailSubject, welcomeEmailPreview } from '@/emails';

class EmailService {
  async sendWelcomeEmail(user: User) {
    const subject = welcomeEmailSubject(user.name);
    const preview = welcomeEmailPreview(user.businessName);
    
    const html = renderToString(
      <WelcomeEmail
        userName={user.firstName}
        userEmail={user.email}
        role={user.role}
        businessName={user.businessName}
        dashboardUrl={\`\${process.env.APP_URL}/dashboard\`}
      />
    );

    // Send via your email provider (Resend, SendGrid, etc.)
    await this.emailProvider.send({
      to: user.email,
      subject,
      html,
      previewText: preview,
    });
  }
  
  async sendNewOrderNotification(order: Order, supplier: Supplier) {
    const subject = newOrderSubject(order.id, order.clientZone);
    const preview = newOrderPreview(order.clientName, order.totalAmount);
    
    const html = renderToString(
      <NewOrderEmail
        supplierName={supplier.name}
        supplierEmail={supplier.email}
        orderId={order.id}
        clientName={order.clientName}
        clientAddress={order.deliveryAddress}
        clientZone={order.clientZone}
        items={order.items}
        totalAmount={order.totalAmount}
        dashboardUrl={\`\${process.env.APP_URL}/supplier/orders/\${order.id}\`}
      />
    );

    await this.emailProvider.send({
      to: supplier.email,
      subject,
      html,
      previewText: preview,
    });
  }
}
`;

// ============================================
// 8. TEST DATA
// ============================================
export const testData = {
  client: {
    firstName: 'Marie',
    lastName: 'Kouassi',
    email: 'marie@restaurant-soleil.com',
    businessName: 'Restaurant Le Soleil',
    role: 'client' as const,
  },
  
  supplier: {
    firstName: 'Amadou',
    lastName: 'Traoré',
    email: 'amadou@abc-distribution.com',
    businessName: 'ABC Distribution',
    role: 'supplier' as const,
  },
  
  order: {
    id: 'ORD-2024-12-001',
    clientName: 'Restaurant Le Soleil',
    clientAddress: 'Rue 12, Boulevard Latrille, Cocody',
    clientZone: 'Cocody',
    items: [
      { name: 'Riz parfumé thaï (sac 50kg)', quantity: 2, unit: 'sacs' },
      { name: 'Huile végétale Dinor (bidon 25L)', quantity: 4, unit: 'bidons' },
      { name: 'Tomates fraîches', quantity: 25, unit: 'kg' },
    ],
    totalAmount: 125000,
    deliveryTime: "Aujourd'hui à 14h30",
  },
};

export default {
  WelcomeClientExample,
  WelcomeSupplierExample,
  PasswordResetExample,
  NewOrderExample,
  DeliveryConfirmationExample,
  EmailWorkflowExample,
  testData,
};
