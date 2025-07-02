const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'john@sharp.com',
      password: 'sharp123'
    });
    return response.data.accessToken;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    throw error;
  }
}

async function testPhoneUniquenessWithFreshData() {
  console.log('🔍 Fresh Phone Uniqueness Test\n');
  
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}` };
  
  const timestamp = Date.now();
  const testPhone = `+1${timestamp.toString().slice(-9)}`; // Use timestamp for unique phone
  const testUsers = [
    {
      email: `freshtest1-${timestamp}@example.com`,
      password: 'password123',
      username: 'Fresh Test User 1',
      firstName: 'Fresh',
      lastName: 'Test1',
      role: 'ADMIN',
      phoneNumber: testPhone
    },
    {
      email: `freshtest2-${timestamp}@example.com`,
      password: 'password123',
      username: 'Fresh Test User 2',
      firstName: 'Fresh',
      lastName: 'Test2',
      role: 'ADMIN',
      phoneNumber: testPhone // Same phone number - should be blocked
    }
  ];

  try {
    console.log(`Using unique phone number: ${testPhone}`);
    console.log(`Using unique emails: ${testUsers[0].email} and ${testUsers[1].email}\n`);

    // Create first user
    console.log('1. Creating first user...');
    const firstUser = await axios.post(`${API_BASE_URL}/users`, testUsers[0], { headers });
    console.log('✅ First user created successfully:');
    console.log('   - ID:', firstUser.data.data.id);
    console.log('   - Email:', firstUser.data.data.email);
    console.log('   - Phone:', firstUser.data.data.phoneNumber);

    // Try to create second user with same phone number
    console.log('\n2. Attempting to create second user with same phone...');
    try {
      const secondUser = await axios.post(`${API_BASE_URL}/users`, testUsers[1], { headers });
      console.log('❌ PHONE VALIDATION FAILED! Second user was created:');
      console.log('   - ID:', secondUser.data.data.id);
      console.log('   - Email:', secondUser.data.data.email);
      console.log('   - Phone:', secondUser.data.data.phoneNumber);
      
      // Clean up both users
      console.log('\n🧹 Cleaning up both users...');
      await axios.put(`${API_BASE_URL}/users/${firstUser.data.data.id}/soft-delete`, {}, { headers });
      await axios.put(`${API_BASE_URL}/users/${secondUser.data.data.id}/soft-delete`, {}, { headers });
      
      return false; // Test failed
      
    } catch (error) {
      console.log('✅ PHONE VALIDATION WORKED! Second user creation was blocked:');
      console.log('   - Status:', error.response?.status);
      console.log('   - Message:', error.response?.data?.message);
      
      // Clean up first user only
      console.log('\n🧹 Cleaning up first user...');
      await axios.put(`${API_BASE_URL}/users/${firstUser.data.data.id}/soft-delete`, {}, { headers });
      
      return true; // Test passed
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  try {
    const result = await testPhoneUniquenessWithFreshData();
    
    if (result) {
      console.log('\n🎉 Phone uniqueness validation is working correctly!');
    } else {
      console.log('\n❌ Phone uniqueness validation is NOT working - needs debugging');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPhoneUniquenessWithFreshData }; 