import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import CarsListScreen from './src/screens/cars/CarsListScreen';
import CarDetailScreen from './src/screens/cars/CarDetailScreen';
import FavoritesScreen from './src/screens/cars/FavoritesScreen';
import BookCarScreen from './src/screens/booking/BookCarScreen';
import BookingHistoryScreen from './src/screens/booking/BookingHistoryScreen';
import BookingDetailScreen from './src/screens/booking/BookingDetailScreen';
import TrackBookingScreen from './src/screens/tracking/TrackBookingScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';

const C = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSec: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#1A1A2E',
  accent: '#4A90D9',
  border: '#F0F0F0',
  danger: '#FF3B30',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

/* ── Guest placeholder ── */
function GuestPlaceholder({ navigation, title, message }) {
  return (
    <View style={s.guestWrap}>
      <View style={s.guestCard}>
        <View style={s.guestIconCircle}>
          <Ionicons name="person-outline" size={32} color={C.primary} />
        </View>
        <Text style={s.guestTitle}>{title || 'Sign in required'}</Text>
        <Text style={s.guestMsg}>{message || 'Please sign in to access this feature'}</Text>
        <TouchableOpacity style={s.guestBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
          <Text style={s.guestBtnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7} style={{ marginTop: 14 }}>
          <Text style={s.guestLinkText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MyTripsTab({ navigation }) {
  const { user } = useAuth();
  if (!user) return <GuestPlaceholder navigation={navigation} title="My Trips" message="Sign in to view your bookings" />;
  return <BookingHistoryScreen navigation={navigation} route={{ params: {} }} />;
}

function ProfileTab({ navigation }) {
  const { user } = useAuth();
  if (!user) return <GuestPlaceholder navigation={navigation} title="Profile" message="Sign in to manage your profile" />;
  return <ProfileScreen navigation={navigation} route={{ params: {} }} />;
}

/* ── Mobile tabs ── */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = { Home: 'home', Search: 'search', MyTrips: 'receipt', Profile: 'person' };
          const base = icons[route.name] || 'ellipse';
          return <Ionicons name={focused ? base : `${base}-outline`} size={22} color={color} />;
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: isWeb ? 52 : (Platform.OS === 'ios' ? 84 : 60),
          paddingBottom: isWeb ? 4 : (Platform.OS === 'ios' ? 24 : 8),
          paddingTop: 6,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={CarsListScreen} options={{ tabBarLabel: 'Search', title: 'Search Cars' }} />
      <Tab.Screen name="MyTrips" component={MyTripsTab} options={{ tabBarLabel: 'My Trips', title: 'My Trips' }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

/* ── Web nav items ── */
const NAV_GUEST = [
  { key: 'Home', icon: 'home', label: 'Home', component: HomeScreen },
  { key: 'Search', icon: 'search', label: 'Cars', component: CarsListScreen },
];
const NAV_AUTH = [
  { key: 'Home', icon: 'home', label: 'Home', component: HomeScreen },
  { key: 'Search', icon: 'search', label: 'Cars', component: CarsListScreen },
  { key: 'MyTrips', icon: 'receipt', label: 'My Trips', component: BookingHistoryScreen },
  { key: 'Favorites', icon: 'heart', label: 'Favorites', component: FavoritesScreen },
  { key: 'Notifications', icon: 'notifications', label: 'Notifications', component: NotificationsScreen },
  { key: 'Profile', icon: 'person', label: 'Profile', component: ProfileScreen },
];

const DETAIL_SCREENS = {
  CarDetail: CarDetailScreen, BookCar: BookCarScreen, BookingDetail: BookingDetailScreen,
  TrackBooking: TrackBookingScreen, CarsList: CarsListScreen, BookingHistory: BookingHistoryScreen,
  Login: LoginScreen, Register: RegisterScreen, Blogs: null, BlogDetail: null, /* handled inline */
};

/* ── URL Routing for Web ── */
const ROUTE_SLUGS = {
  Home: '/', Search: '/cars', MyTrips: '/trips', Favorites: '/favorites',
  Notifications: '/notifications', Profile: '/profile', Blogs: '/blogs',
  CarDetail: '/car', BookCar: '/book', BookingDetail: '/booking',
  BookingHistory: '/bookings', TrackBooking: '/track',
  CarsList: '/cars/list', Login: '/login', Register: '/register',
};

function screenToUrl(screen, params) {
  const base = ROUTE_SLUGS[screen] || '/';
  if (screen === 'BlogDetail' && params?.postId) return `${ROUTE_SLUGS.Blogs}/${params.postId}`;
  if (screen === 'CarDetail' && params?.carId) return `${base}/${params.carId}`;
  if (screen === 'BookCar' && params?.car?.id) return `${base}/${params.car.id}`;
  if (screen === 'BookingDetail' && params?.bookingId) return `${base}/${params.bookingId}`;
  if (screen === 'TrackBooking' && params?.bookingId) return `${base}/${params.bookingId}`;
  return base;
}

function urlToScreen(pathname) {
  if (!pathname || pathname === '/') return { tab: 'Home', stack: [] };
  const parts = pathname.split('/').filter(Boolean);
  const slug = '/' + parts[0];
  const param = parts[1];
  if (slug === '/blogs') {
    if (param) return { tab: 'Home', stack: [{ screen: 'BlogDetail', params: { postId: parseInt(param, 10) || param } }] };
    return { tab: 'Home', stack: [{ screen: 'Blogs', params: {} }] };
  }
  const reverseNav = { '/cars': 'Search', '/trips': 'MyTrips', '/favorites': 'Favorites',
    '/notifications': 'Notifications', '/profile': 'Profile',
    '/bookings': 'BookingHistory', '/login': 'Login', '/register': 'Register' };
  if (reverseNav[slug]) {
    const screen = reverseNav[slug];
    if (['Login', 'Register', 'BookingHistory', 'Blogs'].includes(screen))
      return { tab: 'Home', stack: [{ screen, params: {} }] };
    return { tab: screen, stack: [] };
  }
  if (slug === '/car' && param) return { tab: 'Search', stack: [{ screen: 'CarDetail', params: { carId: isNaN(param) ? param : parseInt(param) } }] };
  if (slug === '/book' && param) return { tab: 'Search', stack: [{ screen: 'BookCar', params: { car: { id: isNaN(param) ? param : parseInt(param) } } }] };
  if (slug === '/booking' && param) return { tab: 'Home', stack: [{ screen: 'BookingDetail', params: { bookingId: param } }] };
  if (slug === '/track' && param) return { tab: 'Home', stack: [{ screen: 'TrackBooking', params: { bookingId: param } }] };
  return { tab: 'Home', stack: [] };
}

const CITY_COVERAGE = [
  'Raipur', 'Nava Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 'Raigarh', 'Jagdalpur',
  'Ambikapur', 'Rajnandgaon', 'Dhamtari', 'Mahasamund', 'Kawardha', 'Janjgir', 'Champa',
  'Bhatapara', 'Balod', 'Bemetara', 'Gariaband', 'Mungeli', 'Surajpur', 'Jashpur',
  'Balrampur', 'Baikunthpur', 'Gaurela', 'Pendra', 'Marwahi', 'Sakti', 'Sarangarh',
  'Khairagarh', 'Manendragarh', 'Chirmiri', 'Kondagaon', 'Kanker', 'Narayanpur',
  'Dantewada', 'Bijapur', 'Sukma'
];

function upsertMeta(name, content, attr = 'name') {
  if (!content || typeof document === 'undefined') return;
  let element = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href || typeof document === 'undefined') return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(id, json) {
  if (!json || typeof document === 'undefined') return;
  let script = document.head.querySelector(`script[data-seo-id="${id}"]`);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-id', id);
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(json);
}

function WebSEO({ activeTab, screenStack }) {
  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') return;

    const topScreen = screenStack.length > 0 ? screenStack[screenStack.length - 1]?.screen : activeTab;
    const routeTitleMap = {
      Home: 'Travel Agency in Chhattisgarh | Car Booking Across 33 Districts',
      Search: 'Cars Available for Travel in Chhattisgarh | Book by City',
      CarsList: 'Car Rental in Raipur, Bilaspur, Durg, Bhilai & More',
      MyTrips: 'My Trips | Chhattisgarh Car Travel Bookings',
      Favorites: 'Favorite Cars | Chhattisgarh Travel Booking',
      BookingHistory: 'Travel Booking History | Chhattisgarh',
      BookingDetail: 'Booking Details | Chhattisgarh Travel Agency',
      TrackBooking: 'Track Car Booking Live | Chhattisgarh Travel',
      Profile: 'Customer Profile | Chhattisgarh Car Travel',
      Login: 'Login | Chhattisgarh Travel Agency',
      Register: 'Register | Chhattisgarh Travel Agency',
    };

    const title = routeTitleMap[topScreen] || routeTitleMap.Home;
    const cityLine = 'Raipur, Bilaspur, Durg, Bhilai, Korba, Raigarh, Jagdalpur, Ambikapur, Rajnandgaon, Dhamtari';
    const description = `Book reliable cars for travel across Chhattisgarh. Popular travel agency coverage in ${cityLine} and all 33 districts. Search cars, compare options, book trips, and track bookings live.`;
    const keywords = [
      'travel agency chhattisgarh',
      'cars available for travel',
      'car booking chhattisgarh',
      'car rental raipur',
      'cab service bilaspur',
      'outstation car bhilai durg',
      'nitiya travel agency',
      'best travel agency in chhattisgarh',
      'car hire jagdalpur ambikapur raigarh korba',
      'local and outstation travel chhattisgarh'
    ].join(', ');

    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : '';

    document.title = title;
    upsertMeta('description', description);
    upsertMeta('keywords', keywords);
    upsertMeta('robots', 'index, follow, max-image-preview:large');
    upsertMeta('geo.region', 'IN-CG');
    upsertMeta('geo.placename', 'Chhattisgarh');
    upsertMeta('ICBM', '21.2514,81.6296');
    upsertMeta('og:title', title, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:locale', 'en_IN', 'property');
    upsertMeta('og:site_name', 'Tours & Travel', 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);
    upsertLink('canonical', canonicalUrl);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TravelAgency',
          '@id': 'https://tours-and-travel.local/#agency',
          name: 'Tours & Travel',
          areaServed: CITY_COVERAGE.map((city) => ({ '@type': 'City', name: city, containedInPlace: 'Chhattisgarh' })),
          address: {
            '@type': 'PostalAddress',
            addressRegion: 'Chhattisgarh',
            addressCountry: 'IN'
          },
          serviceType: ['Car rental', 'Outstation travel', 'City travel booking']
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://tours-and-travel.local/#faq',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Do you provide cars for travel in all major cities of Chhattisgarh?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. We provide car travel options across Raipur, Bilaspur, Durg, Bhilai, Korba, Raigarh, Jagdalpur, Ambikapur and other cities across all 33 districts in Chhattisgarh.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I search for travel agency or cars available for travel and book online?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. You can search available cars, compare options, and book trips online directly from the website for city and outstation travel in Chhattisgarh.'
              }
            },
            {
              '@type': 'Question',
              name: 'I searched for Nitiya travel agency. Can I still book here?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. If you are searching travel options in Chhattisgarh, you can book here with live tracking, transparent pricing, and city-wise coverage.'
              }
            }
          ]
        }
      ]
    };

    upsertJsonLd('travel-agency-faq', jsonLd);
  }, [activeTab, screenStack]);

  return null;
}

/* ── Blogs Screen (inline) ── */
const BLOG_POSTS = [
  {
    id: 1,
    title: 'Top 10 Tourist Destinations in Chhattisgarh',
    summary: 'Explore Chitrakote Falls, Tirathgarh Waterfalls, Barnawapara Wildlife Sanctuary, and more popular tourist spots across all 33 districts.',
    content: 'Chhattisgarh offers a complete mix of nature, heritage, and adventure. Start with Chitrakote Falls, often called the Niagara of India, then move to Tirathgarh for layered cascades and lush forest surroundings. Add Barnawapara Wildlife Sanctuary for a jungle drive, Sirpur for archaeology and Buddhist heritage, and Mainpat for cool weather and viewpoints. A well-planned road route helps cover more places comfortably and safely in fewer days.',
    date: '2026-02-20',
    icon: 'compass',
    color: '#4A90D9',
  },
  {
    id: 2,
    title: 'Best Road Trips from Raipur',
    summary: 'Drive from Raipur to Jagdalpur via Kanker, explore tribal culture, waterfalls, and the stunning Kanger Valley National Park.',
    content: 'Raipur is the perfect starting point for scenic drives. The Raipur–Jagdalpur route through Kanker is a favorite because it combines good highways, food stops, and access to Bastar attractions. Start early, keep offline maps handy for hilly patches, and plan fuel breaks in advance. If you have extra time, include Kanger Valley and nearby waterfalls for a full weekend circuit.',
    date: '2026-02-15',
    icon: 'car-sport',
    color: '#34C759',
  },
  {
    id: 3,
    title: 'Travel Guide: Bilaspur to Ambikapur',
    summary: 'A scenic journey through Korba\'s industrial hub, Manendragarh\'s heritage, and up to the green hills of Ambikapur in Surguja district.',
    content: 'Bilaspur to Ambikapur is a rewarding long drive with changing landscapes. You pass urban belts, mining corridors, and greener mountain stretches as you move north. Keep your itinerary flexible to include tea breaks and short detours at viewpoints. In cooler months, road conditions and weather are ideal for family travel and photography.',
    date: '2026-02-10',
    icon: 'map',
    color: '#FF9500',
  },
  {
    id: 4,
    title: 'Why Choose a Travel Agency in Chhattisgarh?',
    summary: 'Benefits of booking through a trusted travel agency — verified cars, transparent pricing, live tracking, and 24/7 support across the state.',
    content: 'A local travel agency saves time and reduces risk because vehicles, pricing, and routes are verified in one place. Instead of coordinating multiple contacts, you get a single booking flow with clear fare details and support when plans change. For outstation trips, having live updates and emergency support is especially valuable.',
    date: '2026-02-05',
    icon: 'shield-checkmark',
    color: '#E8457C',
  },
  {
    id: 5,
    title: 'Monsoon Travel: Waterfall Circuit in Bastar',
    summary: 'Visit Chitrakote, Tirathgarh, Tamda Ghumar, and Mendri Ghumar waterfalls during the monsoon season. Best visited between July and October.',
    content: 'Bastar turns spectacular during monsoon, with waterfalls at peak flow and deep green landscapes. Keep buffer time in your schedule because rain can slow travel. Carry rain gear, non-slip footwear, and waterproof bags for electronics. Always follow local safety signage near viewpoints and avoid entering restricted water zones.',
    date: '2026-01-28',
    icon: 'water',
    color: '#0891B2',
  },
  {
    id: 6,
    title: 'Outstation Travel Tips for Chhattisgarh',
    summary: 'Planning an outstation trip? Learn about route planning, fuel stations, rest stops, and safety tips for driving across CG districts.',
    content: 'For long-distance travel, route planning is as important as vehicle choice. Confirm pickup timing, keep a list of major fuel stations, and avoid very late-night stretches in unfamiliar areas. Share trip details with family and keep emergency numbers handy. A short pre-trip checklist can prevent most avoidable delays on the road.',
    date: '2026-01-20',
    icon: 'bulb',
    color: '#F59E0B',
  },
];

const getBlogPreview = (text, maxLength = 110) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

function BlogsScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>
      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 }}>Travel Blog</Text>
        <Text style={{ fontSize: 14, color: C.textSec, marginBottom: 24 }}>
          Tips, guides, and stories about traveling across Chhattisgarh
        </Text>
        {BLOG_POSTS.map(post => (
          <View key={post.id} style={{
            backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 16,
            borderWidth: 1, borderColor: C.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12, backgroundColor: post.color + '15',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name={post.icon} size={22} color={post.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: C.text }}>{post.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{post.date}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: C.textSec, lineHeight: 22 }}>{getBlogPreview(post.summary)}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('BlogDetail', { postId: post.id })}
              activeOpacity={0.7}
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>Read more</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function BlogDetailScreen({ navigation, route }) {
  const postId = route?.params?.postId;
  const post = BLOG_POSTS.find(item => item.id === postId || String(item.id) === String(postId));

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 8 }}>Blog not found</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Blogs')} activeOpacity={0.7}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>Back to blogs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>
      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', padding: 20 }}>
        <View style={{
          backgroundColor: C.surface, borderRadius: 16, padding: 20,
          borderWidth: 1, borderColor: C.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12, backgroundColor: post.color + '15',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name={post.icon} size={22} color={post.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: C.text }}>{post.title}</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{post.date}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, color: C.textSec, lineHeight: 24 }}>{post.content || post.summary}</Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Contact Us Floating Button ── */
const CONTACT_PHONE = '+919876543210';

function ContactFloatingButton() {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999, alignItems: 'flex-end',
    }}>
      {expanded && (
        <View style={{
          backgroundColor: C.surface, borderRadius: 14, padding: 6, marginBottom: 10,
          borderWidth: 1, borderColor: C.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
        }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
              paddingVertical: 12, borderRadius: 10,
            }}
            onPress={() => { Linking.openURL(`tel:${CONTACT_PHONE}`); setExpanded(false); }}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={18} color="#34C759" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.text }}>Call Us</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 8 }} />
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
              paddingVertical: 12, borderRadius: 10,
            }}
            onPress={() => {
              Linking.openURL(`https://wa.me/${CONTACT_PHONE.replace('+', '')}?text=Hi%2C%20I%20need%20help%20with%20booking`);
              setExpanded(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.text }}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={{
          width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366',
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
          ...(isWeb ? { cursor: 'pointer' } : {}),
        }}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Ionicons name={expanded ? 'close' : 'chatbubble-ellipses'} size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

/* ── Web Top Navbar ── */
function WebTopNav({ activeTab, onNavigate }) {
  const { user, logout } = useAuth();
  const nav = user ? NAV_AUTH : NAV_GUEST;

  return (
    <View style={w.topBar}>
      <View style={w.topInner}>
        {/* Logo */}
        <TouchableOpacity style={w.logo} onPress={() => onNavigate('Home')} activeOpacity={0.7}>
          <View style={w.logoIcon}>
            <Ionicons name="car-sport" size={18} color={C.surface} />
          </View>
          <Text style={w.logoText}>Tours & Travel</Text>
        </TouchableOpacity>

        {/* Nav Links */}
        <View style={w.navLinks}>
          {nav.slice(0, 4).map(item => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={w.navLink}
                onPress={() => onNavigate(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[w.navLinkText, active && w.navLinkActive]}>
                  {item.label}
                </Text>
                {active && <View style={w.navIndicator} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={w.navLink} onPress={() => onNavigate('Blogs')} activeOpacity={0.7}>
            <Text style={w.navLinkText}>Blogs</Text>
          </TouchableOpacity>
        </View>

        {/* Right */}
        <View style={w.navRight}>
          {user ? (
            <>
              <TouchableOpacity style={w.iconBtn} onPress={() => onNavigate('Notifications')}>
                <Ionicons name="notifications-outline" size={18} color={C.textSec} />
              </TouchableOpacity>
              <TouchableOpacity style={w.profileChip} onPress={() => onNavigate('Profile')} activeOpacity={0.7}>
                <View style={w.avatar}>
                  <Text style={w.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
                <Text style={w.profileName}>{user?.name?.split(' ')[0] || 'User'}</Text>
                <Ionicons name="chevron-down" size={14} color={C.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={w.logoutBtn} onPress={logout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={16} color={C.danger} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={w.signInBtn} onPress={() => onNavigate('Login')} activeOpacity={0.7}>
                <Text style={w.signInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={w.signUpBtn} onPress={() => onNavigate('Register')} activeOpacity={0.7}>
                <Text style={w.signUpText}>Get Started</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/* ── Web Layout ── */
function WebLayout() {
  const { user } = useAuth();

  // Determine initial state from URL
  const initialState = isWeb && typeof window !== 'undefined'
    ? urlToScreen(window.location.pathname)
    : { tab: 'Home', stack: [] };

  const [activeTab, setActiveTab] = useState(initialState.tab);
  const [screenStack, setScreenStack] = useState(initialState.stack);
  const nav = user ? NAV_AUTH : NAV_GUEST;

  // Update URL when navigation changes
  const pushUrl = (screen, params) => {
    if (!isWeb || typeof window === 'undefined') return;
    const url = screenToUrl(screen, params);
    if (window.location.pathname !== url) {
      window.history.pushState({ screen, params }, '', url);
    }
  };

  // Handle browser back/forward
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    const handlePopState = () => {
      const { tab, stack } = urlToScreen(window.location.pathname);
      setActiveTab(tab);
      setScreenStack(stack);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (screen, params) => {
    if (screen === 'Login' || screen === 'Register') {
      setScreenStack(prev => [...prev, { screen, params }]);
      pushUrl(screen, params);
      return;
    }
    const navItem = nav.find(i => i.key === screen);
    if (navItem) {
      setActiveTab(screen);
      setScreenStack([]);
      pushUrl(screen, params);
    } else if (screen === 'Blogs' || screen === 'BlogDetail') {
      setScreenStack(prev => [...prev, { screen, params }]);
      pushUrl(screen, params);
    } else if (DETAIL_SCREENS[screen]) {
      setScreenStack(prev => [...prev, { screen, params }]);
      pushUrl(screen, params);
    }
  };

  const goBack = () => {
    setScreenStack(prev => {
      const next = prev.slice(0, -1);
      if (next.length > 0) {
        const top = next[next.length - 1];
        pushUrl(top.screen, top.params);
      } else {
        pushUrl(activeTab);
      }
      return next;
    });
  };

  const navigation = {
    navigate, goBack, setOptions: () => {},
    replace: (screen, params) => setScreenStack(prev => [...prev.slice(0, -1), { screen, params }]),
    canGoBack: () => screenStack.length > 0,
  };

  let CurrentScreen, currentParams = {};
  if (screenStack.length > 0) {
    const top = screenStack[screenStack.length - 1];
    if (top.screen === 'Blogs') {
      CurrentScreen = BlogsScreen;
    } else if (top.screen === 'BlogDetail') {
      CurrentScreen = BlogDetailScreen;
    } else {
      CurrentScreen = DETAIL_SCREENS[top.screen];
    }
    currentParams = top.params || {};
  } else {
    const found = nav.find(i => i.key === activeTab);
    CurrentScreen = found?.component || HomeScreen;
  }

  // Clear auth screens after login
  const isAuthScreen = screenStack.length > 0 &&
    ['Login', 'Register'].includes(screenStack[screenStack.length - 1].screen);
  if (user && isAuthScreen) {
    setTimeout(() => {
      setScreenStack(prev => prev.filter(s => !['Login', 'Register'].includes(s.screen)));
      if (isWeb && typeof window !== 'undefined') window.history.replaceState({}, '', '/');
    }, 0);
  }

  // Set initial URL on mount
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined' && window.location.pathname === '/') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  return (
    <View style={w.layout}>
      <WebSEO activeTab={activeTab} screenStack={screenStack} />
      <WebTopNav activeTab={activeTab} onNavigate={navigate} />
      <View style={w.main}>
        {screenStack.length > 0 && (
          <TouchableOpacity style={w.backBar} onPress={goBack} activeOpacity={0.6}>
            <Ionicons name="chevron-back" size={18} color={C.textSec} />
            <Text style={w.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={w.content}>
          <CurrentScreen navigation={navigation} route={{ params: currentParams }} />
        </View>
      </View>
      {isWeb && <ContactFloatingButton />}
    </View>
  );
}

/* ── Mobile Stack ── */
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CarsList" component={CarsListScreen} options={{ title: 'Available Cars' }} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookCar" component={BookCarScreen} options={{ title: 'Book Car' }} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking Details' }} />
      <Stack.Screen name="TrackBooking" component={TrackBookingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false, presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

/* ── Root ── */
function RootNavigator() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={s.splash}>
        <View style={s.splashIcon}>
          <Ionicons name="car-sport" size={28} color={C.surface} />
        </View>
        <Text style={s.splashTitle}>Tours & Travel</Text>
      </View>
    );
  }
  return isWeb ? <WebLayout /> : <AppStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {isWeb ? (
          <><StatusBar style="dark" /><RootNavigator /></>
        ) : (
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/* ── Shared styles ── */
const s = StyleSheet.create({
  splash: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg,
  },
  splashIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  splashTitle: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  guestWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, padding: 24,
  },
  guestCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 40,
    alignItems: 'center', width: '100%', maxWidth: 380,
    borderWidth: 1, borderColor: C.border,
  },
  guestIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  guestTitle: { fontSize: 20, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  guestMsg: {
    fontSize: 14, color: C.textSec, textAlign: 'center',
    marginTop: 8, marginBottom: 28, lineHeight: 20,
  },
  guestBtn: {
    backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14,
    paddingHorizontal: 40, width: '100%', alignItems: 'center',
  },
  guestBtnText: { fontSize: 15, fontWeight: '600', color: C.surface },
  guestLinkText: { fontSize: 13, fontWeight: '500', color: C.accent },
});

/* ── Web styles ── */
const w = StyleSheet.create({
  layout: { flex: 1, backgroundColor: C.bg },
  topBar: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...(isWeb ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
  },
  topInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, height: 56,
    maxWidth: 900, width: '100%', alignSelf: 'center',
  },
  logo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 40,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  navLinks: { flexDirection: 'row', flex: 1, gap: 6 },
  navLink: {
    paddingHorizontal: 16, paddingVertical: 16, position: 'relative',
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  navLinkText: { fontSize: 14, fontWeight: '500', color: C.textMuted },
  navLinkActive: { color: C.text, fontWeight: '600' },
  navIndicator: {
    position: 'absolute', bottom: 0, left: 16, right: 16,
    height: 2, backgroundColor: C.primary, borderRadius: 1,
  },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.bg,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: C.surface },
  profileName: { fontSize: 13, fontWeight: '500', color: C.text },
  logoutBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  signInBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  signInText: { fontSize: 13, fontWeight: '500', color: C.text },
  signUpBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.primary,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  signUpText: { fontSize: 13, fontWeight: '600', color: C.surface },
  main: { flex: 1, maxWidth: 900, width: '100%', alignSelf: 'center' },
  backBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 28, paddingVertical: 10,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  backText: { fontSize: 13, fontWeight: '500', color: C.textSec },
  content: { flex: 1 },
});
