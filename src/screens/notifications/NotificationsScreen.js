import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { notificationsAPI } from '../../services/api';

const TYPE_CONFIG = {
  booking: { icon: 'receipt-outline', color: COLORS.accent },
  payment: { icon: 'card-outline', color: COLORS.success },
  driver: { icon: 'car-outline', color: '#6C63FF' },
  promo: { icon: 'pricetag-outline', color: '#FF9800' },
  system: { icon: 'information-circle-outline', color: COLORS.textLight },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getNotifications();
      setNotifications(data?.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={() => handleMarkRead(item.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.title, !item.is_read && styles.titleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.dot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header Action */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAll} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={18} color={COLORS.accent} />
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { padding: SIZES.padding },
  markAll: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end',
    paddingHorizontal: SIZES.padding, paddingTop: 12,
  },
  markAllText: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.accent },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.divider, gap: 12,
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: SIZES.base, fontWeight: '500', color: COLORS.text, flex: 1 },
  titleBold: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  message: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 4, lineHeight: 18 },
  time: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6 },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: SIZES.base, color: COLORS.textLight, marginTop: 6 },
});
