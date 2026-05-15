import axios from 'axios';

async function testRegistration() {
  try {
    const response = await axios.post('http://localhost:3000/auth/register', {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      companyName: 'Test Company'
    });
    console.log('Registration Success:', response.data);
  } catch (error: any) {
    console.error('Registration Failed:', error.response?.status, error.response?.data || error.message);
  }
}

testRegistration();
