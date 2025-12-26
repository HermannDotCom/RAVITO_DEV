/**
 * Données de test centralisées pour les tests E2E RAVITO
 */

export const testUsers = {
  client: {
    email: 'test-client@ravito.ci',
    password: 'TestClient123!',
    fullName: 'Jean Test Client',
    phone: '07 00 00 00 01',
    businessName: 'Maquis Test Playwright',
    establishmentType: 'maquis',
    address: 'Cocody, Rue des Tests, Abidjan',
  },
  supplier: {
    email: 'test-supplier@ravito.ci',
    password: 'TestSupplier123!',
    fullName: 'Paul Test Fournisseur',
    phone: '07 00 00 00 02',
    businessName: 'Dépôt Test Playwright',
    address: 'Marcory, Zone Test, Abidjan',
  },
  demoClient: {
    email: 'client@demo.com',
    password: 'demo123',
  },
  demoSupplier: {
    email: 'supplier@demo.com',
    password: 'demo123',
  },
};

export const testZones = [
  'Cocody',
  'Marcory',
  'Plateau',
  'Treichville',
  'Yopougon',
];
