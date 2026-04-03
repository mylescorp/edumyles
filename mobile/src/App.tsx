import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { ConvexProvider, ConvexReactClient, useConvex } from 'convex/react';

import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import GradesScreen from './screens/GradesScreen';
import AssignmentsScreen from './screens/AssignmentsScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import FeesScreen from './screens/FeesScreen';
import ProfileScreen from './screens/ProfileScreen';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useOfflineSync } from './hooks/useOfflineSync';
import {
  initializePushNotifications,
  registerForPushNotificationsAsync,
  registerMobileDeviceTokenMutation,
  syncPushTokenWithBackend,
} from './services/pushNotifications';
import { theme } from './theme';

type ScreenKey = 'dashboard' | 'grades' | 'assignments' | 'attendance' | 'fees' | 'profile';
type RoleTab = { key: ScreenKey; label: string };

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? '';
const ConvexProviderRoot = ConvexProvider as React.ComponentType<{
  client: ConvexReactClient;
  children?: React.ReactNode;
}>;

const AppShell: React.FC = () => {
  const convex = useConvex();
  const { isAuthenticated, isLoading, sessionToken, user, signOut } = useAuth();
  const [screen, setScreen] = useState<ScreenKey>('dashboard');
  const {
    isOffline,
    isSyncing,
    pendingMutations,
    queueMutation,
  } = useOfflineSync({
    mutationHandlers: {
      'mobileDeviceToken.register': async (payload) => {
        await convex.mutation(registerMobileDeviceTokenMutation, payload as any);
      },
    },
  });

  useEffect(() => {
    initializePushNotifications();
  }, []);

  useEffect(() => {
    const syncPushRegistration = async () => {
      if (!sessionToken) return;

      const registration = await registerForPushNotificationsAsync();
      if (!registration) return;

      const payload = {
        sessionToken,
        pushToken: registration.pushToken,
        provider: registration.provider,
        platform: registration.platform,
        deviceName: registration.deviceName ?? `${Platform.OS}-device`,
        notificationsEnabled: registration.notificationsEnabled,
      };

      if (isOffline) {
        await queueMutation('mobileDeviceToken.register', payload);
        return;
      }

      await syncPushTokenWithBackend({
        registerDeviceToken: (args) => convex.mutation(registerMobileDeviceTokenMutation, args),
        sessionToken,
        registration: {
          ...registration,
          deviceName: registration.deviceName ?? `${Platform.OS}-device`,
        },
      });
    };

    void syncPushRegistration();
  }, [convex, isOffline, queueMutation, sessionToken]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading EduMyles...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const roleTabs: Record<string, RoleTab[]> = {
    parent: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'grades', label: 'Children' },
      { key: 'assignments', label: 'Messages' },
      { key: 'attendance', label: 'Updates' },
      { key: 'fees', label: 'Payments' },
      { key: 'profile', label: 'Profile' },
    ],
    teacher: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'grades', label: 'Classes' },
      { key: 'assignments', label: 'Assignments' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'fees', label: 'Timetable' },
      { key: 'profile', label: 'Profile' },
    ],
    student: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'grades', label: 'Grades' },
      { key: 'assignments', label: 'Assignments' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'fees', label: 'Fees' },
      { key: 'profile', label: 'Profile' },
    ],
  };

  const activeTabs = roleTabs[user?.role ?? 'student'] ?? roleTabs.student;
  const mobileTitle =
    user?.role === 'parent'
      ? 'EduMyles Parent'
      : user?.role === 'teacher'
        ? 'EduMyles Teacher'
        : 'EduMyles Mobile';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{mobileTitle}</Text>
          <Text style={styles.headerSubtitle}>{user?.email ?? 'Signed in'}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {(isOffline || pendingMutations > 0 || isSyncing) && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>
            {isOffline
              ? `Offline mode active${pendingMutations > 0 ? ` • ${pendingMutations} change(s) queued` : ''}`
              : isSyncing
                ? 'Syncing offline changes...'
                : `${pendingMutations} queued change(s) ready to sync`}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {activeTabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setScreen(key)}
            style={[styles.tab, screen === key && styles.activeTab]}
          >
            <Text style={[styles.tabText, screen === key && styles.activeTabText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.screenContainer}>
        {screen === 'dashboard' && <DashboardScreen onNavigate={setScreen} />}
        {screen === 'grades' && <GradesScreen />}
        {screen === 'assignments' && <AssignmentsScreen />}
        {screen === 'attendance' && <AttendanceScreen />}
        {screen === 'fees' && <FeesScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </View>
    </SafeAreaView>
  );
};

const App: React.FC = () => {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProviderRoot client={convex}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ConvexProviderRoot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#dbeafe',
    fontSize: theme.fontSizes.sm,
    marginTop: 4,
  },
  syncBanner: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  syncBannerText: {
    color: '#9a3412',
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  signOutText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  tabBar: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.white,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
