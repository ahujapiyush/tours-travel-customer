import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { bookingsAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { showAlert } from '../../utils/alert';

let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch {}
}

export default function TrackBookingScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    fetchBooking();
    socketService.joinBooking(bookingId);

    socketService.on('driver_location', handleDriverLocation);
    socketService.on('live_location', handleDriverLocation);
    socketService.on('eta_update', handleEta);
    socketService.on('booking_update', handleBookingUpdate);

    return () => {
      socketService.leaveBooking(bookingId);
      socketService.off('driver_location', handleDriverLocation);
      socketService.off('live_location', handleDriverLocation);
      socketService.off('eta_update', handleEta);
      socketService.off('booking_update', handleBookingUpdate);
    };
  }, []);

  const fetchBooking = async () => {
    try {
      const { data } = await bookingsAPI.getBookingById(bookingId);
      const b = data?.booking || data;
      setBooking(b);
      if (b.driver_latitude && b.driver_longitude) {
        setDriverLocation({
          latitude: parseFloat(b.driver_latitude),
          longitude: parseFloat(b.driver_longitude),
        });
      }
    } catch {
      showAlert('Error', 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLocation = (data) => {
    if (data.booking_id === bookingId || data.bookingId === bookingId) {
      const loc = {
        latitude: parseFloat(data.latitude || data.lat),
        longitude: parseFloat(data.longitude || data.lng),
      };
      setDriverLocation(loc);
      mapRef.current?.animateToRegion({
        ...loc,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleEta = (data) => {
    if (data.booking_id === bookingId) {
      setEta(data.eta || data.estimated_time);
    }
  };

  const handleBookingUpdate = (data) => {
    if (data.booking_id === bookingId) {
      setBooking(prev => prev ? { ...prev, ...data } : prev);
    }
  };

  const handleCallDriver = () => {
    if (booking?.driver_phone) {
      Linking.openURL(`tel:${booking.driver_phone}`);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!booking) return null;

  // Default to Mumbai area if no coordinates
  const defaultRegion = {
    latitude: driverLocation?.latitude || 19.076,
    longitude: driverLocation?.longitude || 72.8777,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const isNative = Platform.OS !== 'web' && MapView;

  return (
    <View style={[styles.container, Platform.OS !== 'web' && { paddingTop: insets.top }]}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        {isNative ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={defaultRegion}
            showsUserLocation
          >
            {driverLocation && (
              <Marker
                coordinate={driverLocation}
                title="Driver"
                description={booking.driver_name || 'Your driver'}
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="car" size={18} color="#FFF" />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.webMapFallback}>
            <Ionicons name="map-outline" size={48} color={COLORS.accent} />
            <Text style={styles.webMapText}>Live Tracking</Text>
            {driverLocation ? (
              <Text style={styles.webMapCoords}>
                Driver: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.webMapCoords}>Waiting for driver location...</Text>
            )}
          </View>
        )}
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* ETA */}
        {eta && (
          <View style={styles.etaBar}>
            <Ionicons name="time-outline" size={18} color={COLORS.accent} />
            <Text style={styles.etaText}>Arriving in <Text style={styles.etaBold}>{eta}</Text></Text>
          </View>
        )}

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.statusText}>
            {booking.status?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Route Info */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <Ionicons name="radio-button-on" size={14} color={COLORS.success} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.pickup_address || 'Pickup'}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color={COLORS.danger} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.drop_address || 'Drop'}</Text>
          </View>
        </View>

        {/* Driver Info */}
        {booking.driver_name && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>{booking.driver_name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{booking.driver_name}</Text>
              <Text style={styles.driverCar}>{booking.car_name || 'Assigned Car'}</Text>
            </View>
            {booking.driver_phone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color={COLORS.success} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {!driverLocation && (
          <View style={styles.waitingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.waitingText}>Waiting for live location updates...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  webMapFallback: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt, gap: 12,
  },
  webMapText: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text },
  webMapCoords: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  driverMarker: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  infoPanel: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl, padding: SIZES.padding, paddingBottom: 30,
    borderTopWidth: 1, borderColor: COLORS.divider,
  },
  etaBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.accentLight,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 14,
  },
  etaText: { fontSize: SIZES.base, color: COLORS.text },
  etaBold: { fontWeight: '700', color: COLORS.accent, fontSize: SIZES.lg },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  routeCard: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, marginBottom: 14,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDivider: {
    width: 2, height: 16, backgroundColor: COLORS.divider, marginLeft: 6, marginVertical: 4,
  },
  routeText: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500', flex: 1 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, padding: 12, gap: 12,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  driverInitial: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.accent },
  driverName: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  driverCar: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  waitingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14, backgroundColor: COLORS.background, borderRadius: SIZES.radius, marginTop: 10,
  },
  waitingText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
