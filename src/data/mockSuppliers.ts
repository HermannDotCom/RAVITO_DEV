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
        supplierName: 'Amadou Diallo',
        supplierBusinessName: 'Dépôt du Plateau',
        isActive: true,
        registeredAt: new Date('2024-01-15'),
        approvedAt: new Date('2024-01-16'),
        performanceMetrics: {
          totalOrders: 45,
          successRate: 95,
          averageDeliveryTime: 18,
          lastOrderDate: new Date('2024-12-15')
        },
        deliverySettings: {
          maxDeliveryRadius: 8,
          minimumOrderAmount: 5000,
          deliveryFee: 0
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-1-marcory',
        supplierId: 'supplier-1',
        supplierName: 'Amadou Diallo',
        supplierBusinessName: 'Dépôt du Plateau',
        isActive: true,
        registeredAt: new Date('2024-01-20'),
        approvedAt: new Date('2024-01-21'),
        performanceMetrics: {
          totalOrders: 32,
          successRate: 88,
          averageDeliveryTime: 22,
          lastOrderDate: new Date('2024-12-14')
        },
        deliverySettings: {
          maxDeliveryRadius: 10,
          minimumOrderAmount: 6000,
          deliveryFee: 500
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-12-14')
      },
      {
        id: 'sc-1-treichville',
        supplierId: 'supplier-1',
        supplierName: 'Amadou Diallo',
        supplierBusinessName: 'Dépôt du Plateau',
        isActive: true,
        registeredAt: new Date('2024-02-01'),
        approvedAt: new Date('2024-02-02'),
        performanceMetrics: {
          totalOrders: 28,
          successRate: 92,
          averageDeliveryTime: 20,
          lastOrderDate: new Date('2024-12-13')
        },
        deliverySettings: {
          maxDeliveryRadius: 9,
          minimumOrderAmount: 7000,
          deliveryFee: 800
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-12-13')
      },
      {
        id: 'sc-1-cocody',
        supplierId: 'supplier-1',
        supplierName: 'Amadou Diallo',
        supplierBusinessName: 'Dépôt du Plateau',
        isActive: false,
        registeredAt: new Date('2024-02-15'),
        approvedAt: new Date('2024-02-16'),
        deactivatedAt: new Date('2024-12-11'),
        deactivationReason: 'Délais de livraison trop longs (>30 min) et taux d\'échec élevé',
        performanceMetrics: {
          totalOrders: 15,
          successRate: 73,
          averageDeliveryTime: 35,
          lastOrderDate: new Date('2024-12-10')
        },
        deliverySettings: {
          maxDeliveryRadius: 12,
          minimumOrderAmount: 8000,
          deliveryFee: 1000
        },
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
        supplierName: 'Marie Martin',
        supplierBusinessName: 'Cocody Express',
        isActive: true,
        registeredAt: new Date('2024-02-20'),
        approvedAt: new Date('2024-02-21'),
        performanceMetrics: {
          totalOrders: 38,
          successRate: 92,
          averageDeliveryTime: 22,
          lastOrderDate: new Date('2024-12-15')
        },
        deliverySettings: {
          maxDeliveryRadius: 12,
          minimumOrderAmount: 8000,
          deliveryFee: 1000
        },
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-2-adjame',
        supplierId: 'supplier-2',
        supplierName: 'Marie Martin',
        supplierBusinessName: 'Cocody Express',
        isActive: true,
        registeredAt: new Date('2024-03-01'),
        approvedAt: new Date('2024-03-02'),
        performanceMetrics: {
          totalOrders: 25,
          successRate: 88,
          averageDeliveryTime: 25,
          lastOrderDate: new Date('2024-12-14')
        },
        deliverySettings: {
          maxDeliveryRadius: 10,
          minimumOrderAmount: 6000,
          deliveryFee: 800
        },
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-12-14')
      },
      {
        id: 'sc-2-yopougon',
        supplierId: 'supplier-2',
        supplierName: 'Marie Martin',
        supplierBusinessName: 'Cocody Express',
        isActive: true,
        registeredAt: new Date('2024-03-15'),
        approvedAt: new Date('2024-03-16'),
        performanceMetrics: {
          totalOrders: 18,
          successRate: 85,
          averageDeliveryTime: 28,
          lastOrderDate: new Date('2024-12-12')
        },
        deliverySettings: {
          maxDeliveryRadius: 15,
          minimumOrderAmount: 10000,
          deliveryFee: 1500
        },
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
        supplierName: 'Ibrahim Koné',
        supplierBusinessName: 'Dépôt Marcory Sud',
        isActive: true,
        registeredAt: new Date('2024-03-10'),
        approvedAt: new Date('2024-03-11'),
        performanceMetrics: {
          totalOrders: 42,
          successRate: 94,
          averageDeliveryTime: 20,
          lastOrderDate: new Date('2024-12-15')
        },
        deliverySettings: {
          maxDeliveryRadius: 10,
          minimumOrderAmount: 6000,
          deliveryFee: 500
        },
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'sc-3-koumassi',
        supplierId: 'supplier-3',
        supplierName: 'Ibrahim Koné',
        supplierBusinessName: 'Dépôt Marcory Sud',
        isActive: true,
        registeredAt: new Date('2024-04-01'),
        approvedAt: new Date('2024-04-02'),
        performanceMetrics: {
          totalOrders: 28,
          successRate: 89,
          averageDeliveryTime: 25,
          lastOrderDate: new Date('2024-12-13')
        },
        deliverySettings: {
          maxDeliveryRadius: 12,
          minimumOrderAmount: 7000,
          deliveryFee: 1000
        },
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-12-13')
      },
      {
        id: 'sc-3-portbouet',
        supplierId: 'supplier-3',
        supplierName: 'Ibrahim Koné',
        supplierBusinessName: 'Dépôt Marcory Sud',
        isActive: false,
        registeredAt: new Date('2024-04-15'),
        approvedAt: new Date('2024-04-16'),
        deactivatedAt: new Date('2024-12-09'),
        deactivationReason: 'Taux de réussite insuffisant (67%) et délais excessifs',
        performanceMetrics: {
          totalOrders: 12,
          successRate: 67,
          averageDeliveryTime: 40,
          lastOrderDate: new Date('2024-12-08')
        },
        deliverySettings: {
          maxDeliveryRadius: 15,
          minimumOrderAmount: 8000,
          deliveryFee: 1200
        },
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

// Créer les zones de livraison organisées par commune
export const deliveryZones = [
  {
    id: 'zone-plateau',
    communeName: 'Plateau',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Plateau') || 
        supplier.address.includes('Plateau'))
    ),
    zoneSettings: {
      maxSuppliers: 10,
      minimumCoverage: 2,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalOrders: 45,
      averageDeliveryTime: 18,
      successRate: 95
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: 'zone-cocody',
    communeName: 'Cocody',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Cocody') || 
        supplier.address.includes('Cocody'))
    ),
    zoneSettings: {
      maxSuppliers: 8,
      minimumCoverage: 2,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 2,
      activeSuppliers: 1,
      totalOrders: 53,
      averageDeliveryTime: 22,
      successRate: 89
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: 'zone-marcory',
    communeName: 'Marcory',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Marcory') || 
        supplier.address.includes('Marcory'))
    ),
    zoneSettings: {
      maxSuppliers: 6,
      minimumCoverage: 2,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 2,
      activeSuppliers: 2,
      totalOrders: 74,
      averageDeliveryTime: 21,
      successRate: 91
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: 'zone-treichville',
    communeName: 'Treichville',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Treichville') || 
        supplier.address.includes('Treichville'))
    ),
    zoneSettings: {
      maxSuppliers: 5,
      minimumCoverage: 1,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalOrders: 28,
      averageDeliveryTime: 20,
      successRate: 92
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-13')
  },
  {
    id: 'zone-adjame',
    communeName: 'Adjamé',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Adjamé') || 
        supplier.address.includes('Adjamé'))
    ),
    zoneSettings: {
      maxSuppliers: 5,
      minimumCoverage: 1,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalOrders: 25,
      averageDeliveryTime: 25,
      successRate: 88
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-14')
  },
  {
    id: 'zone-yopougon',
    communeName: 'Yopougon Est',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Yopougon') || 
        supplier.address.includes('Yopougon'))
    ),
    zoneSettings: {
      maxSuppliers: 8,
      minimumCoverage: 2,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalOrders: 18,
      averageDeliveryTime: 28,
      successRate: 85
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-12')
  },
  {
    id: 'zone-koumassi',
    communeName: 'Koumassi',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Koumassi') || 
        supplier.address.includes('Koumassi'))
    ),
    zoneSettings: {
      maxSuppliers: 4,
      minimumCoverage: 1,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalOrders: 28,
      averageDeliveryTime: 25,
      successRate: 89
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-13')
  },
  {
    id: 'zone-portbouet',
    communeName: 'Port-Bouët',
    isActive: true,
    suppliers: mockSuppliers.flatMap(supplier => 
      supplier.communes.filter(commune => commune.supplierBusinessName.includes('Port-Bouët') || 
        supplier.address.includes('Port-Bouët'))
    ),
    zoneSettings: {
      maxSuppliers: 3,
      minimumCoverage: 1,
      operatingHours: '18h00 - 06h00'
    },
    statistics: {
      totalSuppliers: 1,
      activeSuppliers: 0,
      totalOrders: 12,
      averageDeliveryTime: 40,
      successRate: 67
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09')
  }
];

export const getZoneByCommune = (communeName: string) => {
  return deliveryZones.find(zone => zone.communeName === communeName);
};

export const getSuppliersByZone = (communeName: string) => {
  const zone = getZoneByCommune(communeName);
  return zone ? zone.suppliers : [];
};