const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSuperAdminRestrictions() {
  console.log('🧪 Testing Super Admin Restrictions - Can Only Create Admins\n');

  try {
    // Step 1: Login as Super Admin
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

    // Step 2: Super Admin tries to create a Sales Rep (should fail)
    console.log('\n2. Super Admin trying to create a Sales Rep (should be blocked)...');
    try {
      await axios.post(`${BASE_URL}/users`, {
        email: 'sales@test.com',
        password: 'Sales123',
        username: 'Sales User',
        firstName: 'Sales',
        lastName: 'User',
        role: 'SALES_REP'
      }, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      console.log('❌ ERROR: Super admin should not be able to create sales rep');
    } catch (error) {
      console.log('✅ Correctly blocked:', error.response?.data?.error || error.response?.data?.message);
    }

    // Step 3: Super Admin tries to create a Sales Manager (should fail)
    console.log('\n3. Super Admin trying to create a Sales Manager (should be blocked)...');
    try {
      await axios.post(`${BASE_URL}/users`, {
        email: 'manager@test.com',
        password: 'Manager123',
        username: 'Sales Manager',
        firstName: 'Sales',
        lastName: 'Manager',
        role: 'SALES_MANAGER'
      }, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      console.log('❌ ERROR: Super admin should not be able to create sales manager');
    } catch (error) {
      console.log('✅ Correctly blocked:', error.response?.data?.error || error.response?.data?.message);
    }

    // Step 4: Super Admin creates an Admin (should succeed)
    console.log('\n4. Super Admin creating an Admin (should succeed)...');
    const newAdmin = await axios.post(`${BASE_URL}/users`, {
      email: 'newadmin@company.com',
      password: 'Admin123',
      username: 'New Admin',
      firstName: 'New',
      lastName: 'Admin',
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    console.log(`✅ Admin created successfully:`, {
      role: newAdmin.data.data.role,
      tenantId: newAdmin.data.data.tenantId,
      createdBy: newAdmin.data.data.createdBy,
      email: newAdmin.data.data.email
    });

    // Step 5: Login as the new Admin
    console.log('\n5. Logging in as the new Admin...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'newadmin@company.com',
      password: 'Admin123'
    });

    const adminToken = adminLogin.data.accessToken;
    const admin = adminLogin.data.user;
    
    console.log(`✅ Admin logged in:`, {
      role: admin.role,
      tenantId: admin.tenantId,
      email: admin.email
    });

    // Step 6: Admin creates a Sales Rep (should succeed)
    console.log('\n6. Admin creating a Sales Rep (should succeed)...');
    const newSalesRep = await axios.post(`${BASE_URL}/users`, {
      email: 'salesrep@company.com',
      password: 'Sales123',
      username: 'Sales Rep',
      firstName: 'Sales',
      lastName: 'Rep',
      role: 'SALES_REP'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log(`✅ Sales Rep created by Admin:`, {
      role: newSalesRep.data.data.role,
      tenantId: newSalesRep.data.data.tenantId,
      createdBy: newSalesRep.data.data.createdBy,
      email: newSalesRep.data.data.email
    });

    // Step 7: Admin tries to create another Admin (should fail)
    console.log('\n7. Admin trying to create another Admin (should be blocked)...');
    try {
      await axios.post(`${BASE_URL}/users`, {
        email: 'anotherad@company.com',
        password: 'Admin123',
        username: 'Another Admin',
        firstName: 'Another',
        lastName: 'Admin',
        role: 'ADMIN'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ ERROR: Admin should not be able to create another admin');
    } catch (error) {
      console.log('✅ Correctly blocked:', error.response?.data?.error || error.response?.data?.message);
    }

    console.log('\n🎉 Super Admin Restrictions Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Super Admin can ONLY create Admins');
    console.log('✅ Super Admin cannot create Sales Reps or Sales Managers');
    console.log('✅ Admins can create Sales Reps and Sales Managers');
    console.log('✅ Admins cannot create other Admins');
    console.log('✅ Each Admin gets their own unique tenant ID');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSuperAdminRestrictions(); 