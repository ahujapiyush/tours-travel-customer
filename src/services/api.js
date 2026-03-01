import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
api.interceptors.request.use(async (config) => {
  try {
    let token;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('auth_token');
    } else {
      token = await SecureStore.getItemAsync('auth_token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — handled by AuthContext
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updatePushToken: (token) => api.put('/auth/push-token', { push_token: token }),
};

// Cars API
export const carsAPI = {
  getCars: (params) => api.get('/cars', { params }),
  getCarById: (id) => api.get(`/cars/${id}`),
  getCategories: () => api.get('/cars/categories'),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  rateBooking: (id, data) => api.post(`/bookings/${id}/rate`, data),
};

// Locations API
export const locationsAPI = {
  getStates: () => api.get('/locations/states'),
  getCities: (stateId) => api.get('/locations/cities', { params: { state_id: stateId } }),
};

// Customer API
export const customerAPI = {
  getFavorites: () => api.get('/customer/favorites'),
  addFavorite: (carId) => api.post('/customer/favorites', { car_id: carId }),
  removeFavorite: (carId) => api.delete(`/customer/favorites/${carId}`),
  validateCoupon: (code) => api.post('/customer/validate-coupon', { code }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
