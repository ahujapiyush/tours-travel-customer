import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { showAlert } from '../../utils/alert';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      showAlert('Error', 'Name is required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data?.user || data);
      setEditing(false);
      showAlert('Success', 'Profile updated');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        {!editing ? (
          <>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
            {user?.address && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.userAddress}>{user.address}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={14} color={COLORS.accent} />
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={form.address}
              onChangeText={v => setForm(f => ({ ...f, address: v }))}
              placeholder="Address"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={2}
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" size="small" /> :
                  <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <MenuItem icon="receipt-outline" label="My Bookings" onPress={() => navigation.navigate('BookingHistory')} />
        <MenuItem icon="heart-outline" label="Favorites" onPress={() => navigation.navigate('Favorites')} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        <MenuItem icon="information-circle-outline" label="About" onPress={() => {}} last />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, last }) {
  return (
    <TouchableOpacity style={[styles.menuItem, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface, paddingTop: 60, paddingBottom: 28,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: SIZES.xl, fontWeight: '700', color: '#FFF' },
  userName: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  userPhone: { fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  userAddress: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusFull, marginTop: 14,
    borderWidth: 1, borderColor: COLORS.divider, backgroundColor: COLORS.background,
  },
  editText: { fontSize: SIZES.xs, fontWeight: '500', color: COLORS.accent },
  editForm: { width: '80%', marginTop: 10 },
  input: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: SIZES.sm,
    color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: COLORS.divider,
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelEditBtn: {
    flex: 1, paddingVertical: 12, borderRadius: SIZES.radius, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.divider,
  },
  cancelEditText: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.textSecondary },
  saveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: SIZES.radius, alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  saveText: { fontSize: SIZES.sm, fontWeight: '600', color: '#FFF' },
  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, marginHorizontal: SIZES.padding,
    marginTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider,
  },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuLabel: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, marginHorizontal: SIZES.padding,
    padding: SIZES.padding, marginTop: 20, borderWidth: 1, borderColor: COLORS.danger + '20',
  },
  logoutText: { fontSize: SIZES.sm, fontWeight: '500', color: COLORS.danger },
});
