// API Configuration
export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: 'http://localhost:5000/api/v1',
  
  // Frontend URL (for development)
  FRONTEND_URL: 'http://localhost:5173',
};

// Environment-based configuration
export const getApiBaseUrl = () => {
  // Check if environment variable is set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to default backend URL
  return API_CONFIG.BASE_URL;
};
