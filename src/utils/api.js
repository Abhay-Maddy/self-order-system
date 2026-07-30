const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api`;

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('staff_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    throw new Error(`Backend server unreachable or VITE_API_URL not set (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
};
