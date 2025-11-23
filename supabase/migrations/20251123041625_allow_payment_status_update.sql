/*
  # Allow Payment Status Updates
  
  1. Changes
    - Add RLS policy for clients to update order status from 'awaiting-payment' to 'paid'
    - This allows the payment webhook simulation to work
    - Clients can only update their own orders
  
  2. Security
    - Only the order owner (client) can update payment status
    - Client must be approved
    - Can only update from 'awaiting-payment' status
    - Can only update to 'paid' status
    - This is a temporary solution until payment webhooks are moved to edge functions
  
  3. Notes
    - In production, payment webhooks should be handled by edge functions with SECURITY DEFINER
    - This policy allows the frontend webhook simulator to work for development
*/

CREATE POLICY "Clients can update payment status for their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'awaiting-payment'
    AND is_approved(auth.uid())
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'paid'
    AND is_approved(auth.uid())
  );
