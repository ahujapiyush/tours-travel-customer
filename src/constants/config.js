import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
  web: 'https://backend-psi-two-85.vercel.app/api',
  ios: 'https://backend-psi-two-85.vercel.app/api',
  default: 'https://backend-psi-two-85.vercel.app/api',
});

// ── For local development swap to: ──
// web: 'http://localhost:5001/api',
// ios: 'http://192.168.31.133:5001/api',
// default: 'http://10.0.2.2:5001/api',

export const SOCKET_URL = 'https://backend-psi-two-85.vercel.app';

export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B', icon: 'time' },
  { value: 'confirmed', label: 'Confirmed', color: '#3B82F6', icon: 'checkmark-circle' },
  { value: 'assigned', label: 'Driver Assigned', color: '#8B5CF6', icon: 'person' },
  { value: 'in_progress', label: 'In Progress', color: '#10B981', icon: 'car' },
  { value: 'completed', label: 'Completed', color: '#059669', icon: 'checkmark-done' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444', icon: 'close-circle' },
];

export const FUEL_ICONS = {
  Petrol: 'flame',
  Diesel: 'water',
  CNG: 'leaf',
  Electric: 'flash',
  Hybrid: 'sync',
};
