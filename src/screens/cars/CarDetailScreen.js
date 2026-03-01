import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { FUEL_ICONS } from '../../constants/config';
import { carsAPI, customerAPI } from '../../services/api';
import { showAlert } from '../../utils/alert';
import { useAuth } from '../../context/AuthContext';

export default function CarDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { carId } = route.params;
  const { user } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchCar();
  }, []);

  const fetchCar = async () => {
    try {
      const { data } = await carsAPI.getCarById(carId);
      setCar(data?.car || data);
    } catch {
      showAlert('Error', 'Failed to load car details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await customerAPI.removeFavorite(carId);
      } else {
        await customerAPI.addFavorite(carId);
      }
      setIsFavorite(!isFavorite);
    } catch {}
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!car) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, Platform.OS !== 'web' && { paddingTop: insets.top }]}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="car-sport" size={40} color={COLORS.accent} />
          </View>
          <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? COLORS.danger : COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carBrand}>{car.brand} {car.model} · {car.year}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFC107" />
              <Text style={styles.ratingText}>{car.avg_rating || '4.5'}</Text>
            </View>
          </View>

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per Kilometer</Text>
              <Text style={styles.priceValue}>₹{car.price_per_km}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Base Price</Text>
              <Text style={styles.priceValue}>₹{car.base_price}</Text>
            </View>
          </View>

          {/* Specs Grid */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specsGrid}>
              <SpecItem icon="people" label="Seats" value={car.seats} />
              <SpecItem icon={FUEL_ICONS[car.fuel_type] || 'flame'} label="Fuel" value={car.fuel_type} />
              <SpecItem icon="settings" label="Gear" value={car.transmission} />
              <SpecItem icon="snow" label="AC" value={car.ac ? 'Yes' : 'No'} />
              <SpecItem icon="document-text" label="Reg." value={car.registration_number} />
              <SpecItem icon="layers" label="Category" value={car.category_name || '-'} />
            </View>
          </View>

          {/* Location */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="location" size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.locationCity}>{car.city_name || 'City'}</Text>
                <Text style={styles.locationState}>{car.state_name || 'State'}</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresList}>
                {car.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {car.description && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>About This Car</Text>
              <Text style={styles.description}>{car.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>₹{car.price_per_km}<Text style={styles.bottomUnit}>/km</Text></Text>
          <Text style={styles.bottomBase}>+ ₹{car.base_price} base</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => {
            if (!user) {
              showAlert('Login Required', 'Please sign in to book a car', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => navigation.navigate('Login') },
              ]);
              return;
            }
            navigation.navigate('BookCar', { car });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book This Car</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SpecItem({ icon, label, value }) {
  return (
    <View style={styles.specItem}>
      <View style={styles.specIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    height: 180, backgroundColor: COLORS.accentLight, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.divider,
  },
  favBtn: {
    position: 'absolute', top: Platform.OS !== 'web' ? 8 : 16, right: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.divider,
  },
  content: { padding: SIZES.padding },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  carName: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  carBrand: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: SIZES.radiusFull,
  },
  ratingText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  priceCard: {
    flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.divider,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 4 },
  priceValue: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  priceDivider: { width: 1, backgroundColor: COLORS.divider },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.padding,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.divider,
  },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text, marginBottom: 14 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specItem: {
    width: '30%', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, padding: 12,
  },
  specIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accentLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  specLabel: { fontSize: SIZES.xs, color: COLORS.textLight, marginBottom: 2 },
  specValue: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  locationCity: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  locationState: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  featuresList: { gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: SIZES.sm, color: COLORS.text },
  description: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.padding, paddingVertical: 14, paddingBottom: 30,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  bottomPrice: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  bottomUnit: { fontSize: SIZES.sm, fontWeight: '400', color: COLORS.textLight },
  bottomBase: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accent,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: SIZES.radius,
  },
  bookBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
});
