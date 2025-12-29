Sauvegarde du Schéma de Base de Données Supabase - Version v1.5.6
Projet : RAVITO_DEV Date : 27 Décembre 2025



1. Tables du Schéma public
Veuillez exécuter la requête suivante et coller le résultat ci-dessous :

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

Résultat : 

table_name
zones
user_activity_log
profiles
orders
ratings
supplier_zones
payment_methods
ticket_messages
commission_settings
ticket_attachments
pricing_categories
order_items
notifications
support_tickets
zone_registration_requests
products
reference_prices
price_analytics
orders_with_coords
supplier_price_grid_history
organization_members
supplier_offers
organizations
transfers
transfer_orders
role_permissions
order_pricing_snapshot
night_guard_schedule
available_modules
supplier_price_grids
user_module_permissions
notification_preferences
push_subscriptions
2. Politiques Row Level Security (RLS)
Veuillez exécuter la requête suivante et coller le résultat ci-dessous :

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

Résultat : 

schemaname	tablename	policyname	permissive	roles	cmd	qual	with_check
public	available_modules	available_modules_select_all	PERMISSIVE	{authenticated}	SELECT	true	null
public	commission_settings	Super admin can delete commission settings	PERMISSIVE	{authenticated}	DELETE	is_admin()	null
public	commission_settings	Super admin can insert commission settings	PERMISSIVE	{authenticated}	INSERT	null	is_admin()
public	commission_settings	Super admin can update commission settings	PERMISSIVE	{authenticated}	UPDATE	is_admin()	is_admin()
public	commission_settings	Super admin can view commission settings	PERMISSIVE	{authenticated}	SELECT	is_admin()	null
public	night_guard_schedule	Allow authenticated suppliers to manage their schedule	PERMISSIVE	{authenticated}	ALL	(supplier_id = auth.uid())	(supplier_id = auth.uid())
public	night_guard_schedule	Allow public read access for active schedules	PERMISSIVE	{anon}	SELECT	((is_active = true) AND (date = CURRENT_DATE))	null
public	notification_preferences	Users can insert own notification preferences	PERMISSIVE	{public}	INSERT	null	(auth.uid() = user_id)
public	notification_preferences	Users can update own notification preferences	PERMISSIVE	{public}	UPDATE	(auth.uid() = user_id)	null
public	notification_preferences	Users can view own notification preferences	PERMISSIVE	{public}	SELECT	(auth.uid() = user_id)	null
public	notifications	Admins can view all notifications	PERMISSIVE	{authenticated}	SELECT	is_admin()	null
public	notifications	Authenticated users can insert notifications	PERMISSIVE	{authenticated}	INSERT	null	true
public	notifications	Service role can insert notifications	PERMISSIVE	{service_role}	INSERT	null	true
public	notifications	Users can delete own notifications	PERMISSIVE	{authenticated}	DELETE	(user_id = ( SELECT auth.uid() AS uid))	null
public	notifications	Users can read own notifications	PERMISSIVE	{authenticated}	SELECT	(user_id = ( SELECT auth.uid() AS uid))	null
public	notifications	Users can update own notifications	PERMISSIVE	{authenticated}	UPDATE	(user_id = ( SELECT auth.uid() AS uid))	(user_id = ( SELECT auth.uid() AS uid))
public	order_items	order_items_insert_client	PERMISSIVE	{authenticated}	INSERT	null	(EXISTS ( SELECT 1
FROM orders							
WHERE ((orders.id = order_items.order_id) AND (orders.client_id = auth.uid()))))							
public	order_items	order_items_select_admin	PERMISSIVE	{authenticated}	SELECT	is_admin()	null
public	order_items	order_items_select_client	PERMISSIVE	{authenticated}	SELECT	(EXISTS ( SELECT 1	
FROM orders							
WHERE ((orders.id = order_items.order_id) AND (orders.client_id = auth.uid()))))	null						
public	order_items	order_items_select_supplier	PERMISSIVE	{authenticated}	SELECT	((EXISTS ( SELECT 1	
FROM orders							
WHERE ((orders.id = order_items.order_id) AND (orders.supplier_id = auth.uid())))) OR (EXISTS ( SELECT 1							
FROM (orders o							
 JOIN supplier_offers so ON ((so.order_id = o.id)))

WHERE ((o.id = order_items.order_id) AND (so.supplier_id = auth.uid()))))) | null | | public | order_items | order_items_select_supplier_zone | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM (orders o JOIN supplier_zones sz ON ((sz.zone_id = o.zone_id))) WHERE ((o.id = order_items.order_id) AND (o.status = ANY (ARRAY['pending-offers'::order_status, 'offers-received'::order_status])) AND (o.zone_id IS NOT NULL) AND (sz.supplier_id = auth.uid()) AND (sz.approval_status = 'approved'::text) AND (sz.is_active = true)))) | null | | public | order_pricing_snapshot | Admin full access to order_pricing_snapshot | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | order_pricing_snapshot | System insert order_pricing_snapshot | PERMISSIVE | {authenticated} | INSERT | null | (auth.uid() IS NOT NULL) | | public | order_pricing_snapshot | User read own order_pricing_snapshot | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM orders WHERE ((orders.id = order_pricing_snapshot.order_id) AND ((orders.client_id = auth.uid()) OR (orders.supplier_id = auth.uid()))))) | null | | public | orders | orders_insert_client | PERMISSIVE | {authenticated} | INSERT | null | (client_id = auth.uid()) | | public | orders | orders_select_admin | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | orders | orders_select_client | PERMISSIVE | {authenticated} | SELECT | (client_id = auth.uid()) | null | | public | orders | orders_select_supplier | PERMISSIVE | {authenticated} | SELECT | (supplier_id = auth.uid()) | null | | public | orders | orders_select_supplier_zone | PERMISSIVE | {authenticated} | SELECT | ((status = ANY (ARRAY['pending-offers'::order_status, 'offers-received'::order_status])) AND (zone_id IS NOT NULL) AND (EXISTS ( SELECT 1 FROM supplier_zones sz WHERE ((sz.supplier_id = auth.uid()) AND (sz.zone_id = orders.zone_id) AND (sz.approval_status = 'approved'::text) AND (sz.is_active = true))))) | null | | public | orders | orders_update_admin | PERMISSIVE | {authenticated} | UPDATE | is_admin() | is_admin() | | public | orders | orders_update_client | PERMISSIVE | {authenticated} | UPDATE | (client_id = auth.uid()) | (client_id = auth.uid()) | | public | orders | orders_update_supplier | PERMISSIVE | {authenticated} | UPDATE | (supplier_id = auth.uid()) | (supplier_id = auth.uid()) | | public | organization_members | org_members_admin_all | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | organization_members | org_members_delete_owner | PERMISSIVE | {authenticated} | DELETE | (organization_id IN ( SELECT organizations.id FROM organizations WHERE (organizations.owner_id = auth.uid()))) | null | | public | organization_members | org_members_insert_allowed | PERMISSIVE | {authenticated} | INSERT | null | ((user_id = auth.uid()) OR (organization_id IN ( SELECT organizations.id FROM organizations WHERE (organizations.owner_id = auth.uid())))) | | public | organization_members | org_members_select_simple | PERMISSIVE | {authenticated} | SELECT | true | null | | public | organization_members | org_members_update_allowed | PERMISSIVE | {authenticated} | UPDATE | ((user_id = auth.uid()) OR (organization_id IN ( SELECT organizations.id FROM organizations WHERE (organizations.owner_id = auth.uid())))) | null | | public | organizations | organizations_admin_all | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | organizations | organizations_delete_owner | PERMISSIVE | {authenticated} | DELETE | (owner_id = auth.uid()) | null | | public | organizations | organizations_insert_owner | PERMISSIVE | {authenticated} | INSERT | null | (owner_id = auth.uid()) | | public | organizations | organizations_select_simple | PERMISSIVE | {authenticated} | SELECT | true | null | | public | organizations | organizations_update_owner | PERMISSIVE | {authenticated} | UPDATE | (owner_id = auth.uid()) | (owner_id = auth.uid()) | | public | payment_methods | Users can add own payment methods | PERMISSIVE | {authenticated} | INSERT | null | (profile_id = ( SELECT auth.uid() AS uid)) | | public | payment_methods | Users can delete own payment methods | PERMISSIVE | {authenticated} | DELETE | (profile_id = auth.uid()) | null | | public | payment_methods | Users can update own payment methods | PERMISSIVE | {authenticated} | UPDATE | (profile_id = auth.uid()) | (profile_id = auth.uid()) | | public | payment_methods | Users can view own payment methods | PERMISSIVE | {authenticated} | SELECT | ((profile_id = auth.uid()) OR is_admin()) | null | | public | price_analytics | Admin full access to price_analytics | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | price_analytics | Supplier read current price_analytics | PERMISSIVE | {authenticated} | SELECT | ((is_current = true) AND (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'supplier'::user_role))))) | null | | public | pricing_categories | Admin full access to pricing_categories | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | pricing_categories | Read active pricing_categories | PERMISSIVE | {authenticated} | SELECT | (is_active = true) | null | | public | products | products_delete_admin | PERMISSIVE | {authenticated} | DELETE | is_admin() | null | | public | products | products_insert_admin | PERMISSIVE | {authenticated} | INSERT | null | is_admin() | | public | products | products_select_all_authenticated | PERMISSIVE | {authenticated} | SELECT | true | null | | public | products | products_update_admin | PERMISSIVE | {authenticated} | UPDATE | is_admin() | is_admin() | | public | profiles | profiles_insert_own | PERMISSIVE | {authenticated} | INSERT | null | (id = auth.uid()) | | public | profiles | profiles_select_admin | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | profiles | profiles_select_for_orders | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM orders WHERE (((orders.client_id = profiles.id) OR (orders.supplier_id = profiles.id)) AND ((orders.client_id = auth.uid()) OR (orders.supplier_id = auth.uid()))))) | null | | public | profiles | profiles_select_own | PERMISSIVE | {authenticated} | SELECT | (id = auth.uid()) | null | | public | profiles | profiles_update_admin | PERMISSIVE | {authenticated} | UPDATE | is_admin() | is_admin() | | public | profiles | profiles_update_own | PERMISSIVE | {authenticated} | UPDATE | (id = auth.uid()) | (id = auth.uid()) | | public | push_subscriptions | Users can delete own push subscriptions | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id) | null | | public | push_subscriptions | Users can insert own push subscriptions | PERMISSIVE | {public} | INSERT | null | (auth.uid() = user_id) | | public | push_subscriptions | Users can view own push subscriptions | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null | | public | ratings | ratings_insert_own | PERMISSIVE | {authenticated} | INSERT | null | (from_user_id = auth.uid()) | | public | ratings | ratings_select_admin | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | ratings | ratings_select_own | PERMISSIVE | {authenticated} | SELECT | ((from_user_id = auth.uid()) OR (to_user_id = auth.uid())) | null | | public | ratings | ratings_update_own | PERMISSIVE | {authenticated} | UPDATE | (from_user_id = auth.uid()) | (from_user_id = auth.uid()) | | public | reference_prices | Admin full access to reference_prices | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | reference_prices | Read active reference_prices | PERMISSIVE | {authenticated} | SELECT | (is_active = true) | null | | public | role_permissions | role_permissions_read | PERMISSIVE | {authenticated} | SELECT | true | null | | public | supplier_offers | supplier_offers_delete | PERMISSIVE | {authenticated} | DELETE | ((supplier_id = auth.uid()) AND (status <> 'accepted'::offer_status)) | null | | public | supplier_offers | supplier_offers_insert | PERMISSIVE | {authenticated} | INSERT | null | ((supplier_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM (orders o JOIN supplier_zones sz ON ((sz.zone_id = o.zone_id))) WHERE ((o.id = supplier_offers.order_id) AND (sz.supplier_id = auth.uid()) AND (sz.is_active = true))))) | | public | supplier_offers | supplier_offers_select_admin | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | supplier_offers | supplier_offers_select_client | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM orders WHERE ((orders.id = supplier_offers.order_id) AND (orders.client_id = auth.uid())))) | null | | public | supplier_offers | supplier_offers_select_supplier | PERMISSIVE | {authenticated} | SELECT | (supplier_id = auth.uid()) | null | | public | supplier_offers | supplier_offers_update_client | PERMISSIVE | {authenticated} | UPDATE | (EXISTS ( SELECT 1 FROM orders WHERE ((orders.id = supplier_offers.order_id) AND (orders.client_id = auth.uid())))) | null | | public | supplier_offers | supplier_offers_update_supplier | PERMISSIVE | {authenticated} | UPDATE | (supplier_id = auth.uid()) | (supplier_id = auth.uid()) | | public | supplier_price_grid_history | Admin read all price_grid_history | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | supplier_price_grid_history | Supplier read own price_grid_history | PERMISSIVE | {authenticated} | SELECT | ((supplier_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'supplier'::user_role))))) | null | | public | supplier_price_grids | Admin full access to supplier_price_grids | PERMISSIVE | {authenticated} | ALL | is_admin() | null | | public | supplier_price_grids | Client read active supplier_price_grids | PERMISSIVE | {authenticated} | SELECT | ((is_active = true) AND (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'client'::user_role))))) | null | | public | supplier_price_grids | Supplier full access to own price_grids | PERMISSIVE | {authenticated} | ALL | ((supplier_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'supplier'::user_role))))) | null | | public | supplier_zones | supplier_zones_delete_own | PERMISSIVE | {authenticated} | DELETE | (supplier_id = auth.uid()) | null | | public | supplier_zones | supplier_zones_insert_own | PERMISSIVE | {authenticated} | INSERT | null | (supplier_id = auth.uid()) | | public | supplier_zones | supplier_zones_select_admin | PERMISSIVE | {authenticated} | SELECT | is_admin() | null | | public | supplier_zones | supplier_zones_select_all | PERMISSIVE | {authenticated} | SELECT | true | null | | public | supplier_zones | supplier_zones_select_own | PERMISSIVE | {authenticated} | SELECT | (supplier_id = auth.uid()) | null | | public | supplier_zones | supplier_zones_update_own | PERMISSIVE | {authenticated} | UPDATE | (supplier_id = auth.uid()) | (supplier_id = auth.uid()) | | public | support_tickets | Admins can delete tickets | PERMISSIVE | {authenticated} | DELETE | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | null | | public | support_tickets | Admins can update all tickets | PERMISSIVE | {authenticated} | UPDATE | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | | public | support_tickets | Admins can view all tickets | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | null | | public | support_tickets | Users can create tickets | PERMISSIVE | {authenticated} | INSERT | null | (user_id = auth.uid()) | | public | support_tickets | Users can update own tickets | PERMISSIVE | {authenticated} | UPDATE | (user_id = auth.uid()) | (user_id = auth.uid()) | | public | support_tickets | Users can view own tickets | PERMISSIVE | {authenticated} | SELECT | (user_id = auth.uid()) | null | | public | ticket_attachments | Admins can add attachments to all tickets | PERMISSIVE | {authenticated} | INSERT | null | ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) AND (uploaded_by = auth.uid())) | | public | ticket_attachments | Admins can view all ticket attachments | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | null | | public | ticket_attachments | Users can add attachments to own tickets | PERMISSIVE | {authenticated} | INSERT | null | ((EXISTS ( SELECT 1 FROM support_tickets WHERE ((support_tickets.id = ticket_attachments.ticket_id) AND (support_tickets.user_id = auth.uid())))) AND (uploaded_by = auth.uid())) | | public | ticket_attachments | Users can view own ticket attachments | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM support_tickets WHERE ((support_tickets.id = ticket_attachments.ticket_id) AND (support_tickets.user_id = auth.uid())))) | null | | public | ticket_messages | Admins can add messages to all tickets | PERMISSIVE | {authenticated} | INSERT | null | ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) AND (user_id = auth.uid())) | | public | ticket_messages | Admins can view all ticket messages | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))) | null |



3. Triggers
Veuillez exécuter la requête suivante et coller le résultat ci-dessous :

SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

Résultat : 

trigger_name	event_manipulation	event_object_table	action_statement
trigger_notify_suppliers_new_order	INSERT	orders	EXECUTE FUNCTION create_notification_on_new_order()
trigger_notify_order_status_change	UPDATE	orders	EXECUTE FUNCTION create_notification_on_order_status_change()
trigger_log_order_activity	INSERT	orders	EXECUTE FUNCTION log_order_activity()
trigger_log_order_activity	UPDATE	orders	EXECUTE FUNCTION log_order_activity()
trigger_set_delivery_code	UPDATE	orders	EXECUTE FUNCTION set_delivery_confirmation_code()
trigger_validate_delivery	UPDATE	orders	EXECUTE FUNCTION validate_delivery_before_delivered()
trigger_update_sold_quantities	INSERT	orders	EXECUTE FUNCTION update_sold_quantities_on_order()
trigger_update_sold_quantities	UPDATE	orders	EXECUTE FUNCTION update_sold_quantities_on_order()
trigger_update_pricing_categories_updated_at	UPDATE	pricing_categories	EXECUTE FUNCTION update_pricing_categories_updated_at()
trigger_update_reference_prices_updated_at	UPDATE	reference_prices	EXECUTE FUNCTION update_reference_prices_updated_at()
trigger_update_supplier_price_grids_updated_at	UPDATE	supplier_price_grids	EXECUTE FUNCTION update_supplier_price_grids_updated_at()
trigger_notify_client_new_offer	INSERT	supplier_offers	EXECUTE FUNCTION create_notification_on_new_offer()
trigger_update_order_status_on_offer	INSERT	supplier_offers	EXECUTE FUNCTION update_order_status_on_offer()
trigger_log_supplier_price_grid_changes	INSERT	supplier_price_grids	EXECUTE FUNCTION log_supplier_price_grid_changes()
trigger_log_supplier_price_grid_changes	DELETE	supplier_price_grids	EXECUTE FUNCTION log_supplier_price_grid_changes()
trigger_log_supplier_price_grid_changes	UPDATE	supplier_price_grids	EXECUTE FUNCTION log_supplier_price_grid_changes()
trigger_record_delivery_user	UPDATE	orders	EXECUTE FUNCTION record_delivery_user()
user_module_permissions_updated_at	UPDATE	user_module_permissions	EXECUTE FUNCTION update_user_module_permissions_updated_at()


4. Fonctions (Routines)
Veuillez exécuter la requête suivante et coller le résultat ci-dessous :

SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public';

Résultat : 

routine_name	routine_type	data_type
create_notification_preferences_for_new_user	FUNCTION	trigger
get_user_permissions	FUNCTION	text
can_add_member	FUNCTION	boolean
handle_new_user	FUNCTION	trigger
reset_supplier_sold_quantities	FUNCTION	void
update_sold_quantities_on_order	FUNCTION	trigger
get_pending_ratings_for_user	FUNCTION	record
is_organization_owner	FUNCTION	boolean
has_team_access	FUNCTION	boolean
record_delivery_user	FUNCTION	trigger
update_user_module_permissions_updated_at	FUNCTION	trigger
get_client_info_for_order	FUNCTION	record
create_organization_with_owner	FUNCTION	uuid
get_organization_member_count	FUNCTION	integer
has_permission	FUNCTION	boolean
generate_confirmation_code	FUNCTION	text
update_order_status_on_offer	FUNCTION	trigger
is_approved_user	FUNCTION	boolean
has_role	FUNCTION	boolean
update_updated_at_column	FUNCTION	trigger
update_user_rating	FUNCTION	trigger
update_supplier_zone_stats	FUNCTION	void
check_single_accepted_offer	FUNCTION	trigger
log_profile_update_activity	FUNCTION	trigger
log_rating_activity	FUNCTION	trigger
update_zone_request_timestamp	FUNCTION	trigger
update_ticket_timestamp	FUNCTION	trigger
generate_ticket_number	FUNCTION	text
update_organizations_updated_at	FUNCTION	trigger
update_organization_members_updated_at	FUNCTION	trigger
notify_admins_new_zone_request	FUNCTION	trigger
is_admin	FUNCTION	boolean
notify_supplier_request_reviewed	FUNCTION	trigger
update_orders_on_transfer_completion	FUNCTION	trigger
is_client	FUNCTION	boolean
is_supplier	FUNCTION	boolean
is_supplier	FUNCTION	boolean
is_client	FUNCTION	boolean
is_approved	FUNCTION	boolean
get_user_permissions	FUNCTION	jsonb
has_permission	FUNCTION	boolean
create_organization_with_owner	FUNCTION	uuid
get_supplier_info_for_order	FUNCTION	json
get_profile_for_rating	FUNCTION	record
get_supplier_profiles_for_client	FUNCTION	record
get_client_profiles_for_supplier	FUNCTION	record
create_notification_on_new_offer	FUNCTION	trigger
create_notification_on_order_status_change	FUNCTION	trigger
update_pricing_categories_updated_at	FUNCTION	trigger
update_reference_prices_updated_at	FUNCTION	trigger
update_supplier_price_grids_updated_at	FUNCTION	trigger
log_supplier_price_grid_changes	FUNCTION	trigger
is_admin	FUNCTION	boolean
log_order_activity	FUNCTION	trigger
get_reference_price	FUNCTION	record
get_supplier_price_grid	FUNCTION	record
validate_delivery_before_delivered	FUNCTION	trigger
has_pending_ratings	FUNCTION	boolean
create_notification_on_new_order	FUNCTION	trigger
set_delivery_confirmation_code	FUNCTION	trigger

