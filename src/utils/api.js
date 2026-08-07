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
    if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message.includes('fetch')) {
      try {
        const directUrl = endpoint.startsWith('http') ? endpoint : `http://localhost:5000/api${endpoint}`;
        const fallbackRes = await fetch(directUrl, {
          ...options,
          headers,
        });
        const contentType = fallbackRes.headers.get('content-type');
        let fallbackData;
        if (contentType && contentType.includes('application/json')) {
          fallbackData = await fallbackRes.json();
        } else {
          const txt = await fallbackRes.text();
          fallbackData = { error: `Server error (${fallbackRes.status})` };
        }
        if (!fallbackRes.ok) {
          throw new Error(fallbackData.error || `API Error (${fallbackRes.status})`);
        }
        return fallbackData;
      } catch (fallbackErr) {
        if (fallbackErr.message && fallbackErr.message !== 'Failed to fetch' && !fallbackErr.message.includes('fetch')) {
          throw fallbackErr;
        }
      }
      throw new Error('Connection lost. Please make sure backend server is running on http://localhost:5000.');
    }
    throw err;
  }
};
