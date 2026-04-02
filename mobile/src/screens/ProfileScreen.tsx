import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const ProfileScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();
  const profile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken ? { sessionToken } : 'skip',
  );
  const notifications = useQuery(
    api.modules.portal.student.queries.getMyNotifications,
    sessionToken ? { sessionToken, limit: 5 } : 'skip',
  );
  const resolvedProfile = useCachedQueryValue<any>('student.profile.summary', profile);
  const resolvedNotifications = useCachedQueryValue<any[]>(
    'student.profile.notifications',
    notifications,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view your profile.</Text>;
  }

  if (!resolvedProfile || !resolvedNotifications) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached profile details.</Text>}
      <View style={styles.profileCard}>
        <Text style={styles.name}>
          {[resolvedProfile.firstName, resolvedProfile.lastName].filter(Boolean).join(' ') || user?.email}
        </Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>Admission No: {resolvedProfile.admissionNumber ?? 'Not set'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent notifications</Text>
      {resolvedNotifications.length === 0 ? (
        <Text style={styles.stateText}>No notifications yet.</Text>
      ) : (
        resolvedNotifications.map((notification: any) => (
          <View key={notification._id} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationBody}>{notification.message}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
    paddingVertical: theme.spacing.sm,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  notificationCard: {
    backgroundColor: '#fff7ed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  notificationTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  notificationBody: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
});

export default ProfileScreen;
