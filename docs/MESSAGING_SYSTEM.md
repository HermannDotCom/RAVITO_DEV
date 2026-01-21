# In-App Messaging System

## Overview

This messaging system enables contextual communication between clients, suppliers, and drivers during the order lifecycle, similar to Uber/Uber Eats.

## Business Rules

### Activation Rules

| User Role | Activation Status | Can Communicate With |
|-----------|------------------|----------------------|
| **Client** | `paid` (and onwards) | Supplier |
| **Supplier** | `paid` (and onwards) | Client |
| **Driver** | `delivering` | Client |

### Order Lifecycle

```
SCENARIO 1: Standard Delivery
pending → accepted → PAID → preparing → DELIVERING → delivered
                      │                    │
                      ▼                    ▼
            Channel: Client ↔ Supplier   Channel: Client ↔ Driver

SCENARIO 2: Customer Pickup
pending → accepted → PAID → preparing → ready → picked_up
                      │
                      ▼
            Channel: Client ↔ Supplier
```

## Technical Architecture

### Database Schema

#### Tables

1. **order_conversations**
   - Stores conversation metadata linked to orders
   - One conversation per order
   - Tracks participants (client, supplier, optional driver)
   - Manages conversation active/closed state

2. **order_messages**
   - Stores individual messages
   - Links to conversation
   - Tracks sender, content, read status
   - Supports different message types (text, quick, system)

#### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access conversations they're part of
- Messages are visible only to conversation participants
- Trigger auto-creates conversations when order status = 'paid'

### Frontend Components

#### Core Components

- **ChatWindow**: Main modal interface for messaging
- **MessageBubble**: Individual message display (WhatsApp-style)
- **MessageList**: Scrollable message container
- **MessageInput**: Text input with send button
- **QuickMessages**: Role-based quick reply buttons
- **MessageButton**: Badge button for chat access
- **SystemMessage**: System notifications

#### Integration Points

1. **Client Views**
   - `ActiveOrderCard`: Quick access to chat
   - `OrderDetailsModal`: Full messaging interface

2. **Driver Views**
   - `DeliveryCard`: Messaging during active deliveries

3. **Supplier Views**
   - To be integrated

### Real-time Features

- Uses Supabase Realtime for instant message delivery
- Live message updates without page refresh
- Notification sounds for new messages
- Read receipts with visual indicators (✓✓)
- Unread message badges

### Quick Messages by Role

#### Client
- "OK"
- "Merci"
- "Je suis en route"
- "J'arrive dans 10 min"
- "J'arrive dans 30 min"
- "Où êtes-vous ?"
- "Appelez-moi"

#### Supplier
- "Commande prête ✅"
- "En préparation"
- "Livreur en route"
- "Pouvez-vous passer chercher ?"
- "Rappel: commande prête"

#### Driver
- "En route 🚚"
- "J'arrive dans 5 min"
- "J'arrive dans 10 min"
- "Je suis arrivé 📍"
- "Où êtes-vous exactement ?"
- "Pouvez-vous sortir svp ?"
- "Je vous attends dehors"

## File Structure

```
src/
├── components/
│   └── Messaging/
│       ├── ChatWindow.tsx           # Main modal interface
│       ├── MessageBubble.tsx        # Individual message
│       ├── MessageButton.tsx        # Chat access button
│       ├── MessageInput.tsx         # Input field
│       ├── MessageList.tsx          # Message container
│       ├── QuickMessages.tsx        # Quick replies
│       ├── SystemMessage.tsx        # System notifications
│       └── index.ts                 # Exports
├── hooks/
│   └── useOrderMessages.ts          # Messaging hook
├── services/
│   └── messagingService.ts          # Database operations
├── types/
│   └── messaging.ts                 # TypeScript types
└── constants/
    └── messaging.ts                 # Shared constants

supabase/
└── migrations/
    └── 20260121001500_create_messaging_system.sql
```

## Usage

### For Clients

```typescript
import { ChatWindow } from '../components/Messaging';
import { isMessagingEnabled } from '../constants/messaging';

// Check if messaging is available
if (isMessagingEnabled(order.status)) {
  // Show chat button
  <ChatWindow
    orderId={order.id}
    order={order}
    isOpen={isChatOpen}
    onClose={() => setIsChatOpen(false)}
    currentUserRole="client"
    orderNumber={order.orderNumber}
  />
}
```

### For Drivers

```typescript
import { ChatWindow } from '../../components/Messaging';

// Available during 'delivering' status
<ChatWindow
  orderId={delivery.orderId}
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  currentUserRole="driver"
  orderNumber={delivery.orderNumber}
/>
```

## API Reference

### Messaging Service

```typescript
// Get conversation for an order
getOrderConversation(orderId: string): Promise<OrderConversation | null>

// Get messages for a conversation
getConversationMessages(conversationId: string, limit?: number): Promise<OrderMessage[]>

// Send a message
sendMessage(
  conversationId: string,
  senderId: string,
  senderRole: MessageSenderRole,
  content: string,
  messageType?: MessageType
): Promise<OrderMessage>

// Mark messages as read
markMessagesAsRead(conversationId: string, currentUserId: string): Promise<void>

// Get unread count
getUnreadCount(conversationId: string, currentUserId: string): Promise<number>

// Assign driver to conversation
assignDriverToConversation(orderId: string, driverId: string): Promise<void>
```

### useOrderMessages Hook

```typescript
const {
  conversation,      // Conversation data
  messages,          // Array of messages
  isLoading,         // Loading state
  error,             // Error message
  unreadCount,       // Number of unread messages
  sendMessage,       // Function to send a message
  markAsRead,        // Function to mark messages as read
  refresh            // Function to refresh data
} = useOrderMessages(orderId, senderRole);
```

## Testing Checklist

- [ ] Conversation auto-creates when order status changes to 'paid'
- [ ] Messages appear in real-time without refresh
- [ ] Read receipts update correctly
- [ ] Quick messages send properly
- [ ] Unread badges display correct count
- [ ] Driver can only message during delivery
- [ ] Client can message supplier from 'paid' onwards
- [ ] RLS policies prevent unauthorized access
- [ ] Mobile responsive layout works
- [ ] Notification sounds play (when allowed)

## Security Considerations

1. **Row Level Security**: All database tables have RLS enabled
2. **Participant Validation**: Only conversation participants can send/view messages
3. **No SQL Injection**: Uses Supabase parameterized queries
4. **No XSS**: All content is sanitized by React
5. **Rate Limiting**: Consider adding rate limiting for message sending

## Performance Optimizations

1. **Efficient Duplicate Detection**: Uses Set for O(1) lookups
2. **Pagination Support**: Message limit parameter for large conversations
3. **Indexed Queries**: Database indexes on frequently queried columns
4. **Real-time Subscriptions**: Only subscribe when chat is open
5. **Lazy Loading**: Components load only when needed

## Future Enhancements

- [ ] Image/file attachments
- [ ] Voice messages
- [ ] Message delivery status (sent, delivered, read)
- [ ] Typing indicators
- [ ] Push notifications
- [ ] Message search
- [ ] Conversation archiving
- [ ] Export conversation history
- [ ] Multi-language support
- [ ] Message reactions (emoji)

## Support

For issues or questions, please contact the development team or create an issue in the repository.
