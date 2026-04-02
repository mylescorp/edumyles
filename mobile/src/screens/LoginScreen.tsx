import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

const LoginScreen: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, sessionToken);
    } catch (error) {
      Alert.alert('Sign-in failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>EM</Text>
          </View>
          <Text style={styles.title}>EduMyles Mobile</Text>
          <Text style={styles.subtitle}>
            Sign in with the same email you use on the web portal, then paste your current
            session token to unlock student data on this device.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="student@school.edu"
            placeholderTextColor={theme.colors.textLight}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Session Token</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Paste your active EduMyles session token"
            placeholderTextColor={theme.colors.textLight}
            style={[styles.input, styles.tokenInput]}
            value={sessionToken}
            onChangeText={setSessionToken}
          />

          <TouchableOpacity
            disabled={isLoading}
            onPress={handleLogin}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  hero: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
  },
  tokenInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.base,
    fontWeight: '700',
  },
});

export default LoginScreen;
