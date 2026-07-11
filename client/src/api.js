const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  const host = window.location.hostname;
  const port = window.location.port;
  
  const isLocal = host === 'localhost' || 
                  host === '127.0.0.1' || 
                  host.startsWith('192.168.') || 
                  host.startsWith('10.') || 
                  host.startsWith('172.');
                  
  if (isLocal && port !== '4000') {
    return `http://${host}:4000/api`;
  }
  return '/api';
};

export const API_URL = getApiUrl();
const TOKEN_KEY = 'values_session_token';
const USER_KEY = 'values_session_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiCall(endpoint, method = 'GET', body = null) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    clearSession();
    window.location.reload(); // Force user back to login
    throw new Error('Authentication required');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export async function login(email, password) {
  const data = await apiCall('/auth/login', 'POST', { email, password });
  if (data?.token) {
    setSession(data.token, data.user);
  }
  return data;
}

export function logout() {
  clearSession();
  window.location.reload();
}

export async function apiUpload(endpoint, file) {
  const token = getToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (response.status === 401) {
    clearSession();
    window.location.reload();
    throw new Error('Authentication required');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export async function updateProfile(username, password) {
  const data = await apiCall('/auth/profile', 'PUT', { username, password });
  if (data?.token) {
    setSession(data.token, data.user);
  }
  return data;
}
