const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTenantHierarchy() {
  console.log('🧪 Testing Tenant Hierarchy System\n');

  try {
    // Step 1: Login as Super Admin (john@sharp.com)
    console.log('1. Logging in as Super Admin (john@sharp.com)...');
    const superAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john@sharp.com',
      password: 'sharp123'
    });
    
    const superAdminToken = superAdminLogin.data.accessToken;
    const superAdmin = superAdminLogin.data.user;
    
    console.log(`✅ Super Admin logged in:`, {
      role: superAdmin.role,
      tenantId: superAdmin.tenantId,
      email: superAdmin.email
    });

    // Step 2: Super Admin creates an Admin (tenant admin)
    console.log('\n2. Super Admin creating a tenant admin...');
    const newAdmin = await axios.post(`${BASE_URL}/users`, {
      email: 'admin1@tenant1.com',
      password: 'Admin123',
      username: 'Admin One',
      firstName: 'Admin',
      lastName: 'One',
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    console.log(`✅ Tenant Admin created:`, {
      role: newAdmin.data.data.role,
      tenantId: newAdmin.data.data.tenantId,
      createdBy: newAdmin.data.data.createdBy,
      email: newAdmin.data.data.email
    });

    // Step 3: Login as the new Admin
    console.log('\n3. Logging in as Tenant Admin...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin1@tenant1.com',
      password: 'Admin123'
    });

    const adminToken = adminLogin.data.accessToken;
    const admin = adminLogin.data.user;
    
    console.log(`✅ Tenant Admin logged in:`, {
      role: admin.role,
      tenantId: admin.tenantId,
      email: admin.email
    });

    // Step 4: Tenant Admin creates a Sales Rep
    console.log('\n4. Tenant Admin creating a sales rep...');
    const newSalesRep = await axios.post(`${BASE_URL}/users`, {
      email: 'sales1@tenant1.com',
      password: 'Sales123',
      username: 'Sales One',
      firstName: 'Sales',
      lastName: 'One',
      role: 'SALES_REP'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log(`✅ Sales Rep created:`, {
      role: newSalesRep.data.data.role,
      tenantId: newSalesRep.data.data.tenantId,
      createdBy: newSalesRep.data.data.createdBy,
      email: newSalesRep.data.data.email
    });

    // Step 5: Test visibility - Super Admin view
    console.log('\n5. Testing user visibility - Super Admin view...');
    const superAdminUsers = await axios.get(`${BASE_URL}/users/tenant-users`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    
    console.log(`✅ Super Admin sees ${superAdminUsers.data.data.length} users:`);
    superAdminUsers.data.data.forEach(user => {
      console.log(`   - ${user.email} (${user.role}, tenant: ${user.tenantId || 'null'})`);
    });

    // Step 6: Test visibility - Admin view
    console.log('\n6. Testing user visibility - Tenant Admin view...');
    const adminUsers = await axios.get(`${BASE_URL}/users/tenant-users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Tenant Admin sees ${adminUsers.data.data.length} users:`);
    adminUsers.data.data.forEach(user => {
      console.log(`   - ${user.email} (${user.role}, tenant: ${user.tenantId || 'null'})`);
    });

    // Step 7: Test deletion restrictions - Admin trying to delete another admin
    console.log('\n7. Testing deletion restrictions...');
    try {
      await axios.put(`${BASE_URL}/users/${newAdmin.data.data.userId}/soft-delete`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ ERROR: Admin should not be able to delete themselves');
    } catch (error) {
      console.log('✅ Correctly blocked: Admin cannot delete themselves');
    }

    // Step 8: Super Admin deleting tenant admin
    console.log('\n8. Super Admin deleting tenant admin...');
    const deleteResult = await axios.put(`${BASE_URL}/users/${newAdmin.data.data.userId}/soft-delete`, {}, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    
    console.log('✅ Super Admin successfully deleted tenant admin');

    console.log('\n🎉 Tenant Hierarchy Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTenantHierarchy(); 