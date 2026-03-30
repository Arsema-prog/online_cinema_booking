import axios from "axios";

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

// Create a dedicated client for registration
const registrationClient = axios.create({
  baseURL: 'http://localhost:8084',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add detailed request interceptor
registrationClient.interceptors.request.use(
  (config) => {
    console.log('═══════════════════════════════════════');
    console.log('📤 OUTGOING REQUEST');
    console.log('═══════════════════════════════════════');
    console.log('URL:', config.baseURL + config.url);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Headers:', JSON.stringify(config.headers, null, 2));
    console.log('Body:', JSON.stringify(config.data, null, 2));
    console.log('═══════════════════════════════════════');
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add detailed response interceptor
registrationClient.interceptors.response.use(
  (response) => {
    console.log('═══════════════════════════════════════');
    console.log('📥 INCOMING RESPONSE');
    console.log('═══════════════════════════════════════');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Data:', response.data);
    console.log('═══════════════════════════════════════');
    return response;
  },
  (error) => {
    console.log('═══════════════════════════════════════');
    console.log('❌ ERROR RESPONSE');
    console.log('═══════════════════════════════════════');
    
    if (error.response) {
      // Server responded with error status
      console.log('Server Response Error:');
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.log('No Response Received:');
      console.log('Request:', error.request);
      console.log('Error Message:', error.message);
      
      // Check if it's a CORS error
      if (error.message === 'Network Error') {
        console.log('⚠️  CORS ERROR DETECTED!');
        console.log('This usually means:');
        console.log('1. Backend is not sending CORS headers');
        console.log('2. Preflight OPTIONS request failed');
        console.log('3. Backend is not configured to accept requests from this origin');
      }
    } else {
      // Request setup error
      console.log('Request Setup Error:', error.message);
    }
    
    console.log('Full Error Object:', error);
    console.log('═══════════════════════════════════════');
    
    return Promise.reject(error);
  }
);

export const registrationService = {
  register: async (userData: RegistrationData): Promise<void> => {
    try {
      console.log('🚀 STARTING REGISTRATION PROCESS');
      console.log('User Data:', { ...userData, password: '***' });
      
      const response = await registrationClient.post('/api/auth/register', userData);
      
      console.log('✅ REGISTRATION COMPLETED SUCCESSFULLY');
      return response.data;
    } catch (error: any) {
      console.error('❌ REGISTRATION FAILED');
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      
      let errorMessage = 'Registration failed';
      if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
        // Try to parse JSON from the string if it contains any
        try {
          const match = errorMessage.match(/\{.*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.errorMessage) errorMessage = parsed.errorMessage;
          }
        } catch (e) {}
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
};