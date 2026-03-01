import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // After successful login, go back to where user came from
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      showAlert('Login Failed', err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, Platform.OS !== 'web' && { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="car-sport" size={24} color="#FFF" />
          </View>
          <Text style={styles.appName}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={{ fontWeight: '600', color: COLORS.accent }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.demoText}>Demo: rahul@gmail.com / password123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1, padding: SIZES.padding,
    ...(Platform.OS === 'web' ? { alignItems: 'center', paddingTop: 48 } : { justifyContent: 'center' }),
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  appName: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.paddingLg,
    borderWidth: 1, borderColor: COLORS.divider,
    ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 400 } : {}),
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: SIZES.sm, color: COLORS.text, paddingVertical: 13 },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14,
    alignItems: 'center', marginTop: 6,
  },
  loginBtnText: { fontSize: SIZES.base, fontWeight: '600', color: '#FFF' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerLinkText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  demoHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 20, backgroundColor: COLORS.background, padding: 10,
    borderRadius: SIZES.radius,
  },
  demoText: { fontSize: SIZES.xs, color: COLORS.textLight },
});
