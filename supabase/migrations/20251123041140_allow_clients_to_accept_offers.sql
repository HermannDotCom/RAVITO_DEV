/*
  # Allow Clients to Accept Offers
  
  1. Changes
    - Add RLS policy for clients to update orders from 'offers-received' to 'awaiting-payment'
    - This allows clients to accept supplier offers
    - Clients can update the order to assign a supplier and update amounts
  
  2. Security
    - Only the order owner (client) can accept offers
    - Client must be approved
    - Can only update from 'offers-received' status
    - Can only update to 'awaiting-payment' status
*/

CREATE POLICY "Clients can accept offers for their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'offers-received'
    AND is_approved(auth.uid())
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'awaiting-payment'
    AND is_approved(auth.uid())
  );
