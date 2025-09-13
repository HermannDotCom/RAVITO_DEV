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
    isApproved: true,
    approvalStatus: 'approved',
    createdAt: new Date('2024-01-15'),
    businessName: 'Dépôt du Plateau',
    businessHours: '18h00 - 06h00',
    coverageZone: 'Plateau, Marcory, Treichville, Cocody',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck',
    acceptedPayments: ['orange', 'mtn', 'moov', 'card'],
    isAvailable: true,
    communes: [
      {
        id: 'sc-1-plateau',
        supplierId: 'supplier-1',
        communeName: 'Plateau',
        isActive: true,
        maxDeliveryRadius: 8,
        minimumOrderAmount: 5000,
        deliveryFee: 0,
        averageDeliveryTime: 18,
        totalOrders: 45,
        successRate: 95,
        lastOrderDate: new Date('2024-12-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-1-marcory',
        supplierId: 'supplier-1',
        communeName: 'Marcory',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 500,
        averageDeliveryTime: 22,
        totalOrders: 32,
        successRate: 88,
        lastOrderDate: new Date('2024-12-14'),
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-12-14')
      },
      {
        id: 'sc-1-treichville',
        supplierId: 'supplier-1',
        communeName: 'Treichville',
        isActive: true,
        maxDeliveryRadius: 9,
        minimumOrderAmount: 7000,
        deliveryFee: 800,
        averageDeliveryTime: 20,
        totalOrders: 28,
        successRate: 92,
        lastOrderDate: new Date('2024-12-13'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-12-13')
      },
      {
        id: 'sc-1-cocody',
        supplierId: 'supplier-1',
        communeName: 'Cocody',
        isActive: false,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 8000,
        deliveryFee: 1000,
        averageDeliveryTime: 35,
        totalOrders: 15,
        successRate: 73,
        lastOrderDate: new Date('2024-12-10'),
        deactivatedAt: new Date('2024-12-11'),
        deactivationReason: 'Délais de livraison trop longs (>30 min) et taux d\'échec élevé',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-12-11')
      }
    ]
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
    isApproved: true,
    approvalStatus: 'approved',
    createdAt: new Date('2024-02-20'),
    businessName: 'Cocody Express',
    businessHours: '19h00 - 05h00',
    coverageZone: 'Cocody, Adjamé, Yopougon Est',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'tricycle',
    acceptedPayments: ['orange', 'mtn', 'wave'],
    isAvailable: true,
    communes: [
      {
        id: 'sc-2-cocody',
        supplierId: 'supplier-2',
        communeName: 'Cocody',
        isActive: true,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 8000,
        deliveryFee: 1000,
        averageDeliveryTime: 22,
        totalOrders: 38,
        successRate: 92,
        lastOrderDate: new Date('2024-12-15'),
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-2-adjame',
        supplierId: 'supplier-2',
        communeName: 'Adjamé',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 800,
        averageDeliveryTime: 25,
        totalOrders: 25,
        successRate: 88,
        lastOrderDate: new Date('2024-12-14'),
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-12-14')
      },
      {
        id: 'sc-2-yopougon',
        supplierId: 'supplier-2',
        communeName: 'Yopougon Est',
        isActive: true,
        maxDeliveryRadius: 15,
        minimumOrderAmount: 10000,
        deliveryFee: 1500,
        averageDeliveryTime: 28,
        totalOrders: 18,
        successRate: 85,
        lastOrderDate: new Date('2024-12-12'),
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-12-12')
      }
    ]
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
    isApproved: true,
    approvalStatus: 'approved',
    createdAt: new Date('2024-03-10'),
    businessName: 'Dépôt Marcory Sud',
    businessHours: '18h30 - 05h30',
    coverageZone: 'Marcory, Koumassi, Port-Bouët',
    availableProducts: ['Solibra', 'Brassivoire'],
    deliveryCapacity: 'truck',
    acceptedPayments: ['orange', 'mtn', 'moov', 'wave'],
    isAvailable: true,
    communes: [
      {
        id: 'sc-3-marcory',
        supplierId: 'supplier-3',
        communeName: 'Marcory',
        isActive: true,
        maxDeliveryRadius: 10,
        minimumOrderAmount: 6000,
        deliveryFee: 500,
        averageDeliveryTime: 20,
        totalOrders: 42,
        successRate: 94,
        lastOrderDate: new Date('2024-12-15'),
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-3-koumassi',
        supplierId: 'supplier-3',
        communeName: 'Koumassi',
        isActive: true,
        maxDeliveryRadius: 12,
        minimumOrderAmount: 7000,
        deliveryFee: 1000,
        averageDeliveryTime: 25,
        totalOrders: 28,
        successRate: 89,
        lastOrderDate: new Date('2024-12-13'),
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-12-13')
      },
      {
        id: 'sc-3-portbouet',
        supplierId: 'supplier-3',
        communeName: 'Port-Bouët',
        isActive: false,
        maxDeliveryRadius: 15,
        minimumOrderAmount: 8000,
        deliveryFee: 1200,
        averageDeliveryTime: 40,
        totalOrders: 12,
        successRate: 67,
        lastOrderDate: new Date('2024-12-08'),
        deactivatedAt: new Date('2024-12-09'),
        deactivationReason: 'Taux de réussite insuffisant (67%) et délais excessifs',
        createdAt: new Date('2024-04-15'),
        updatedAt: new Date('2024-12-09')
      }
    ]
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