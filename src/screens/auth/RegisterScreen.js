import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { locationsAPI } from '../../services/api';
import { showAlert } from '../../utils/alert';

const isWeb = Platform.OS === 'web';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State & City
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [stateIsFocus, setStateIsFocus] = useState(false);
  const [cityIsFocus, setCityIsFocus] = useState(false);

  useEffect(() => {
    locationsAPI.getStates().then(r => setStates(r.data?.states || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedState) {
      locationsAPI.getCities(selectedState.id).then(r => setCities(r.data?.cities || [])).catch(() => {});
    }
  }, [selectedState]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Error', 'Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(
        name.trim(), email.trim().toLowerCase(), password, phone.trim(),
        selectedState?.id, selectedCity?.id,
      );
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      showAlert('Registration Failed', err.response?.data?.message || err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, Platform.OS !== 'web' && { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {!isWeb && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Fill in your details to get started</Text>
        </View>

        <View style={styles.card}>
          <InputField icon="person-outline" placeholder="Full Name *" value={name} onChangeText={setName} />
          <InputField icon="mail-outline" placeholder="Email Address *" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" />
          <InputField icon="call-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" />

          {/* State Dropdown */}
          <View style={[styles.ddWrapper, { zIndex: stateIsFocus ? 200 : 2 }]}>
            <Dropdown
              style={[styles.ddDropdown, stateIsFocus && styles.ddFocused]}
              placeholderStyle={styles.ddPlaceholder}
              selectedTextStyle={styles.ddSelectedText}
              containerStyle={styles.ddContainer}
              itemTextStyle={styles.ddItemText}
              activeColor={COLORS.accentLight}
              data={states}
              maxHeight={200}
              labelField="name"
              valueField="id"
              placeholder="Select State"
              value={selectedState?.id}
              onFocus={() => setStateIsFocus(true)}
              onBlur={() => setStateIsFocus(false)}
              onChange={item => {
                setSelectedState(item); setSelectedCity(null); setCities([]);
                setStateIsFocus(false);
              }}
              renderLeftIcon={() => (
                <Ionicons name="map-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
              )}
            />
          </View>

          {/* City Dropdown */}
          {selectedState && (
            <View style={[styles.ddWrapper, { zIndex: cityIsFocus ? 100 : 1 }]}>
              <Dropdown
                style={[styles.ddDropdown, cityIsFocus && styles.ddFocused]}
                placeholderStyle={styles.ddPlaceholder}
                selectedTextStyle={styles.ddSelectedText}
                containerStyle={styles.ddContainer}
                itemTextStyle={styles.ddItemText}
                activeColor={COLORS.accentLight}
                data={cities}
                maxHeight={200}
                labelField="name"
                valueField="id"
                placeholder="Select City"
                value={selectedCity?.id}
                onFocus={() => setCityIsFocus(true)}
                onBlur={() => setCityIsFocus(false)}
                onChange={item => { setSelectedCity(item); setCityIsFocus(false); }}
                renderLeftIcon={() => (
                  <Ionicons name="location-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                )}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          <InputField icon="lock-open-outline" placeholder="Confirm Password *" value={confirmPassword}
            onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ fontWeight: '600', color: COLORS.accent }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ icon, ...props }) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={18} color={COLORS.textLight} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.textLight}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1, padding: SIZES.padding,
    ...(isWeb ? { alignItems: 'center', paddingTop: 24 } : {}),
  },
  header: {
    paddingTop: isWeb ? 0 : 60,
    paddingBottom: 10,
    ...(isWeb ? { width: '100%', maxWidth: 420 } : {}),
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.paddingLg,
    borderWidth: 1, borderColor: COLORS.divider, marginTop: 16,
    ...(isWeb ? { width: '100%', maxWidth: 420 } : {}),
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, paddingVertical: 13 },

  /* Dropdowns (react-native-element-dropdown) */
  ddWrapper: { position: 'relative', marginBottom: 12 },
  ddDropdown: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  ddFocused: { borderColor: COLORS.accent },
  ddPlaceholder: { fontSize: SIZES.sm, color: COLORS.textLight },
  ddSelectedText: { fontSize: SIZES.sm, color: COLORS.text },
  ddContainer: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.divider,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 8,
  },
  ddItemText: { fontSize: SIZES.sm, color: COLORS.text, paddingVertical: 2 },

  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14,
    alignItems: 'center', marginTop: 6,
  },
  registerBtnText: { fontSize: SIZES.base, fontWeight: '600', color: '#FFF' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
