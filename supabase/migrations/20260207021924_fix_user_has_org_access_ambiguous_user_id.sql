/*
  # Fix user_has_org_access function - ambiguous user_id reference (42702)

  ## Problem
  The function `user_has_org_access(user_id uuid, org_id uuid)` has a parameter
  named `user_id` which conflicts with the column `organization_members.user_id`
  inside the function body, causing PostgreSQL error 42702:
  "column reference user_id is ambiguous - It could refer to either a
  PL/pgSQL variable or a table column."

  This breaks all RLS policies that call this function, including the policy
  on `subscription_invoices` that prevents invoices from loading in the admin UI.

  ## Fix
  - Qualify ALL parameter references with function name: `user_has_org_access.user_id`
  - Qualify ALL column references with table aliases: `o.owner_id`, `om.user_id`
  - This eliminates all ambiguity without changing parameter names or dropping the function

  ## Affected tables (via RLS policies calling this function)
  - subscription_invoices, subscription_payments, orders, order_items,
    profiles, notifications, supplier_offers, supplier_price_grids,
    supplier_zones, support_tickets, transfers, and more
*/

CREATE OR REPLACE FUNCTION public.user_has_org_access(user_id uuid, org_id uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = user_has_org_access.org_id
      AND o.owner_id = user_has_org_access.user_id
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = user_has_org_access.org_id
      AND om.user_id = user_has_org_access.user_id
      AND om.status = 'active'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
