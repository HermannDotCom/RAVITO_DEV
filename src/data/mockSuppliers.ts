import { Supplier } from '../types';

export const mockSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    email: 'amadou.diallo@depot-plateau.ci',
    role: 'supplier',
    name: 'Amadou Diallo',
    phone: '+225 05 44 33 22 11',
    address: 'Dépôt du Plateau, Plateau, Abidjan',
    coordinates: { lat: 5.3267, lng: -4.0305 },
    rating: 4.7,
    totalOrders: 156,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    businessName: 'Dépôt du Plateau',
    businessHours: '18h00 - 06h00',
    coverageZone: 'Plateau, Marcory, Treichville, Cocody',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck',
    acceptedPayments: ['orange', 'mtn', 'moov', 'card'],
    isAvailable: true
  },
  {
    id: 'supplier-2',
    email: 'marie.martin@coursier-express.ci',
    role: 'supplier',
    name: 'Marie Martin',
    phone: '+225 07 55 44 33 22',
    address: 'Cocody Express, Cocody, Abidjan',
    coordinates: { lat: 5.3364, lng: -4.0267 },
    rating: 4.4,
    totalOrders: 89,
    isActive: true,
    createdAt: new Date('2024-02-20'),
    businessName: 'Cocody Express',
    businessHours: '19h00 - 05h00',
    coverageZone: 'Cocody, Adjamé, Yopougon Est',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'tricycle',
    acceptedPayments: ['orange', 'mtn', 'wave'],
    isAvailable: true
  },
  {
    id: 'supplier-3',
    email: 'ibrahim.kone@depot-marcory.ci',
    role: 'supplier',
    name: 'Ibrahim Koné',
    phone: '+225 01 77 88 99 00',
    address: 'Dépôt Marcory Sud, Marcory, Abidjan',
    coordinates: { lat: 5.2900, lng: -4.0100 },
    rating: 4.6,
    totalOrders: 134,
    isActive: true,
    createdAt: new Date('2024-03-10'),
    businessName: 'Dépôt Marcory Sud',
    businessHours: '18h30 - 05h30',
    coverageZone: 'Marcory, Koumassi, Port-Bouët',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck',
    acceptedPayments: ['orange', 'mtn', 'moov', 'wave'],
    isAvailable: true
  }
];

export const getSupplierById = (id: string): Supplier | null => {
  return mockSuppliers.find(supplier => supplier.id === id) || null;
};

export const getSuppliersByCommune = (commune: string): Supplier[] => {
  return mockSuppliers.filter(supplier => 
    supplier.coverageZone.toLowerCase().includes(commune.toLowerCase()) && 
    supplier.isAvailable
  );
};

export const getSupplierCommune = (supplierId: string): string => {
  const supplier = getSupplierById(supplierId);
  if (!supplier) return 'Abidjan';
  
  // Extract commune from address
  const addressParts = supplier.address.split(',');
  return addressParts[1]?.trim() || 'Abidjan';
};