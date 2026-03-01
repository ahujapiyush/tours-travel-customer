import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { customerAPI } from '../../services/api';
import { showAlert } from '../../utils/alert';

export default function FavoritesScreen({ navigation }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await customerAPI.getFavorites();
      setCars(data?.favorites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (carId) => {
    showAlert('Remove', 'Remove from favorites?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await customerAPI.removeFavorite(carId);
            setCars(prev => prev.filter(c => c.id !== carId));
          } catch (err) {
            showAlert('Error', 'Failed to remove');
          }
        }
      },
    ]);
  };

  const renderCar = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
    >
      <View style={styles.cardImage}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="car-sport" size={36} color={COLORS.accent + '66'} />
          </View>
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => removeFavorite(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.carName} numberOfLines={1}>{item.brand} {item.model}</Text>
        <Text style={styles.carYear}>{item.year} • {item.fuel_type}</Text>

        <View style={styles.specRow}>
          <View style={styles.spec}>
            <Ionicons name="speedometer" size={14} color={COLORS.textLight} />
            <Text style={styles.specText}>{item.seats} seats</Text>
          </View>
          <View style={styles.spec}>
            <Ionicons name="cog" size={14} color={COLORS.textLight} />
            <Text style={styles.specText}>{item.transmission}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.location}>
            <Ionicons name="location" size={14} color={COLORS.accent} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.city_name}, {item.state_name}
            </Text>
          </View>
          <Text style={styles.price}>₹{item.price_per_km}<Text style={styles.priceUnit}>/km</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cars.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>Cars you love will appear here</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('CarsList')}
          >
            <Text style={styles.browseText}>Browse Cars</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={i => i.id.toString()}
          renderItem={renderCar}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { padding: SIZES.padding },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider,
  },
  cardImage: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: COLORS.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.surface,
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.divider,
  },
  cardBody: { padding: 16 },
  carName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  carYear: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 4 },
  specRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontSize: SIZES.xs, color: COLORS.textLight },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { fontSize: SIZES.sm, color: COLORS.text },
  price: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  priceUnit: { fontSize: SIZES.xs, fontWeight: '500', color: COLORS.textLight },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 6 },
  browseBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: SIZES.radiusFull, marginTop: 20,
  },
  browseText: { fontSize: SIZES.base, fontWeight: '600', color: '#FFF' },
});
