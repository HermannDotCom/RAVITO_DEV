import { supabase } from '../lib/supabase';
import { mockProducts } from '../data/mockData';
import { demoAccounts } from '../data/demoAccounts';

export async function seedProducts() {
  console.log('Seeding products...');

  const products = mockProducts.map(product => ({
    reference: product.reference,
    name: product.name,
    category: product.category,
    brand: product.brand,
    crate_type: product.crateType,
    unit_price: product.unitPrice,
    crate_price: product.cratePrice,
    consign_price: product.consignPrice,
    description: product.description || null,
    alcohol_content: product.alcoholContent || null,
    volume: product.volume,
    is_active: product.isActive,
    image_url: product.imageUrl
  }));

  const { data, error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'reference' })
    .select();

  if (error) {
    console.error('Error seeding products:', error);
    return { success: false, error };
  }

  console.log(`✅ Successfully seeded ${data?.length || 0} products`);
  return { success: true, count: data?.length || 0 };
}

export async function seedDemoAccounts() {
  console.log('Seeding demo accounts...');

  const results = {
    success: [] as string[],
    failed: [] as string[]
  };

  for (const account of demoAccounts) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            name: account.name,
            role: account.role
          }
        }
      });

      if (authError || !authData.user) {
        console.error(`Failed to create auth user for ${account.email}:`, authError);
        results.failed.push(account.email);
        continue;
      }

      const userData = account.userData;
      const coordinates = userData.coordinates || { lat: 5.3364, lng: -4.0267 };

      const profileData: any = {
        id: authData.user.id,
        role: userData.role,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`,
        business_name: (userData as any).businessName || null,
        business_hours: (userData as any).businessHours || null,
        responsible_person: (userData as any).responsiblePerson || null,
        coverage_zone: (userData as any).coverageZone || null,
        delivery_capacity: (userData as any).deliveryCapacity || null,
        rating: userData.rating || 5.0,
        total_orders: userData.totalOrders || 0,
        is_active: userData.isActive,
        is_approved: userData.isApproved,
        approval_status: userData.approvalStatus,
        approved_at: userData.approvedAt?.toISOString() || null,
        rejected_at: userData.rejectedAt?.toISOString() || null,
        rejection_reason: userData.rejectionReason || null
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' });

      if (profileError) {
        console.error(`Failed to create profile for ${account.email}:`, profileError);
        results.failed.push(account.email);
      } else {
        console.log(`✅ Created account: ${account.email}`);
        results.success.push(account.email);
      }
    } catch (error) {
      console.error(`Exception creating account ${account.email}:`, error);
      results.failed.push(account.email);
    }
  }

  console.log(`\n✅ Successfully seeded ${results.success.length} demo accounts`);
  if (results.failed.length > 0) {
    console.log(`❌ Failed to seed ${results.failed.length} accounts:`, results.failed);
  }

  return results;
}

export async function seedDeliveryZones() {
  console.log('Seeding delivery zones...');

  const zones = [
    { commune_name: 'Cocody', is_active: true },
    { commune_name: 'Plateau', is_active: true },
    { commune_name: 'Marcory', is_active: true },
    { commune_name: 'Treichville', is_active: true },
    { commune_name: 'Adjamé', is_active: true },
    { commune_name: 'Yopougon', is_active: true },
    { commune_name: 'Abobo', is_active: true },
    { commune_name: 'Koumassi', is_active: true },
    { commune_name: 'Port-Bouët', is_active: true },
    { commune_name: 'Attecoube', is_active: true }
  ];

  const { data, error } = await supabase
    .from('delivery_zones')
    .upsert(zones, { onConflict: 'commune_name' })
    .select();

  if (error) {
    console.error('Error seeding delivery zones:', error);
    return { success: false, error };
  }

  console.log(`✅ Successfully seeded ${data?.length || 0} delivery zones`);
  return { success: true, count: data?.length || 0 };
}

export async function seedAll() {
  console.log('🚀 Starting database seeding...\n');

  const productResult = await seedProducts();
  const zoneResult = await seedDeliveryZones();
  const accountResult = await seedDemoAccounts();

  console.log('\n📊 Seeding Summary:');
  console.log(`Products: ${productResult.success ? '✅' : '❌'} ${productResult.success ? productResult.count + ' items' : 'Failed'}`);
  console.log(`Zones: ${zoneResult.success ? '✅' : '❌'} ${zoneResult.success ? zoneResult.count + ' items' : 'Failed'}`);
  console.log(`Accounts: ${accountResult.success.length} succeeded, ${accountResult.failed.length} failed`);
  console.log('\n✨ Database seeding complete!');
}

if (import.meta.url === new URL(import.meta.url).href) {
  seedAll().catch(console.error);
}
