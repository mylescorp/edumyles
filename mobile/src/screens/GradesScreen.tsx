import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const GradesScreen: React.FC = () => {
  const { sessionToken } = useAuth();
  const { isOffline } = useOfflineSync();
  const grades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    sessionToken ? { sessionToken } : 'skip',
  );
  const resolvedGrades = useCachedQueryValue<any[]>('student.grades.list', grades);

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view grades.</Text>;
  }

  if (!resolvedGrades) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedGrades.length === 0) {
    return <Text style={styles.stateText}>No grades have been published yet.</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached grades.</Text>}
      {resolvedGrades.map((grade: any) => (
        <View key={grade._id} style={styles.card}>
          <Text style={styles.subject}>{grade.subjectName ?? 'Subject'}</Text>
          <Text style={styles.score}>{grade.score}%</Text>
          <Text style={styles.meta}>
            {grade.term} • {grade.academicYear}
          </Text>
          <Text style={styles.meta}>Grade: {grade.grade}</Text>
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
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subject: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  score: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
    marginVertical: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
  },
});

export default GradesScreen;
