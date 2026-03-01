import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { bookingsAPI, customerAPI } from '../../services/api';
import { showAlert } from '../../utils/alert';
import { useAuth } from '../../context/AuthContext';

const getTodayStr = () => new Date().toISOString().slice(0, 10);

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function BookCarScreen({ navigation, route }) {
  const { car } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Guest details (when not logged in)
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');

  const [form, setForm] = useState({
    pickup_address: '',
    drop_address: '',
    pickup_date: '',
    pickup_time: '',
    return_date: '',
    estimated_distance: '',
    notes: '',
    coupon_code: '',
  });

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handlePickupDateChange = (v) => {
    setForm(prev => {
      const maxReturn = v ? addDays(v, 10) : '';
      const ret = prev.return_date;
      const newReturn = ret && (ret < v || (maxReturn && ret > maxReturn)) ? '' : ret;
      return { ...prev, pickup_date: v, return_date: newReturn };
    });
  };

  const estimatedFare = () => {
    const distance = parseFloat(form.estimated_distance) || 0;
    const baseFare = parseFloat(car.base_price) || 0;
    const perKm = parseFloat(car.price_per_km) || 0;
    const subtotal = baseFare + (distance * perKm);
    const tax = subtotal * 0.05; // 5% GST
    return {
      baseFare,
      distanceFare: distance * perKm,
      subtotal,
      tax,
      discount: couponDiscount,
      total: Math.max(0, subtotal + tax - couponDiscount),
    };
  };

  const handleApplyCoupon = async () => {
    if (!form.coupon_code.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await customerAPI.validateCoupon(form.coupon_code.trim().toUpperCase());
      if (data.coupon) {
        const fare = estimatedFare();
        let discount = 0;
        if (data.coupon.discount_type === 'percentage') {
          discount = (fare.subtotal * data.coupon.discount_value) / 100;
          if (data.coupon.max_discount) discount = Math.min(discount, data.coupon.max_discount);
        } else {
          discount = data.coupon.discount_value;
        }
        setCouponDiscount(discount);
        setCouponApplied(true);
        showAlert('Coupon Applied!', `You save ₹${Math.round(discount)}`);
      } else {
        showAlert('Invalid', 'Coupon is not valid');
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setCouponApplied(false);
    updateForm('coupon_code', '');
  };

  const handleBook = async () => {
    // Guest validation
    if (!user) {
      const phone = guestPhone.replace(/\D/g, '').slice(-10);
      if (phone.length < 10) {
        showAlert('Phone Required', 'Please enter a valid 10-digit phone number to continue');
        return;
      }
    }

    if (!form.pickup_address || !form.drop_address || !form.pickup_date || !form.pickup_time) {
      showAlert('Required', 'Please fill pickup address, drop address, date and time');
      return;
    }
    if (form.return_date) {
      const maxReturn = addDays(form.pickup_date, 10);
      if (form.return_date < form.pickup_date) {
        showAlert('Invalid Date', 'Return date cannot be before pickup date');
        return;
      }
      if (form.return_date > maxReturn) {
        showAlert('Invalid Date', 'Return date cannot be more than 10 days from pickup date');
        return;
      }
    }

    showAlert(
      'Confirm Booking',
      `Book ${car.name} for ₹${Math.round(estimatedFare().total)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const fare = estimatedFare();
              const basePayload = {
                car_id: car.id,
                pickup_address: form.pickup_address,
                drop_address: form.drop_address,
                pickup_date: form.pickup_date,
                pickup_time: form.pickup_time,
                return_date: form.return_date || null,
                estimated_distance: parseFloat(form.estimated_distance) || null,
                notes: form.notes || null,
                coupon_code: couponApplied ? form.coupon_code : null,
                total_amount: Math.round(fare.total),
              };

              let newBooking;
              if (user) {
                const { data } = await bookingsAPI.createBooking(basePayload);
                newBooking = data?.booking || data;
              } else {
                const { data } = await bookingsAPI.createGuestBooking({
                  ...basePayload,
                  phone: guestPhone.replace(/\D/g, '').slice(-10),
                  name: guestName.trim() || undefined,
                });
                newBooking = data?.booking || data;
              }

              showAlert('Booking Successful!', `Booking #${newBooking.id} created successfully`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              showAlert('Error', err.response?.data?.message || 'Failed to create booking');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const fare = estimatedFare();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Car Summary */}
        <View style={styles.carSummary}>
          <View style={styles.carIconWrap}>
            <Ionicons name="car-sport" size={28} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.carName}>{car.name}</Text>
            <Text style={styles.carBrand}>{car.brand} · {car.seats} seats · {car.fuel_type}</Text>
          </View>
          <View>
            <Text style={styles.carPrice}>₹{car.price_per_km}/km</Text>
          </View>
        </View>

        {/* Guest Details — shown only when not logged in */}
        {!user && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Your Contact Details</Text>
            </View>
            <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 14 }}>
              No account needed — we'll track your booking by phone number.
            </Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call" size={15} color={COLORS.accent} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputFlex}
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Name (Optional)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person" size={15} color={COLORS.accent} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputFlex}
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-in-outline" size={14} color={COLORS.accent} />
              <Text style={{ fontSize: SIZES.sm, color: COLORS.accent, fontWeight: '500' }}>
                Sign in for full booking history & tracking
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pickup Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <FormField icon="location" label="Pickup Address *" placeholder="Enter pickup location"
            value={form.pickup_address} onChangeText={v => updateForm('pickup_address', v)} />

          <FormField icon="flag" label="Drop Address *" placeholder="Enter drop location"
            value={form.drop_address} onChangeText={v => updateForm('drop_address', v)} />

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Pickup Date *</Text>
              <DatePickerInput
                value={form.pickup_date}
                onChange={handlePickupDateChange}
                min={getTodayStr()}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pickup Time *</Text>
              <TimePickerInput
                value={form.pickup_time}
                onChange={v => updateForm('pickup_time', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Return Date <Text style={{ fontWeight: '400', color: COLORS.textLight }}>(max 10 days)</Text></Text>
              <DatePickerInput
                value={form.return_date}
                onChange={v => updateForm('return_date', v)}
                min={form.pickup_date || getTodayStr()}
                max={form.pickup_date ? addDays(form.pickup_date, 10) : addDays(getTodayStr(), 10)}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Est. Distance (km)</Text>
              <TextInput style={styles.input} value={form.estimated_distance} onChangeText={v => updateForm('estimated_distance', v)}
                keyboardType="decimal-pad" placeholder="e.g. 50" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>

          <FormField icon="chatbox" label="Notes (Optional)" placeholder="Any special requests"
            value={form.notes} onChangeText={v => updateForm('notes', v)} multiline />
        </View>

        {/* Coupon */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.couponInput, couponApplied && styles.couponApplied]}
              value={form.coupon_code}
              onChangeText={v => updateForm('coupon_code', v)}
              placeholder="Enter coupon code"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="characters"
              editable={!couponApplied}
            />
            {couponApplied ? (
              <TouchableOpacity style={styles.removeCouponBtn} onPress={handleRemoveCoupon}>
                <Ionicons name="close" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon} disabled={couponLoading}>
                {couponLoading ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.applyCouponText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {couponApplied && (
            <View style={styles.couponSuccess}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.couponSuccessText}>Coupon applied! Save ₹{Math.round(couponDiscount)}</Text>
            </View>
          )}
        </View>

        {/* Fare Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fare Estimate</Text>
          <FareRow label="Base Fare" value={`₹${Math.round(fare.baseFare)}`} />
          <FareRow label={`Distance (${form.estimated_distance || 0} km)`} value={`₹${Math.round(fare.distanceFare)}`} />
          <FareRow label="GST (5%)" value={`₹${Math.round(fare.tax)}`} />
          {couponDiscount > 0 && (
            <FareRow label="Coupon Discount" value={`-₹${Math.round(couponDiscount)}`} isDiscount />
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{Math.round(fare.total)}</Text>
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.bookBtnText}>Confirm Booking · ₹{Math.round(fare.total)}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DatePickerInput({ value, onChange, min, max }) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: COLORS.background,
          borderRadius: SIZES.radius,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 12,
          paddingBottom: 12,
          fontSize: SIZES.base,
          color: value ? COLORS.text : COLORS.textLight,
          border: `1px solid ${COLORS.divider}`,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      />
    );
  }
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="Select date"
      placeholderTextColor={COLORS.textLight}
    />
  );
}

function TimePickerInput({ value, onChange }) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="time"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: COLORS.background,
          borderRadius: SIZES.radius,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 12,
          paddingBottom: 12,
          fontSize: SIZES.base,
          color: value ? COLORS.text : COLORS.textLight,
          border: `1px solid ${COLORS.divider}`,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      />
    );
  }
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="Select time"
      placeholderTextColor={COLORS.textLight}
    />
  );
}

function FormField({ icon, label, ...inputProps }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && <Ionicons name={icon} size={15} color={COLORS.accent} style={{ marginRight: 8 }} />}
        <TextInput style={styles.inputFlex} placeholderTextColor={COLORS.textLight} {...inputProps} />
      </View>
    </View>
  );
}

function FareRow({ label, value, isDiscount }) {
  return (
    <View style={styles.fareRow}>
      <Text style={styles.fareLabel}>{label}</Text>
      <Text style={[styles.fareValue, isDiscount && { color: COLORS.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  carSummary: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg, padding: 14, borderWidth: 1, borderColor: COLORS.divider, marginBottom: 16, gap: 12,
  },
  carIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  carName: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text },
  carBrand: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  carPrice: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    borderWidth: 1, borderColor: COLORS.divider, marginBottom: 14,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text, marginBottom: 14 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: SIZES.base, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.divider,
  },
  inputFlex: { flex: 1, fontSize: SIZES.base, color: COLORS.text, paddingVertical: 12 },
  row: { flexDirection: 'row' },
  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: SIZES.radius, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: SIZES.base, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  couponApplied: { borderColor: COLORS.success, backgroundColor: COLORS.success + '08' },
  applyCouponBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radius, paddingHorizontal: 20,
    justifyContent: 'center',
  },
  applyCouponText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
  removeCouponBtn: {
    width: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.danger + '10',
    borderRadius: SIZES.radius,
  },
  couponSuccess: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: COLORS.success + '10', padding: 10, borderRadius: SIZES.radius,
  },
  couponSuccessText: { fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' },
  fareRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  fareLabel: { fontSize: SIZES.base, color: COLORS.textSecondary },
  fareValue: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4,
    borderTopWidth: 2, borderTopColor: COLORS.accent,
  },
  totalLabel: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.accent },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusLg, paddingVertical: 16,
    marginTop: 4,
  },
  bookBtnText: { fontSize: SIZES.lg, fontWeight: '600', color: '#FFF' },
});
