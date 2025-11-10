/**
 * Simple API Test Script
 * Run with: node test-api.js
 * 
 * This script tests the basic API endpoints
 * Make sure your server is running first!
 */

const BASE_URL = 'http://localhost:5000/api';

// Store token for authenticated requests
let authToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  await apiCall('GET', '/health');
}

async function testRegister() {
  console.log('\n=== Testing User Registration ===');
  const email = `test${Date.now()}@example.com`;
  const result = await apiCall('POST', '/auth/register', {
    name: 'Test User',
    email: email,
    password: 'password123',
    phone: '+1234567890'
  });

  if (result && result.data.success && result.data.token) {
    authToken = result.data.token;
    console.log('\n✅ Registration successful! Token saved.');
  }
}

async function testLogin() {
  console.log('\n=== Testing User Login ===');
  // First register a user
  const email = `test${Date.now()}@example.com`;
  await apiCall('POST', '/auth/register', {
    name: 'Test User',
    email: email,
    password: 'password123'
  });

  // Then login
  const result = await apiCall('POST', '/auth/login', {
    email: email,
    password: 'password123'
  });

  if (result && result.data.success && result.data.token) {
    authToken = result.data.token;
    console.log('\n✅ Login successful! Token saved.');
  }
}

async function testGetMe() {
  console.log('\n=== Testing Get Current User (Protected) ===');
  if (!authToken) {
    console.log('❌ No token available. Please run login/register first.');
    return;
  }
  await apiCall('GET', '/auth/me', null, authToken);
}

async function testGetProducts() {
  console.log('\n=== Testing Get All Products ===');
  await apiCall('GET', '/products');
}

async function testGetCategories() {
  console.log('\n=== Testing Get All Categories ===');
  await apiCall('GET', '/categories');
}

async function testGetCart() {
  console.log('\n=== Testing Get Cart (Protected) ===');
  if (!authToken) {
    console.log('❌ No token available. Please run login/register first.');
    return;
  }
  await apiCall('GET', '/cart', null, authToken);
}

async function testGetOrders() {
  console.log('\n=== Testing Get Orders (Protected) ===');
  if (!authToken) {
    console.log('❌ No token available. Please run login/register first.');
    return;
  }
  await apiCall('GET', '/orders', null, authToken);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  console.log('Make sure your server is running on http://localhost:5000\n');

  await testHealthCheck();
  await testRegister();
  await testLogin();
  await testGetMe();
  await testGetProducts();
  await testGetCategories();
  await testGetCart();
  await testGetOrders();

  console.log('\n✅ All tests completed!');
  console.log('\nNote: Some tests may fail if:');
  console.log('- Database is empty (no products/categories)');
  console.log('- You need admin access for certain endpoints');
  console.log('- Server is not running');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or install node-fetch');
  console.log('Install: npm install node-fetch');
  process.exit(1);
}

// Run tests
runAllTests().catch(console.error);

