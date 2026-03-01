import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image,
  ActivityIndicator, RefreshControl, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { FUEL_ICONS } from '../../constants/config';
import { carsAPI } from '../../services/api';

export default function CarsListScreen({ navigation, route }) {
  const { stateId, cityId, categoryId, cityName } = route.params || {};
  const { width: winWidth } = useWindowDimensions();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCars(true);
  }, []);

  const fetchCars = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    try {
      const params = { page: currentPage, limit: 20, status: 'available' };
      if (stateId) params.state_id = stateId;
      if (cityId) params.city_id = cityId;
      if (categoryId) params.category_id = categoryId;
      if (search.trim()) params.search = search.trim();

      const { data } = await carsAPI.getCars(params);
      const newCars = data?.cars || [];
      setCars(reset ? newCars : [...cars, ...newCars]);
      setHasMore(newCars.length >= 20);
      setPage(currentPage + 1);
    } catch (err) {
      console.log('Fetch cars error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    setPage(1);
    fetchCars(true);
  };

  const renderCar = ({ item }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
      activeOpacity={0.8}
    >
      {/* Car Image Area */}
      <View style={styles.carImageWrap}>
        {(() => {
          const isValid = (url) => typeof url === 'string' && url.startsWith('http');
          const imgUrl = isValid(item.image_url) ? item.image_url
            : (Array.isArray(item.images) && isValid(item.images[0])) ? item.images[0]
            : null;
          return imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.carImage} resizeMode="cover" />
          ) : (
            <Ionicons name="car-sport" size={36} color={COLORS.accent} />
          );
        })()}
        {item.ac && (
          <View style={styles.acBadge}>
            <Ionicons name="snow" size={12} color={COLORS.info} />
            <Text style={styles.acText}>AC</Text>
          </View>
        )}
      </View>

      {/* Car Info */}
      <View style={styles.carBody}>
        <View style={styles.carHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.carName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.carBrand}>{item.brand} {item.model}</Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceAmount}>₹{item.price_per_km}</Text>
            <Text style={styles.priceUnit}>/km</Text>
          </View>
        </View>

        <View style={styles.specsRow}>
          <SpecChip icon="people" value={`${item.seats} Seats`} />
          <SpecChip icon={FUEL_ICONS[item.fuel_type] || 'flame'} value={item.fuel_type} />
          <SpecChip icon="settings" value={item.transmission} />
          {item.year && <SpecChip icon="calendar" value={item.year.toString()} />}
        </View>

        {item.city_name && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.accent} />
            <Text style={styles.locationText}>{item.city_name}{item.state_name ? `, ${item.state_name}` : ''}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.basePrice}>Base: ₹{item.base_price}</Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookCar', { car: item })}
            activeOpacity={0.8}
          >
            <Text style={styles.bookBtnText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cars, brands..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); handleSearch(); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {cityName && (
        <View style={styles.filterInfo}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.filterText}>Showing cars in {cityName}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : Platform.OS === 'web' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {cars.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="car" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No cars found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (() => {
            const cols = winWidth < 500 ? 1 : winWidth < 800 ? 2 : 3;
            const gap = 12;
            const cardWidth = cols === 1 ? '100%' : `calc(${100 / cols}% - ${(gap * (cols - 1)) / cols}px)`;
            return (
              <View style={[styles.carsGrid, { gap }]}>
                {cars.map(item => (
                  <View key={item.id} style={[styles.gridItem, { width: cardWidth }]}>
                    {renderCar({ item })}
                  </View>
                ))}
              </View>
            );
          })()}
        </ScrollView>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderCar}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCars(true); }} />
          }
          onEndReached={() => hasMore && fetchCars(false)}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No cars found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function SpecChip({ icon, value }) {
  return (
    <View style={styles.specChip}>
      <Ionicons name={icon} size={13} color={COLORS.textSecondary} />
      <Text style={styles.specText}>{value}</Text>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12, gap: 10, borderWidth: 1, borderColor: COLORS.divider,
  },
  searchInput: { flex: 1, fontSize: SIZES.sm, color: COLORS.text },
  filterInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterText: { fontSize: SIZES.sm, color: COLORS.accent, fontWeight: '500' },
  carsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '100%',
  },
  carCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider,
  },
  carImageWrap: {
    aspectRatio: 4 / 3, backgroundColor: COLORS.accentLight, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  carImage: { width: '100%', height: '100%' },
  acBadge: {
    position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: COLORS.info + '15', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  acText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.info },
  carBody: { padding: 14 },
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  carName: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  carBrand: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  priceTag: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  priceUnit: { fontSize: SIZES.xs, color: COLORS.textLight },
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.background,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: SIZES.radiusFull,
  },
  specText: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  locationText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  basePrice: { fontSize: SIZES.sm, color: COLORS.textLight },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radius,
  },
  bookBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.base, fontWeight: '500', color: COLORS.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 4 },
});
