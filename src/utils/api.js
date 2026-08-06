import { safeStorage } from './storage';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api`;

export const fetchAPI = async (endpoint, options = {}) => {
  const token = safeStorage.getItem('staff_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: `Server response error (${response.status}). Please try again or check server.` };
    }

    if (!response.ok) {
      throw new Error(data.error || `API Request failed (${response.status})`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${endpoint}]:`, err.message);
    throw err;
  }
};
