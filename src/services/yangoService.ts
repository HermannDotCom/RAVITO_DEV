import { supabase } from '../lib/supabase';
import { Coordinates } from '../types';

// Marge de RAVITO sur le coût de transport Yango
const RAVITO_MARGIN = 0.15; // 15%

/**
 * Simule l'appel à l'API Yango pour obtenir le coût de transport.
 * Dans une application réelle, cela ferait un appel HTTP à l'API Yango.
 * 
 * @param origin Coordonnées de l'origine (Dépôt Fournisseur).
 * @param destination Coordonnées de la destination (Client).
 * @returns Le coût estimé du transport en FCFA.
 */
async function getBaseYangoCost(origin: Coordinates, destination: Coordinates): Promise<number> {
  // Logique de simulation basée sur la distance (Approximation)
  const distance = calculateDistance(origin, destination); // Distance en km

  // Simulation de la tarification Yango (Exemple: 500 FCFA de base + 150 FCFA/km)
  const baseCost = 500;
  const costPerKm = 150;
  
  const rawCost = baseCost + (distance * costPerKm);
  
  // Arrondir à la centaine supérieure pour une meilleure expérience utilisateur
  return Math.ceil(rawCost / 100) * 100;
}

/**
 * Calcule la distance entre deux points géographiques (Formule Haversine).
 * @param coord1 Coordonnées du point 1.
 * @param coord2 Coordonnées du point 2.
 * @returns Distance en kilomètres.
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; // Distance en km
  
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calcule le coût final de la livraison Yango pour le client, incluant la marge RAVITO.
 * @param origin Coordonnées du dépôt fournisseur.
 * @param destination Coordonnées du client.
 * @returns Le coût final de la livraison pour le client.
 */
export async function calculateYangoDeliveryCost(origin: Coordinates, destination: Coordinates): Promise<{ clientCost: number, ravitoMargin: number }> {
  const baseCost = await getBaseYangoCost(origin, destination);
  
  const ravitoMarginAmount = Math.round(baseCost * RAVITO_MARGIN);
  const clientCost = baseCost + ravitoMarginAmount;
  
  return { clientCost, ravitoMargin: ravitoMarginAmount };
}

/**
 * Simule la sélection du meilleur fournisseur pour une commande, en tenant compte
 * de la garde de nuit et du coût de transport Yango.
 * 
 * @param orderCoordinates Coordonnées du client.
 * @param zoneId Zone de livraison du client.
 * @returns L'ID du fournisseur sélectionné et le coût de livraison.
 */
export async function selectBestSupplierAndCost(orderCoordinates: Coordinates, zoneId: string): Promise<{ supplierId: string, deliveryCost: number } | null> {
  // 1. Déterminer si nous sommes en mode Garde de Nuit
  const isNight = isNightTime(); // Utiliser la fonction créée précédemment
  
  let supplierQuery = supabase
    .from('profiles')
    .select('id, coordinates, business_name')
    .eq('role', 'supplier')
    .eq('is_approved', true);

  // 2. Filtrer par zone de couverture (supplier_zones)
  const { data: zoneSuppliers, error: zoneError } = await supabase
    .from('supplier_zones')
    .select('supplier_id')
    .eq('zone_id', zoneId)
    .eq('approval_status', 'approved');

  if (zoneError || !zoneSuppliers || zoneSuppliers.length === 0) {
    console.warn('Aucun fournisseur approuvé pour cette zone.');
    return null;
  }
  
  const approvedSupplierIds = zoneSuppliers.map(sz => sz.supplier_id);
  supplierQuery = supplierQuery.in('id', approvedSupplierIds);

  // 3. Filtrer par Garde de Nuit si nécessaire
  if (isNight) {
    const { data: nightGuardSchedules, error: ngError } = await supabase
      .from('night_guard_schedule')
      .select('supplier_id')
      .eq('date', new Date().toISOString().split('T')[0])
      .eq('is_active', true)
      .contains('covered_zones', [zoneId]); // Le fournisseur doit couvrir la zone du client

    if (ngError || !nightGuardSchedules || nightGuardSchedules.length === 0) {
      console.warn('Mode nuit actif, mais aucun fournisseur de garde trouvé pour cette zone.');
      return null;
    }
    
    const nightGuardIds = nightGuardSchedules.map(ng => ng.supplier_id);
    supplierQuery = supplierQuery.in('id', nightGuardIds);
  }

  // 4. Exécuter la requête pour obtenir les fournisseurs potentiels
  const { data: potentialSuppliers, error: supplierError } = await supplierQuery;

  if (supplierError || !potentialSuppliers || potentialSuppliers.length === 0) {
    console.warn('Aucun fournisseur disponible après tous les filtres.');
    return null;
  }

  // 5. Calculer le coût Yango pour chaque fournisseur et choisir le moins cher
  let bestSupplier: { supplierId: string, deliveryCost: number } | null = null;
  let minCost = Infinity;

  for (const supplier of potentialSuppliers) {
    if (supplier.coordinates) {
      const origin: Coordinates = { lat: supplier.coordinates.lat, lng: supplier.coordinates.lng };
      const { clientCost } = await calculateYangoDeliveryCost(origin, orderCoordinates);
      
      if (clientCost < minCost) {
        minCost = clientCost;
        bestSupplier = { supplierId: supplier.id, deliveryCost: clientCost };
      }
    }
  }

  return bestSupplier;
}
