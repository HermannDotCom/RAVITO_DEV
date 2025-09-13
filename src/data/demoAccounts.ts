import { User, Client, Supplier } from '../types';

export interface DemoAccount {
  id: string;
  name: string;
  role: 'admin' | 'client' | 'supplier';
  profileType: string;
  email: string;
  password: string;
  commune: string;
  userData: User | Client | Supplier;
}

export const demoAccounts: DemoAccount[] = [
  // Admin - Employé DISTRI-NIGHT
  {
    id: 'demo-admin',
    name: 'Hermann N\'GUESSAN',
    role: 'admin',
    profileType: 'Profil Administrateur',
    email: 'hermann.nguessan@distri-night.ci',
    password: 'demo123',
    commune: 'Plateau',
    userData: {
      id: 'admin-hermann',
      email: 'hermann.nguessan@distri-night.ci',
      role: 'admin',
      name: 'Hermann N\'GUESSAN',
      phone: '+225 27 20 30 40 50',
      address: 'Siège DISTRI-NIGHT, Plateau, Abidjan',
      coordinates: { lat: 5.3267, lng: -4.0305 },
      rating: 5.0,
      totalOrders: 0,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date('2024-01-11'),
      createdAt: new Date('2024-01-10')
    }
  },

  // Client - Maquis
  {
    id: 'demo-client',
    name: 'Jean Dupont',
    role: 'client',
    profileType: 'Profil Client',
    email: 'jean.dupont@maquis-bellevue.ci',
    password: 'demo123',
    commune: 'Cocody',
    userData: {
      id: 'client-jean',
      email: 'jean.dupont@maquis-bellevue.ci',
      role: 'client',
      name: 'Jean Dupont',
      phone: '+225 07 12 34 56 78',
      address: 'Maquis Belle Vue, Cocody, près du carrefour Dallas',
      coordinates: { lat: 5.3364, lng: -4.0267 },
      rating: 4.5,
      totalOrders: 23,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date('2024-11-16'),
      createdAt: new Date('2024-11-15'),
      businessName: 'Maquis Belle Vue',
      businessHours: '18h00 - 06h00',
      preferredPayments: ['orange', 'mtn', 'wave'],
      responsiblePerson: 'Jean Dupont'
    } as Client
  },

  // Fournisseur - Dépôt-vente
  {
    id: 'demo-supplier',
    name: 'Amadou Diallo',
    role: 'supplier',
    profileType: 'Profil Gestionnaire de Dépôt',
    email: 'amadou.diallo@depot-plateau.ci',
    password: 'demo123',
    commune: 'Plateau',
    userData: {
      id: 'supplier-amadou',
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
      approvedAt: new Date('2024-01-16'),
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
          id: 'sc-demo-plateau',
          supplierId: 'supplier-amadou',
          supplierName: 'Amadou Diallo',
          supplierBusinessName: 'Dépôt du Plateau',
          isActive: true,
          registeredAt: new Date('2024-01-15'),
          approvedAt: new Date('2024-01-16'),
          performanceMetrics: {
            totalOrders: 156,
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
        }
      ]
    } as Supplier
  },

  // Comptable - Profil financier
  {
    id: 'demo-accountant',
    name: 'Fatou Koné',
    role: 'admin',
    profileType: 'Profil Comptable',
    email: 'fatou.kone@distri-night.ci',
    password: 'demo123',
    commune: 'Plateau',
    userData: {
      id: 'admin-fatou',
      email: 'fatou.kone@distri-night.ci',
      role: 'admin',
      name: 'Fatou Koné',
      phone: '+225 01 23 45 67 89',
      address: 'Siège DISTRI-NIGHT, Plateau, Abidjan',
      coordinates: { lat: 5.3267, lng: -4.0305 },
      rating: 5.0,
      totalOrders: 0,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date('2024-02-02'),
      createdAt: new Date('2024-02-01')
    }
  },

  // Coursier - Profil livraison
  {
    id: 'demo-courier',
    name: 'Marie Martin',
    role: 'supplier',
    profileType: 'Profil Coursier',
    email: 'marie.martin@coursier-express.ci',
    password: 'demo123',
    commune: 'Cocody',
    userData: {
      id: 'supplier-marie',
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
      approvedAt: new Date('2024-02-21'),
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
          id: 'sc-demo-cocody',
          supplierId: 'supplier-marie',
          supplierName: 'Marie Martin',
          supplierBusinessName: 'Cocody Express',
          isActive: true,
          registeredAt: new Date('2024-02-20'),
          approvedAt: new Date('2024-02-21'),
          performanceMetrics: {
            totalOrders: 89,
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
        }
      ]
    } as Supplier
  }
];

// Comptes de test pour le système d'approbation
export const pendingApprovalAccounts: DemoAccount[] = [
  // Client en attente d'approbation
  {
    id: 'demo-pending-client',
    name: 'Kouadio Yves',
    role: 'client',
    profileType: 'Client en attente d\'approbation',
    email: 'kouadio.yves@maquis-test.ci',
    password: 'demo123',
    commune: 'Adjamé',
    userData: {
      id: 'pending-client-kouadio',
      email: 'kouadio.yves@maquis-test.ci',
      role: 'client',
      name: 'Kouadio Yves',
      phone: '+225 07 88 99 00 11',
      address: 'Maquis du Carrefour, Adjamé, près de la gare',
      coordinates: { lat: 5.3789, lng: -4.0056 },
      rating: 0,
      totalOrders: 0,
      isActive: false,
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date('2024-12-16'),
      businessName: 'Maquis du Carrefour',
      businessHours: '19h00 - 05h00',
      preferredPayments: ['orange', 'mtn'],
      responsiblePerson: 'Kouadio Yves'
    } as Client
  },

  // Fournisseur en attente d'approbation
  {
    id: 'demo-pending-supplier',
    name: 'Diabaté Sekou',
    role: 'supplier',
    profileType: 'Fournisseur en attente d\'approbation',
    email: 'diabate.sekou@depot-test.ci',
    password: 'demo123',
    commune: 'Yopougon',
    userData: {
      id: 'pending-supplier-diabate',
      email: 'diabate.sekou@depot-test.ci',
      role: 'supplier',
      name: 'Diabaté Sekou',
      phone: '+225 05 77 88 99 00',
      address: 'Dépôt Express Yop, Yopougon, près du marché',
      coordinates: { lat: 5.3500, lng: -4.1200 },
      rating: 0,
      totalOrders: 0,
      isActive: false,
      isApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date('2024-12-15'),
      businessName: 'Dépôt Express Yop',
      businessHours: '18h00 - 06h00',
      coverageZone: 'Yopougon, Abobo Sud',
      availableProducts: ['Solibra', 'Brassivoire'],
      deliveryCapacity: 'tricycle',
      acceptedPayments: ['orange', 'mtn', 'wave'],
      isAvailable: false
      communes: [
        {
          id: 'sc-pending-yopougon',
          supplierId: 'pending-supplier-diabate',
          supplierName: 'Diabaté Sekou',
          supplierBusinessName: 'Dépôt Express Yop',
          isActive: false,
          registeredAt: new Date('2024-12-15'),
          performanceMetrics: {
            totalOrders: 0,
            successRate: 0,
            averageDeliveryTime: 0
          },
          deliverySettings: {
            maxDeliveryRadius: 15,
            minimumOrderAmount: 8000,
            deliveryFee: 1200
          },
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date('2024-12-15')
        }
      ]
    } as Supplier
  }
];

export const getDemoAccountByCredentials = (email: string, password: string): DemoAccount | null => {
  const allAccounts = [...demoAccounts, ...pendingApprovalAccounts];
  return allAccounts.find(account => 
    account.email === email && account.password === password
  ) || null;
};

export const getAllDemoAccounts = (): DemoAccount[] => {
  return [...demoAccounts, ...pendingApprovalAccounts];
};