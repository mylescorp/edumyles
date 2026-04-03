import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const GradesScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentGrades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const parentChildren = useQuery(
    api.modules.portal.parent.queries.getChildren,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );

  const resolvedStudentGrades = useCachedQueryValue<any[]>('student.grades.list', studentGrades);
  const resolvedParentChildren = useCachedQueryValue<any[]>('parent.children.list', parentChildren);
  const resolvedTeacherClasses = useCachedQueryValue<any[]>('teacher.classes.list', teacherClasses);

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === 'parent') {
    if (!resolvedParentChildren) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached children data.</Text>}
        {resolvedParentChildren.length === 0 ? (
          <Text style={styles.stateText}>No children are linked to this account yet.</Text>
        ) : (
          resolvedParentChildren.map((child: any) => (
            <View key={child._id} style={styles.card}>
              <Text style={styles.subject}>
                {[child.firstName, child.lastName].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.meta}>Admission: {child.admissionNumber ?? 'Not assigned'}</Text>
              <Text style={styles.meta}>Class: {child.classId ?? 'Pending class assignment'}</Text>
              <Text style={styles.meta}>Status: {child.status ?? 'active'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherClasses) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached class data.</Text>}
        {resolvedTeacherClasses.length === 0 ? (
          <Text style={styles.stateText}>No classes are assigned to you yet.</Text>
        ) : (
          resolvedTeacherClasses.map((classItem: any) => (
            <View key={classItem._id} style={styles.card}>
              <Text style={styles.subject}>{classItem.name}</Text>
              <Text style={styles.meta}>Grade: {classItem.grade ?? '—'}</Text>
              <Text style={styles.meta}>Students: {classItem.studentCount ?? 0}</Text>
              <Text style={styles.meta}>Status: {classItem.status ?? 'active'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentGrades) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedStudentGrades.length === 0) {
    return <Text style={styles.stateText}>No grades have been published yet.</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached grades.</Text>}
      {resolvedStudentGrades.map((grade: any) => (
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
