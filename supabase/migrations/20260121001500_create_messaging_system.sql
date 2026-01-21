-- Create order_conversations table
CREATE TABLE IF NOT EXISTS order_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL UNIQUE,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  supplier_id UUID REFERENCES profiles(id) NOT NULL,
  driver_id UUID REFERENCES profiles(id), -- NULL if pickup
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Create order_messages table
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES order_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'supplier', 'driver')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'quick', 'system')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conv_order ON order_conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conv_client ON order_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conv_supplier ON order_conversations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conv_driver ON order_conversations(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_conv ON order_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_unread ON order_messages(conversation_id, sender_id) WHERE NOT is_read;

-- Enable Row Level Security
ALTER TABLE order_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_conversations
CREATE POLICY "Participants can view conversation" ON order_conversations
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = supplier_id OR 
    auth.uid() = driver_id
  );

CREATE POLICY "Participants can insert conversation" ON order_conversations
  FOR INSERT WITH CHECK (
    auth.uid() = client_id OR auth.uid() = supplier_id
  );

CREATE POLICY "Participants can update conversation" ON order_conversations
  FOR UPDATE USING (
    auth.uid() = client_id OR 
    auth.uid() = supplier_id OR 
    auth.uid() = driver_id
  );

-- RLS Policies for order_messages
CREATE POLICY "Participants can view messages" ON order_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_conversations c 
      WHERE c.id = conversation_id 
      AND (auth.uid() = c.client_id OR auth.uid() = c.supplier_id OR auth.uid() = c.driver_id)
    )
  );

CREATE POLICY "Participants can send messages" ON order_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM order_conversations c 
      WHERE c.id = conversation_id 
      AND (auth.uid() = c.client_id OR auth.uid() = c.supplier_id OR auth.uid() = c.driver_id)
    )
  );

CREATE POLICY "Participants can update messages" ON order_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM order_conversations c 
      WHERE c.id = conversation_id 
      AND (auth.uid() = c.client_id OR auth.uid() = c.supplier_id OR auth.uid() = c.driver_id)
    )
  );

-- Function to create conversation when order is paid
CREATE OR REPLACE FUNCTION create_order_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create conversation when status = paid (and wasn't paid before)
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO order_conversations (order_id, client_id, supplier_id)
    VALUES (NEW.id, NEW.client_id, NEW.supplier_id)
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS on_order_paid ON orders;
CREATE TRIGGER on_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_conversation();

-- Function to assign driver to conversation
CREATE OR REPLACE FUNCTION assign_driver_to_conversation(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE order_conversations
  SET driver_id = p_driver_id
  WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;

-- Add comment for documentation
COMMENT ON TABLE order_conversations IS 'Stores conversations between clients, suppliers, and drivers for specific orders';
COMMENT ON TABLE order_messages IS 'Stores individual messages within order conversations';
COMMENT ON FUNCTION create_order_conversation() IS 'Automatically creates a conversation when an order status changes to paid';
COMMENT ON FUNCTION assign_driver_to_conversation(UUID, UUID) IS 'Assigns a driver to an existing order conversation';
