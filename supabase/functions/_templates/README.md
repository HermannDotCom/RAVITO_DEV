# Email Templates

This directory contains HTML email templates for the RAVITO notification system.

## Available Templates

### 1. new-order.html
**Purpose:** Notification to suppliers when a new order is available in their zone.

**Variables:**
- `{{supplierName}}` - Name of the supplier
- `{{orderNumber}}` - Order reference number
- `{{clientName}}` - Name of the client
- `{{zoneName}}` - Zone/commune name
- `{{totalAmount}}` - Estimated order amount in FCFA
- `{{dashboardUrl}}` - URL to view the order in the dashboard

### 2. order-accepted.html
**Purpose:** Notification to clients when their order has been accepted by a supplier.

**Variables:**
- `{{clientName}}` - Name of the client
- `{{orderNumber}}` - Order reference number
- `{{supplierName}}` - Name of the supplier who accepted
- `{{totalAmount}}` - Total order amount in FCFA
- `{{trackingUrl}}` - URL to track the order

### 3. delivery-completed.html
**Purpose:** Notification to clients when their delivery is completed.

**Variables:**
- `{{clientName}}` - Name of the client
- `{{orderNumber}}` - Order reference number
- `{{supplierName}}` - Name of the supplier
- `{{deliveryTime}}` - Time of delivery
- `{{totalAmount}}` - Total order amount in FCFA
- `{{ratingUrl}}` - URL to rate the delivery

## Future Templates (To be created)

### delivery-assigned.html
Notification to delivery person when a delivery is assigned to them.

### delivery-started.html
Notification to client when delivery has started.

### payment-received.html
Notification to supplier when payment is received.

## Usage

These templates are used by the `send-email` Edge Function. They can be loaded and populated with data dynamically.

Example usage in Edge Function:
```typescript
const template = await Deno.readTextFile('./templates/new-order.html');
const html = template
  .replace('{{supplierName}}', supplierName)
  .replace('{{orderNumber}}', orderNumber)
  // ... replace other variables
```

## Design Guidelines

- **Mobile-first**: All templates are responsive and mobile-optimized
- **Brand colors**: Use RAVITO orange (#f97316) and green (#10b981) for accents
- **Clear CTAs**: Include prominent call-to-action buttons
- **Accessibility**: Use semantic HTML and good color contrast
- **Professional**: Maintain consistent branding with the RAVITO application

## Testing

Test templates by sending test emails through the `send-email` Edge Function with sample data.
