import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const AttendanceScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentAttendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const parentAnnouncements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherTodayClasses = useQuery(
    api.modules.academics.queries.getTeacherTodayClassesCount,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );

  const resolvedStudentAttendance = useCachedQueryValue<any[]>(
    'student.attendance.list',
    studentAttendance,
  );
  const resolvedParentAnnouncements = useCachedQueryValue<any[]>(
    'parent.announcements.list',
    parentAnnouncements,
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>('teacher.classes.attendance', teacherClasses);
  const resolvedTeacherTodayClasses = useCachedQueryValue<number>(
    'teacher.attendance.todayCount',
    teacherTodayClasses,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === 'parent') {
    if (!resolvedParentAnnouncements) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached school updates.</Text>}
        {resolvedParentAnnouncements.length === 0 ? (
          <Text style={styles.stateText}>No school updates are available yet.</Text>
        ) : (
          resolvedParentAnnouncements.map((announcement: any) => (
            <View key={announcement._id} style={styles.card}>
              <Text style={styles.status}>{announcement.title}</Text>
              <Text style={styles.meta}>{announcement.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherClasses || resolvedTeacherTodayClasses === undefined) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached attendance prep data.</Text>}
        <View style={styles.summaryCard}>
          <Text style={styles.status}>{resolvedTeacherTodayClasses}</Text>
          <Text style={styles.meta}>Classes need attendance attention today</Text>
        </View>
        {resolvedTeacherClasses.length === 0 ? (
          <Text style={styles.stateText}>No classes are assigned to you yet.</Text>
        ) : (
          resolvedTeacherClasses.map((classItem: any) => (
            <View key={classItem._id} style={styles.card}>
              <Text style={styles.status}>{classItem.name}</Text>
              <Text style={styles.meta}>
                Grade {classItem.grade ?? '—'} • {classItem.studentCount ?? 0} students
              </Text>
              <Text style={styles.meta}>Use the web portal for detailed attendance entry.</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentAttendance) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedStudentAttendance.length === 0) {
    return <Text style={styles.stateText}>No attendance records are available yet.</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached attendance.</Text>}
      {resolvedStudentAttendance.map((entry: any) => (
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
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
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
