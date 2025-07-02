require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/api';

async function debugTokenSystem() {
  console.log('🔍 Debugging Token System\n');

  try {
    // Login as Super Admin
    console.log('1. Logging in as Super Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john@sharp.com',
      password: 'sharp123'
    });
    
    const { accessToken, user } = loginResponse.data;
    console.log('✅ Login Response User:', user);
    
    // Decode the token to see what's inside
    const decoded = jwt.decode(accessToken);
    console.log('🔍 Decoded Token:', decoded);
    
    // Test authenticated endpoint
    console.log('\n2. Testing authenticated endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Profile Response:', profileResponse.data.data);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugTokenSystem(); 