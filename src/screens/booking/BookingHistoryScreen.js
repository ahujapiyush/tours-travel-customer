import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { BOOKING_STATUSES } from '../../constants/config';
import { bookingsAPI } from '../../services/api';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  ...BOOKING_STATUSES,
];

export default function BookingHistoryScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [activeFilter]);

  const fetchBookings = async () => {
    try {
      const params = { limit: 50 };
      if (activeFilter) params.status = activeFilter;
      const { data } = await bookingsAPI.getBookings(params);
      setBookings(data?.bookings || []);
    } catch (err) {
      console.log('Fetch bookings error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusInfo = (status) =>
    BOOKING_STATUSES.find(s => s.value === status) || { label: status, color: COLORS.textLight, icon: 'help' };

  const renderBooking = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const isActive = ['pending', 'confirmed', 'assigned', 'in_progress'].includes(item.status);

    return (
      <TouchableOpacity
        style={[styles.bookingCard, isActive && styles.activeCard]}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.bookingIdWrap}>
            <Text style={styles.bookingId}>#{item.id}</Text>
            <Text style={styles.bookingDate}>
              {item.pickup_date ? new Date(item.pickup_date).toLocaleDateString() : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeSection}>
          <View style={styles.routePoints}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <View style={styles.routeLine} />
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || 'Pickup'}</Text>
            <Text style={[styles.routeText, { marginTop: 14 }]} numberOfLines={1}>{item.drop_address || 'Drop'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.carInfo}>
            <Ionicons name="car-sport" size={14} color={COLORS.textLight} />
            <Text style={styles.footerText}>{item.car_name || `Car #${item.car_id}`}</Text>
          </View>
          <Text style={styles.amount}>₹{item.total_amount || 0}</Text>
        </View>

        {/* Live Tracking Button */}
        {isActive && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('TrackBooking', { bookingId: item.id })}
          >
            <Ionicons name="navigate" size={14} color={COLORS.accent} />
            <Text style={styles.trackText}>Track Live</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value || 'all'}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.value && styles.filterActive]}
            onPress={() => { setActiveFilter(item.value); setLoading(true); }}
          >
            <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No Bookings</Text>
              <Text style={styles.emptyText}>Your booking history will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterList: { maxHeight: 48, backgroundColor: COLORS.surface, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.background, marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.divider,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  bookingCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.divider,
  },
  activeCard: { borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  bookingIdWrap: {},
  bookingId: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  bookingDate: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: SIZES.radiusFull,
  },
  statusText: { fontSize: SIZES.xs, fontWeight: '600' },
  routeSection: { flexDirection: 'row', marginBottom: 14 },
  routePoints: { alignItems: 'center', marginRight: 12, paddingVertical: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  routeLine: { width: 1.5, flex: 1, backgroundColor: COLORS.divider, marginVertical: 3 },
  routeTexts: { flex: 1, justifyContent: 'space-between' },
  routeText: { fontSize: SIZES.sm, color: COLORS.text, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  carInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  amount: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.accentLight, borderRadius: SIZES.radius,
    paddingVertical: 10, marginTop: 10,
  },
  trackText: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.accent },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: SIZES.base, fontWeight: '500', color: COLORS.textSecondary, marginTop: 12 },
  emptyText: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 4 },
});
