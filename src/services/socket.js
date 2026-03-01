/**
 * Polling-based real-time service — replaces Socket.IO for Vercel deployments.
 * Same public API as the old SocketService so consuming components need no changes.
 */
import { API_BASE_URL } from '../constants/config';
import { Platform } from 'react-native';

let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const getToken = async () => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('auth_token');
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
};

const apiFetch = async (path) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Poll ${path} failed: ${res.status}`);
  return res.json();
};

class PollingService {
  constructor() {
    this._listeners = {};
    this._intervals = {};
    this._bookingId = null;
    this._lastBookingStatus = null;
    this._lastLocationTime = null;
    this._lastNotifId = null;
    this._connected = false;
  }

  connect(token) {
    if (this._connected) return;
    this._connected = true;
    console.log('[Poll] Service connected');
    this._startNotificationPoll();
  }

  disconnect() {
    this._connected = false;
    Object.values(this._intervals).forEach(clearInterval);
    this._intervals = {};
    this._bookingId = null;
    this._lastBookingStatus = null;
    this._lastLocationTime = null;
    this._lastNotifId = null;
    console.log('[Poll] Service disconnected');
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (event === 'location_update') this._postLocation(data);
  }

  joinBooking(bookingId) {
    this._bookingId = bookingId;
    this._startBookingPoll(bookingId);
  }

  leaveBooking(bookingId) {
    if (this._bookingId === bookingId) {
      this._bookingId = null;
      clearInterval(this._intervals['booking']);
      delete this._intervals['booking'];
    }
  }

  _fire(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.warn('[Poll] listener error:', e); }
    });
  }

  _startBookingPoll(bookingId) {
    clearInterval(this._intervals['booking']);
    this._pollBooking(bookingId);
    this._intervals['booking'] = setInterval(() => this._pollBooking(bookingId), 5000);
  }

  async _pollBooking(bookingId) {
    try {
      const { booking, location } = await apiFetch(`/poll/booking/${bookingId}`);
      if (booking.status !== this._lastBookingStatus) {
        this._lastBookingStatus = booking.status;
        this._fire('booking_status_update', { booking });
      }
      if (location && location.recorded_at !== this._lastLocationTime) {
        this._lastLocationTime = location.recorded_at;
        this._fire('live_location', {
          booking_id: bookingId,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          speed: location.speed,
          heading: location.heading,
          timestamp: location.recorded_at,
        });
      }
    } catch (e) {
      console.warn('[Poll] booking poll error:', e.message);
    }
  }

  _startNotificationPoll() {
    clearInterval(this._intervals['notifications']);
    this._pollNotifications();
    this._intervals['notifications'] = setInterval(() => this._pollNotifications(), 10000);
  }

  async _pollNotifications() {
    try {
      const { notifications } = await apiFetch('/poll/notifications');
      if (!notifications?.length) return;
      const latest = notifications[0];
      if (latest && latest.id !== this._lastNotifId) {
        this._lastNotifId = latest.id;
        this._fire('new_notification', latest);
      }
    } catch {
      // silent — user may not be logged in yet
    }
  }

  async _postLocation(data) {
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/bookings/${data.booking_id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('[Poll] location post error:', e.message);
    }
  }
}

export const socketService = new PollingService();
