import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestAccount {
  email: string;
  password: string;
  role: 'admin' | 'client' | 'supplier';
  name: string;
  phone: string;
  address: string;
  businessName?: string;
  businessHours?: string;
  responsiblePerson?: string;
  coverageZone?: string;
  deliveryCapacity?: 'truck' | 'tricycle' | 'motorcycle';
}

const testAccounts: TestAccount[] = [
  {
    email: 'admin@distri-night.ci',
    password: 'Admin@2025!',
    role: 'admin',
    name: 'Kouassi Administrateur',
    phone: '+225 07 00 00 00 01',
    address: 'Siège DISTRI-NIGHT, Plateau, Abidjan',
  },
  {
    email: 'client1@test.ci',
    password: 'Client@2025!',
    role: 'client',
    name: 'Jean-Marc Yao',
    phone: '+225 07 11 22 33 44',
    address: 'Maquis Chez Fatou, Cocody Riviera',
    businessName: 'Maquis Chez Fatou',
    businessHours: '18:00 - 06:00',
    responsiblePerson: 'Jean-Marc Yao',
  },
  {
    email: 'client2@test.ci',
    password: 'Client@2025!',
    role: 'client',
    name: 'Adjoua Marie',
    phone: '+225 07 22 33 44 55',
    address: 'Bar Le Griot d\'Or, Marcory Zone 4',
    businessName: 'Le Griot d\'Or',
    businessHours: '17:00 - 03:00',
    responsiblePerson: 'Adjoua Marie',
  },
  {
    email: 'client3@test.ci',
    password: 'Client@2025!',
    role: 'client',
    name: 'Koffi Patrick',
    phone: '+225 07 33 44 55 66',
    address: 'Restaurant La Terrasse, Plateau',
    businessName: 'Restaurant La Terrasse',
    businessHours: '19:00 - 02:00',
    responsiblePerson: 'Koffi Patrick',
  },
  {
    email: 'supplier1@test.ci',
    password: 'Supplier@2025!',
    role: 'supplier',
    name: 'Moussa Traoré',
    phone: '+225 07 44 55 66 77',
    address: 'Dépôt du Plateau, Avenue Franchet d\'Esperey',
    businessName: 'Dépôt Traoré & Fils',
    businessHours: '18:00 - 08:00',
    coverageZone: 'Plateau, Marcory, Treichville',
    deliveryCapacity: 'truck',
  },
  {
    email: 'supplier2@test.ci',
    password: 'Supplier@2025!',
    role: 'supplier',
    name: 'Ibrahim Koné',
    phone: '+225 07 55 66 77 88',
    address: 'Dépôt Cocody, Riviera Palmeraie',
    businessName: 'Dépôt Express Cocody',
    businessHours: '17:00 - 07:00',
    coverageZone: 'Cocody, Angré, Riviera',
    deliveryCapacity: 'tricycle',
  },
  {
    email: 'supplier3@test.ci',
    password: 'Supplier@2025!',
    role: 'supplier',
    name: 'Sékou Diaby',
    phone: '+225 07 66 77 88 99',
    address: 'Dépôt Yopougon, Sideci',
    businessName: 'Dépôt Rapid\'Yop',
    businessHours: '18:00 - 06:00',
    coverageZone: 'Yopougon, Abobo, Adjamé',
    deliveryCapacity: 'motorcycle',
  },
];

async function createTestAccounts() {
  console.log('🚀 Création des comptes de test DISTRI-NIGHT...\n');

  for (const account of testAccounts) {
    try {
      console.log(`📧 Création du compte ${account.role}: ${account.email}`);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          name: account.name,
          role: account.role,
        },
      });

      if (authError) {
        console.error(`   ❌ Erreur auth: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        console.error('   ❌ Utilisateur non créé');
        continue;
      }

      const profileData: any = {
        id: authData.user.id,
        role: account.role,
        name: account.name,
        phone: account.phone,
        address: account.address,
        is_active: true,
        is_approved: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      };

      if (account.role === 'client' && account.businessName) {
        profileData.business_name = account.businessName;
        profileData.business_hours = account.businessHours;
        profileData.responsible_person = account.responsiblePerson;
      }

      if (account.role === 'supplier') {
        profileData.business_name = account.businessName;
        profileData.business_hours = account.businessHours;
        profileData.coverage_zone = account.coverageZone;
        profileData.delivery_capacity = account.deliveryCapacity;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error(`   ❌ Erreur profil: ${profileError.message}`);
        continue;
      }

      console.log(`   ✅ Compte créé avec succès!`);
      console.log(`      Email: ${account.email}`);
      console.log(`      Mot de passe: ${account.password}`);
      console.log(`      Rôle: ${account.role.toUpperCase()}\n`);

    } catch (error) {
      console.error(`   ❌ Erreur inattendue:`, error);
    }
  }

  console.log('\n✅ Processus de création terminé!');
  console.log('\n📋 RÉCAPITULATIF DES COMPTES:\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 ADMINISTRATEUR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const admin = testAccounts.find(a => a.role === 'admin');
  if (admin) {
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${admin.password}`);
    console.log(`Nom:      ${admin.name}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 CLIENTS (Gérants de bars/maquis)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testAccounts.filter(a => a.role === 'client').forEach((client, i) => {
    console.log(`\n${i + 1}. ${client.businessName}`);
    console.log(`   Email:    ${client.email}`);
    console.log(`   Password: ${client.password}`);
    console.log(`   Gérant:   ${client.name}`);
    console.log(`   Adresse:  ${client.address}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚚 FOURNISSEURS (Dépôts de boissons)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testAccounts.filter(a => a.role === 'supplier').forEach((supplier, i) => {
    console.log(`\n${i + 1}. ${supplier.businessName}`);
    console.log(`   Email:     ${supplier.email}`);
    console.log(`   Password:  ${supplier.password}`);
    console.log(`   Gérant:    ${supplier.name}`);
    console.log(`   Zone:      ${supplier.coverageZone}`);
    console.log(`   Véhicule:  ${supplier.deliveryCapacity}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createTestAccounts().catch(console.error);
