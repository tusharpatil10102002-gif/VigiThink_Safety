// Centralized Configuration

export const API_BASE_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5002/api'
    : `${window.location.origin}/vigithinksafety-api`;
