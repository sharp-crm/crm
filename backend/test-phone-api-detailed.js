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

async function testPhoneUniquenessDetailed() {
  console.log('🔍 Detailed Phone Uniqueness Test\n');
  
  const token = await getAuthToken();
  const headers = { Authorization: `Bearer ${token}` };
  
  const testPhone = '+1111222333';
  const testUsers = [
    {
      email: 'phonetest1@detailed.com',
      password: 'password123',
      username: 'Phone Test User 1',
      firstName: 'Phone',
      lastName: 'Test1',
      role: 'ADMIN',
      phoneNumber: testPhone
    },
    {
      email: 'phonetest2@detailed.com',
      password: 'password123',
      username: 'Phone Test User 2',
      firstName: 'Phone',
      lastName: 'Test2',
      role: 'ADMIN',
      phoneNumber: testPhone // Same phone number
    }
  ];

  try {
    // Create first user
    console.log('1. Creating first user with phone:', testPhone);
    const firstUser = await axios.post(`${API_BASE_URL}/users`, testUsers[0], { headers });
    console.log('✅ First user created successfully:');
    console.log('   - ID:', firstUser.data.data.id);
    console.log('   - Email:', firstUser.data.data.email);
    console.log('   - Phone:', firstUser.data.data.phoneNumber);

    // Try to create second user with same phone number
    console.log('\n2. Attempting to create second user with same phone:', testPhone);
    try {
      const secondUser = await axios.post(`${API_BASE_URL}/users`, testUsers[1], { headers });
      console.log('❌ Second user was created! This should not happen.');
      console.log('   - ID:', secondUser.data.data.id);
      console.log('   - Email:', secondUser.data.data.email);
      console.log('   - Phone:', secondUser.data.data.phoneNumber);
      
      // Clean up both users
      console.log('\n🧹 Cleaning up both users...');
      await axios.put(`${API_BASE_URL}/users/${firstUser.data.data.id}/soft-delete`, {}, { headers });
      await axios.put(`${API_BASE_URL}/users/${secondUser.data.data.id}/soft-delete`, {}, { headers });
      
    } catch (error) {
      console.log('✅ Second user creation was blocked as expected!');
      console.log('   - Status:', error.response?.status);
      console.log('   - Message:', error.response?.data?.message);
      
      // Clean up first user only
      console.log('\n🧹 Cleaning up first user...');
      await axios.put(`${API_BASE_URL}/users/${firstUser.data.data.id}/soft-delete`, {}, { headers });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function main() {
  try {
    await testPhoneUniquenessDetailed();
    console.log('\n✅ Detailed phone uniqueness test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPhoneUniquenessDetailed }; 