import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const AttendanceScreen: React.FC = () => {
  const { sessionToken } = useAuth();
  const { isOffline } = useOfflineSync();
  const attendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    sessionToken ? { sessionToken } : 'skip',
  );
  const resolvedAttendance = useCachedQueryValue<any[]>(
    'student.attendance.list',
    attendance,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view attendance.</Text>;
  }

  if (!resolvedAttendance) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedAttendance.length === 0) {
    return <Text style={styles.stateText}>No attendance records are available yet.</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached attendance.</Text>}
      {resolvedAttendance.map((entry: any) => (
        <View key={entry._id} style={styles.card}>
          <Text style={styles.status}>{String(entry.status).toUpperCase()}</Text>
          <Text style={styles.meta}>{entry.date}</Text>
          {entry.remarks ? <Text style={styles.meta}>{entry.remarks}</Text> : null}
        </View>
      ))}
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
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  status: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.base,
    fontWeight: '800',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
});

export default AttendanceScreen;
