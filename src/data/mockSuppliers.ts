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
    coverageCommunes: [
      {
        communeId: 'plateau',
        communeName: 'Plateau',
        isActive: true,
        maxDeliveryRadius: 8,
        minimumOrderAmount: 5000,
        deliveryFee: 0,
        averageDeliveryTime: 18,
        totalOrders: 45,
        successRate: 95,
        lastDelivery: new Date('2024-12-15'),
        activatedAt: new Date('2024-01-15')
      },
      {
        communeId: 'marcory',
        communeName: 'Marcory',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 500,
        averageDeliveryTime: 22,
        totalOrders: 28,
        successRate: 88,
        lastDelivery: new Date('2024-12-14'),
        activatedAt: new Date('2024-02-01')
      },
      {
        communeId: 'treichville',
        communeName: 'Treichville',
        isActive: true,
        maxDeliveryRadius: 9,
        minimumOrderAmount: 7000,
        deliveryFee: 800,
        averageDeliveryTime: 20,
        totalOrders: 22,
        successRate: 94,
        lastDelivery: new Date('2024-12-13'),
        activatedAt: new Date('2024-03-01')
      },
      {
        communeId: 'cocody',
        communeName: 'Cocody',
        isActive: false,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 8000,
        deliveryFee: 1000,
        averageDeliveryTime: 35,
        totalOrders: 12,
        successRate: 75,
        lastDelivery: new Date('2024-12-10'),
        activatedAt: new Date('2024-04-01'),
        deactivatedAt: new Date('2024-12-12'),
        deactivationReason: 'Délais de livraison trop longs (>30 min en moyenne)'
      }
    ],
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
    coverageCommunes: [
      {
        communeId: 'cocody',
        communeName: 'Cocody',
        isActive: true,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 8000,
        deliveryFee: 1000,
        averageDeliveryTime: 22,
        totalOrders: 38,
        successRate: 92,
        lastDelivery: new Date('2024-12-15'),
        activatedAt: new Date('2024-02-20')
      },
      {
        communeId: 'adjame',
        communeName: 'Adjamé',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 800,
        averageDeliveryTime: 25,
        totalOrders: 18,
        successRate: 90,
        lastDelivery: new Date('2024-12-14'),
        activatedAt: new Date('2024-03-15')
      },
      {
        communeId: 'yopougon-est',
        communeName: 'Yopougon Est',
        isActive: true,
        maxDeliveryRadius: 15,
        minimumOrderAmount: 10000,
        deliveryFee: 1500,
        averageDeliveryTime: 28,
        totalOrders: 15,
        successRate: 87,
        lastDelivery: new Date('2024-12-12'),
        activatedAt: new Date('2024-04-01')
      }
    ],
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
    coverageCommunes: [
      {
        communeId: 'marcory',
        communeName: 'Marcory',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 500,
        averageDeliveryTime: 25,
        totalOrders: 34,
        successRate: 88,
        lastDelivery: new Date('2024-12-15'),
        activatedAt: new Date('2024-03-10')
      },
      {
        communeId: 'koumassi',
        communeName: 'Koumassi',
        isActive: true,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 7000,
        deliveryFee: 1000,
        averageDeliveryTime: 30,
        totalOrders: 22,
        successRate: 85,
        lastDelivery: new Date('2024-12-13'),
        activatedAt: new Date('2024-05-01')
      },
      {
        communeId: 'port-bouet',
        communeName: 'Port-Bouët',
        isActive: false,
        maxDeliveryRadius: 15,
        minimumOrderAmount: 8000,
        deliveryFee: 1200,
        averageDeliveryTime: 40,
        totalOrders: 8,
        successRate: 70,
        lastDelivery: new Date('2024-12-08'),
        activatedAt: new Date('2024-06-01'),
        deactivatedAt: new Date('2024-12-10'),
        deactivationReason: 'Taux de réussite insuffisant (<75%)'
      }
    ],
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
    supplier.coverageCommunes.some(c => 
      c.communeName.toLowerCase().includes(commune.toLowerCase()) && 
      c.isActive
    ) && supplier.isAvailable
  );
};

export const getSupplierCommune = (supplierId: string): string => {
  const supplier = getSupplierById(supplierId);
  if (!supplier) return 'Abidjan';
  
  // Get first active commune or first commune
  const activeCommune = supplier.coverageCommunes.find(c => c.isActive);
  const firstCommune = supplier.coverageCommunes[0];
  
  return activeCommune?.communeName || firstCommune?.communeName || 'Abidjan';
};