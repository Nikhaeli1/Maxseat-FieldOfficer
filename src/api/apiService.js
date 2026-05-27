import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Change this to your FastAPI server's IP address on your local network.
// Example: 'http://192.168.1.100:8000'
export const BASE_URL = 'http://192.168.1.2:8000';

const TOKEN_KEY = '@maxseat_token';

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored bearer token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
export const saveToken  = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearToken = ()      => AsyncStorage.removeItem(TOKEN_KEY);
export const getToken   = ()      => AsyncStorage.getItem(TOKEN_KEY);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
/**
 * Authenticate a Field Enforcer.
 * @returns {{ token, username, full_name, badge, precinct, shift_status }}
 */
export const loginEnforcer = async (username, password) => {
  const res = await api.post('/api/mobile/login', { username, password });
  return res.data;
};

/**
 * Revoke the current bearer token on the server.
 */
export const logoutEnforcer = async () => {
  try {
    await api.post('/api/mobile/logout');
  } catch (_) {
    // Silently fail — clear local token regardless
  } finally {
    await clearToken();
  }
};

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
/**
 * Fetch all active violation dispatch orders.
 * @returns {{ dispatch_orders: DispatchOrder[], total: number }}
 */
export const fetchDispatchOrders = async () => {
  const res = await api.get('/api/mobile/dispatch');
  return res.data;
};

// ─── INTERCEPTION ─────────────────────────────────────────────────────────────
/**
 * Submit an interception report.
 * @param {string} plate    - PUV plate number
 * @param {string} action   - 'ticket' | 'warning' | 'apprehend'
 * @param {string} notes    - Officer remarks
 * @returns {{ serial, plate, action, message }}
 */
export const submitInterception = async (plate, action, notes) => {
  const res = await api.post('/api/mobile/intercept', { plate, action, notes });
  return res.data;
};

export default api;