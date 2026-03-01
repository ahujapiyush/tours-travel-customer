import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { BOOKING_STATUSES } from '../../constants/config';
import { bookingsAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { showAlert } from '../../utils/alert';

export default function BookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchBooking();
    socketService.joinBooking(bookingId);
    socketService.on('booking_update', handleUpdate);
    return () => {
      socketService.leaveBooking(bookingId);
      socketService.off('booking_update', handleUpdate);
    };
  }, []);

  const handleUpdate = (data) => {
    if (data.booking_id === bookingId) {
      setBooking(prev => prev ? { ...prev, ...data } : prev);
    }
  };

  const fetchBooking = async () => {
    try {
      const { data } = await bookingsAPI.getBookingById(bookingId);
      setBooking(data?.booking || data);
    } catch {
      showAlert('Error', 'Failed to load booking');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    showAlert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await bookingsAPI.cancelBooking(bookingId, { reason: 'Cancelled by customer' });
            setBooking(prev => ({ ...prev, status: 'cancelled' }));
            showAlert('Cancelled', 'Booking has been cancelled');
          } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const handleRate = async () => {
    if (rating === 0) return;
    setSubmittingRating(true);
    try {
      await bookingsAPI.rateBooking(bookingId, { rating, review: '' });
      showAlert('Thank you!', 'Your rating has been submitted');
    } catch (err) {
      showAlert('Error', 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusInfo = (status) =>
    BOOKING_STATUSES.find(s => s.value === status) || { label: status, color: COLORS.textLight, icon: 'help' };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!booking) return null;

  const statusInfo = getStatusInfo(booking.status);
  const isActive = ['pending', 'confirmed', 'assigned', 'in_progress'].includes(booking.status);
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canRate = booking.status === 'completed' && !booking.rating;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={[styles.statusCard, { backgroundColor: statusInfo.color + '12' }]}>
        <View style={[styles.statusIconWrap, { backgroundColor: statusInfo.color + '25' }]}>
          <Ionicons name={statusInfo.icon} size={32} color={statusInfo.color} />
        </View>
        <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        <Text style={styles.bookingNum}>Booking #{booking.id}</Text>
      </View>

      {/* Timeline Steps */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Booking Progress</Text>
        {BOOKING_STATUSES.filter(s => s.value !== 'cancelled').map((step, index) => {
          const isCompleted = BOOKING_STATUSES.findIndex(s => s.value === booking.status) >= index;
          const isCurrent = booking.status === step.value;
          return (
            <View key={step.value} style={styles.stepRow}>
              <View style={styles.stepTimeline}>
                <View style={[
                  styles.stepDot,
                  isCompleted && { backgroundColor: step.color },
                  isCurrent && styles.stepDotCurrent,
                ]} />
                {index < 4 && (
                  <View style={[styles.stepLine, isCompleted && { backgroundColor: step.color }]} />
                )}
              </View>
              <View style={[styles.stepContent, isCurrent && styles.stepContentCurrent]}>
                <Text style={[styles.stepLabel, isCompleted && { color: COLORS.text, fontWeight: '600' }]}>
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Route */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.routeContainer}>
          <View style={styles.routeIcons}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
            <View style={styles.routeConnector} />
            <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
          </View>
          <View style={styles.routeTexts}>
            <View>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue}>{booking.pickup_address || 'N/A'}</Text>
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.routeLabel}>DROP</Text>
              <Text style={styles.routeValue}>{booking.drop_address || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow icon="calendar" label="Pickup Date" value={booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString() : '-'} />
        <DetailRow icon="time" label="Time" value={booking.pickup_time || '-'} />
        <DetailRow icon="car-sport" label="Car" value={booking.car_name || `Car #${booking.car_id}`} />
        {booking.driver_name && <DetailRow icon="person" label="Driver" value={booking.driver_name} />}
        {booking.driver_phone && <DetailRow icon="call" label="Driver Phone" value={booking.driver_phone} />}
        <DetailRow icon="navigate" label="Distance" value={booking.estimated_distance ? `${booking.estimated_distance} km` : '-'} />
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <DetailRow icon="cash" label="Total Amount" value={`₹${booking.total_amount || 0}`} bold />
        <DetailRow icon="card" label="Payment Status" value={booking.payment_status || 'Pending'} />
        {booking.coupon_code && <DetailRow icon="gift" label="Coupon" value={booking.coupon_code} />}
      </View>

      {/* Expected Time */}
      {isActive && booking.estimated_arrival && (
        <View style={styles.etaCard}>
          <Ionicons name="time" size={20} color={COLORS.accent} />
          <View>
            <Text style={styles.etaLabel}>Expected Arrival</Text>
            <Text style={styles.etaValue}>{booking.estimated_arrival}</Text>
          </View>
        </View>
      )}

      {/* Track Button */}
      {isActive && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('TrackBooking', { bookingId: booking.id })}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#FFF" />
          <Text style={styles.trackBtnText}>Track Live on Map</Text>
        </TouchableOpacity>
      )}

      {/* Rating */}
      {canRate && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rate Your Trip</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={COLORS.accent}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.rateBtn, rating === 0 && { opacity: 0.5 }]}
            onPress={handleRate}
            disabled={rating === 0 || submittingRating}
          >
            {submittingRating ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.rateBtnText}>Submit Rating</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color={COLORS.danger} />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, bold }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={15} color={COLORS.accent} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, bold && { fontWeight: '800', fontSize: SIZES.lg, color: COLORS.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: {
    borderRadius: SIZES.radiusLg, padding: 24, alignItems: 'center', marginBottom: 16,
  },
  statusIconWrap: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statusLabel: { fontSize: SIZES.lg, fontWeight: '700' },
  bookingNum: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.divider,
  },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, marginBottom: 14 },
  stepRow: { flexDirection: 'row', minHeight: 40 },
  stepTimeline: { alignItems: 'center', width: 28, marginRight: 10 },
  stepDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.divider, borderWidth: 2, borderColor: COLORS.divider,
  },
  stepDotCurrent: { borderWidth: 2, borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  stepLine: { width: 1.5, flex: 1, backgroundColor: COLORS.divider, marginVertical: 2 },
  stepContent: { flex: 1, paddingBottom: 10 },
  stepContentCurrent: { backgroundColor: COLORS.accentLight, borderRadius: SIZES.radius, padding: 8, marginLeft: -8 },
  stepLabel: { fontSize: SIZES.sm, color: COLORS.textLight },
  routeContainer: { flexDirection: 'row' },
  routeIcons: { alignItems: 'center', marginRight: 14, paddingVertical: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeConnector: { width: 1.5, flex: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  routeTexts: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  routeValue: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text, marginTop: 2 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, flex: 1, textAlign: 'right' },
  etaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.accentLight,
    borderRadius: SIZES.radiusLg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  etaLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  etaValue: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.accent },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.accent, borderRadius: SIZES.radius, paddingVertical: 14,
    marginBottom: 14,
  },
  trackBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 },
  rateBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 12, alignItems: 'center',
  },
  rateBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.danger + '08', borderRadius: SIZES.radius, padding: 14,
    borderWidth: 1, borderColor: COLORS.danger + '20',
  },
  cancelText: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.danger },
});
