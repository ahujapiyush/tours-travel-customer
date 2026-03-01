import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl, Image, Dimensions, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS, SIZES } from '../../constants/theme';
import { locationsAPI, carsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const isWeb = Platform.OS === 'web';
const HERO_MAX = 480;
const SECTION_MAX = 860;

const CHHATTISGARH_CITIES = [
  'Raipur', 'Nava Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 'Raigarh', 'Jagdalpur',
  'Ambikapur', 'Rajnandgaon', 'Dhamtari', 'Mahasamund', 'Kawardha', 'Janjgir', 'Champa',
  'Balod', 'Bemetara', 'Gariaband', 'Mungeli', 'Surajpur', 'Jashpur', 'Kanker',
  'Kondagaon', 'Narayanpur', 'Dantewada', 'Bijapur', 'Sukma', 'Sakti', 'Sarangarh',
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width: winWidth } = useWindowDimensions();
  const filtersInitialized = useRef(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popularCars, setPopularCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carsLoading, setCarsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stateIsFocus, setStateIsFocus] = useState(false);
  const [cityIsFocus, setCityIsFocus] = useState(false);

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedState) fetchCities(selectedState.id);
  }, [selectedState]);

  // Skip first render — initial cars are loaded by fetchInitialData
  useEffect(() => {
    if (!filtersInitialized.current) { filtersInitialized.current = true; return; }
    fetchCars();
  }, [selectedCity, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      const [statesRes, catsRes, carsRes] = await Promise.all([
        locationsAPI.getStates(),
        carsAPI.getCategories(),
        carsAPI.getCars({ limit: 10, status: 'available' }),
      ]);
      setStates(statesRes.data?.states || []);
      setCategories(catsRes.data?.categories || []);
      setPopularCars(carsRes.data?.cars || []);
    } catch (err) {
      console.log('Init error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const { data } = await locationsAPI.getCities(stateId);
      setCities(data?.cities || []);
    } catch {}
  };

  const fetchCars = async () => {
    setCarsLoading(true);
    try {
      const params = { limit: 10, status: 'available' };
      if (selectedCity) params.city_id = selectedCity.id;
      if (selectedCategory) params.category_id = selectedCategory.id;
      const { data } = await carsAPI.getCars(params);
      setPopularCars(data?.cars || []);
    } catch {
    } finally {
      setCarsLoading(false);
    }
  };

  const handleSelectState = (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setCities([]);
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
  };

  const handleSearchCars = () => {
    navigation.navigate('CarsList', {
      stateId: selectedState?.id,
      cityId: selectedCity?.id,
      categoryId: selectedCategory?.id,
      stateName: selectedState?.name,
      cityName: selectedCity?.name,
    });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchInitialData(); }}
        />
      }
    >
      {/* ── Hero + Search ── */}
      <View style={styles.heroSection}>
        <View style={styles.heroInner}>

          {/* Accent bar */}
          <View style={styles.accentBar} />

          {/* Greeting Row */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextBlock}>
              <Text style={styles.greetingSub}>Good {greeting},</Text>
              <Text style={styles.greeting}>{user?.name?.split(' ')[0] || 'Traveller'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.bellBtn}
            >
              <Ionicons name="notifications-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.greetingCaption}>Where would you like to go today?</Text>

          {/* Search Box */}
          <View style={styles.searchArea}>

            {/* State Dropdown */}
            <View style={[styles.dropdownWrapper, { zIndex: stateIsFocus ? 200 : 2 }]}>
              <Dropdown
                style={[styles.dropdown, stateIsFocus && styles.dropdownFocused]}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
                activeColor={COLORS.accentLight}
                data={states}
                maxHeight={220}
                labelField="name"
                valueField="id"
                placeholder="Select State"
                value={selectedState?.id}
                onFocus={() => setStateIsFocus(true)}
                onBlur={() => setStateIsFocus(false)}
                onChange={item => { handleSelectState(item); setStateIsFocus(false); }}
                renderLeftIcon={() => (
                  <Ionicons name="map-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                )}
              />
            </View>

            {/* City Dropdown */}
            {selectedState && (
              <View style={[styles.dropdownWrapper, { zIndex: cityIsFocus ? 100 : 1 }]}>
                <Dropdown
                  style={[styles.dropdown, cityIsFocus && styles.dropdownFocused]}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelectedText}
                  containerStyle={styles.dropdownContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.accentLight}
                  data={cities}
                  maxHeight={220}
                  labelField="name"
                  valueField="id"
                  placeholder="Select City"
                  value={selectedCity?.id}
                  onFocus={() => setCityIsFocus(true)}
                  onBlur={() => setCityIsFocus(false)}
                  onChange={item => { handleSelectCity(item); setCityIsFocus(false); }}
                  renderLeftIcon={() => (
                    <Ionicons name="location-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                  )}
                />
              </View>
            )}

            {/* Category Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !selectedCategory && styles.chipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategory?.id === cat.id && styles.chipActive]}
                  onPress={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                >
                  <Text style={[styles.chipText, selectedCategory?.id === cat.id && styles.chipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Search Button */}
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearchCars} activeOpacity={0.8}>
              <Ionicons name="search" size={18} color="#FFF" />
              <Text style={styles.searchBtnText}>Search Cars</Text>
            </TouchableOpacity>
             <View style={styles.innerDivider} />

                {/* Popular in Chhattisgarh */}
                <View style={styles.coverageHeadingRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.coverageTitle}>Popular in Chhattisgarh</Text>
                </View>
                <View style={styles.coverageWrap}>
                  {CHHATTISGARH_CITIES.slice(0, 14).map(city => (
                    <TouchableOpacity
                      key={city}
                      style={styles.coverageChip}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('CarsList', { cityName: city })}
                    >
                      <Text style={styles.coverageChipText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

            {/* ── Popular in Chhattisgarh + Quick Actions (logged-in only) ── */}
            {user && (
              <>
              
                <View style={styles.innerDivider} />

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <QuickAction icon="car-sport-outline" label="All Cars" color={COLORS.accent}
                    onPress={() => navigation.navigate('CarsList', {})} />
                  <QuickAction icon="heart-outline" label="Favorites" color="#E8457C"
                    onPress={() => navigation.navigate('Favorites')} />
                  <QuickAction icon="briefcase-outline" label="My Trips" color="#34C759"
                    onPress={() => navigation.navigate('BookingHistory')} />
                  <QuickAction icon="navigate-outline" label="Track" color="#FF9500"
                    onPress={() => navigation.navigate('BookingHistory')} />
                </View>
              </>
            )}

          </View>
        </View>
      </View>

      {/* ── Popular Cars ── */}
      <View style={styles.sectionWrapper}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCity ? `Cars in ${selectedCity.name}` : 'Popular Cars'}
            </Text>
            <TouchableOpacity onPress={handleSearchCars}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {carsLoading ? (
            <View style={styles.carsLoader}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.carsLoaderText}>Loading cars…</Text>
            </View>
          ) : popularCars.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={36} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No cars available</Text>
            </View>
          ) : (
            <View style={styles.carsGrid}>
              {popularCars.map(car => {
                // Responsive card width: mobile web → 2 cols, tablet → 3, desktop → 4
                const cols = isWeb
                  ? winWidth < 500 ? 2 : winWidth < 720 ? 3 : 4
                  : 2;
                const gap = isWeb ? 16 : 10;
                const cardWidth = isWeb
                  ? `calc(${100 / cols}% - ${gap * (cols - 1) / cols}px)`
                  : '48.5%';
                return (
                <TouchableOpacity
                  key={car.id}
                  style={[styles.carCard, { width: cardWidth }]}
                  onPress={() => navigation.navigate('CarDetail', { carId: car.id })}
                  activeOpacity={0.7}
                >
                  <CarImageArea car={car} />
                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    {car.ac && (
                      <View style={styles.badgeAC}>
                        <Ionicons name="snow" size={10} color="#0891B2" />
                        <Text style={styles.badgeACText}>AC</Text>
                      </View>
                    )}
                    {car.rating >= 4 && (
                      <View style={styles.badgePopular}>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text style={styles.badgePopularText}>{car.rating}</Text>
                      </View>
                    )}
                    {car.total_trips > 10 && (
                      <View style={styles.badgeSale}>
                        <Ionicons name="flame" size={10} color="#FFF" />
                        <Text style={styles.badgeSaleText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.carInfo}>
                    <Text style={styles.carName} numberOfLines={1}>{car.name}</Text>
                    <Text style={styles.carBrand}>{car.brand}</Text>
                    <View style={styles.carMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={11} color={COLORS.textLight} />
                        <Text style={styles.metaText}>{car.seats}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="cog-outline" size={11} color={COLORS.textLight} />
                        <Text style={styles.metaText}>{car.transmission}</Text>
                      </View>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{car.price_per_km}</Text>
                      <Text style={styles.priceUnit}>/km</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Car Image with Carousel ── */
function CarImageArea({ car }) {
  const allImages = getCarImages(car);
  const [activeIdx, setActiveIdx] = useState(0);

  if (allImages.length === 0) {
    return (
      <View style={styles.carImagePlaceholder}>
        <Ionicons name="car-sport" size={32} color={COLORS.accent} />
      </View>
    );
  }

  if (allImages.length === 1) {
    return (
      <Image source={{ uri: allImages[0] }} style={styles.carImage} resizeMode="cover" />
    );
  }

  // Multiple images → carousel
  const [slideWidth, setSlideWidth] = useState(0);
  return (
    <View style={styles.carImageWrap} onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}>
      {slideWidth > 0 && <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setActiveIdx(idx);
        }}
        style={styles.carImageScroll}
      >
        {allImages.map((uri, i) => (
          <Image key={i} source={{ uri }} style={[styles.carImageSlide, { width: slideWidth }]} resizeMode="cover" />
        ))}
      </ScrollView>}
      <View style={styles.dotRow}>
        {allImages.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function getCarImages(car) {
  const imgs = [];
  const isValid = (url) => typeof url === 'string' && url.startsWith('http');
  if (isValid(car.image_url)) imgs.push(car.image_url);
  if (Array.isArray(car.images)) {
    car.images.forEach(url => { if (isValid(url) && !imgs.includes(url)) imgs.push(url); });
  }
  return imgs;
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* ── Hero ── */
  heroSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.padding,
    paddingTop: isWeb ? 40 : 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    alignItems: isWeb ? 'center' : 'stretch',
  },
  heroInner: {
    width: '100%',
    ...(isWeb ? { maxWidth: HERO_MAX } : {}),
  },
  accentBar: {
    height: 3,
    width: 40,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 4,
  },
  greetingTextBlock: { flex: 1 },
  greetingSub: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '400' },
  greeting: { fontSize: isWeb ? 26 : SIZES.xxl, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5, marginTop: 2 },
  greetingCaption: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  bellBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.divider,
  },

  /* ── Search Box ── */
  searchArea: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    zIndex: 10,
    ...(isWeb ? { overflow: 'visible' } : {}),
  },

  /* Dropdowns (react-native-element-dropdown) */
  dropdownWrapper: { position: 'relative', marginBottom: 8 },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, paddingHorizontal: 12, height: 46,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  dropdownFocused: { borderColor: COLORS.accent },
  dropdownPlaceholder: { fontSize: SIZES.sm, color: COLORS.textLight },
  dropdownSelectedText: { fontSize: SIZES.sm, color: COLORS.text },
  dropdownContainer: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.divider,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 8,
  },
  dropdownItemText: { fontSize: SIZES.sm, color: COLORS.text, paddingVertical: 2 },

  /* Chips */
  chipRow: { flexDirection: 'row', marginBottom: 10, marginTop: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface, marginRight: 6, borderWidth: 1, borderColor: COLORS.divider,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#FFF' },

  /* Search Button */
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: SIZES.radius, paddingVertical: 13,
  },
  searchBtnText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 },

  /* Inner divider inside search box */
  innerDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },

  /* Popular in CG (inside search box) */
  coverageHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  coverageTitle: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverageWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coverageChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.accentLight,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  coverageChipText: { fontSize: 11, color: COLORS.accent, fontWeight: '500' },

  /* Quick Actions (inside search box) */
  quickActions: { flexDirection: 'row', gap: 6 },
  quickItem: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.divider,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  quickIcon: {
    width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  quickLabel: { fontSize: 9, fontWeight: '500', color: COLORS.textSecondary },

  /* ── Section wrapper ── */
  sectionWrapper: {
    paddingHorizontal: SIZES.padding,
    alignItems: isWeb ? 'center' : 'stretch',
  },
  section: {
    marginTop: 24,
    width: '100%',
    ...(isWeb ? { maxWidth: SECTION_MAX } : {}),
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  seeAll: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.accent },

  /* Cars */
  carsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: isWeb ? 16 : 10,
  },
  carsLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 30 },
  carsLoaderText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  carCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  carImagePlaceholder: { height: 140, backgroundColor: COLORS.accentLight, justifyContent: 'center', alignItems: 'center' },
  carImage: { width: '100%', height: 140 },
  carImageWrap: { position: 'relative', height: 140, overflow: 'hidden' },
  carImageScroll: { height: 140 },
  carImageSlide: { width: '100%', height: 140 },
  dotRow: {
    position: 'absolute', bottom: 6, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFF', width: 14 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 8, paddingTop: 8 },
  badgeAC: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ECFEFF', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeACText: { fontSize: 9, fontWeight: '600', color: '#0891B2' },
  badgePopular: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFBEB', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgePopularText: { fontSize: 9, fontWeight: '600', color: '#D97706' },
  badgeSale: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeSaleText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  carInfo: { padding: 12 },
  carName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  carBrand: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  carMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: COLORS.textLight },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  price: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  priceUnit: { fontSize: 10, color: COLORS.textLight, marginLeft: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 8 },
});
