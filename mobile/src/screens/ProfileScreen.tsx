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

  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const studentNotifications = useQuery(
    api.modules.portal.student.queries.getMyNotifications,
    sessionToken && user?.role === 'student' ? { sessionToken, limit: 5 } : 'skip',
  );
  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const parentAnnouncements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherProfile = useQuery(
    api.modules.hr.queries.getCurrentStaffProfile,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherNotifications = useQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken && user?.role === 'teacher' ? { sessionToken, limit: 5 } : 'skip',
  );

  const resolvedStudentProfile = useCachedQueryValue<any>('student.profile.summary', studentProfile);
  const resolvedStudentNotifications = useCachedQueryValue<any[]>(
    'student.profile.notifications',
    studentNotifications,
  );
  const resolvedParentProfile = useCachedQueryValue<any>('parent.profile.summary', parentProfile);
  const resolvedParentAnnouncements = useCachedQueryValue<any[]>(
    'parent.profile.announcements',
    parentAnnouncements,
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>('teacher.profile.classes', teacherClasses);
  const resolvedTeacherProfile = useCachedQueryValue<any>('teacher.profile.staffRecord', teacherProfile);
  const resolvedTeacherNotifications = useCachedQueryValue<any[]>(
    'teacher.profile.notifications',
    teacherNotifications,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view your profile.</Text>;
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
        {isOffline && <Text style={styles.banner}>Showing cached profile details.</Text>}
        <View style={styles.profileCard}>
          <Text style={styles.name}>
            {resolvedParentProfile?.fullName ?? resolvedParentProfile?.name ?? user.email}
          </Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>Role: parent</Text>
          <Text style={styles.meta}>
            Contact: {resolvedParentProfile?.phone ?? resolvedParentProfile?.contactPhone ?? 'Not set'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent school updates</Text>
        {resolvedParentAnnouncements.length === 0 ? (
          <Text style={styles.stateText}>No announcements yet.</Text>
        ) : (
          resolvedParentAnnouncements.slice(0, 5).map((notification: any) => (
            <View key={notification._id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationBody}>{notification.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherClasses || !resolvedTeacherNotifications) {
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
            {resolvedTeacherProfile
              ? [resolvedTeacherProfile.firstName, resolvedTeacherProfile.lastName].filter(Boolean).join(' ')
              : user.email}
          </Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>Role: teacher</Text>
          <Text style={styles.meta}>Classes assigned: {resolvedTeacherClasses.length}</Text>
          <Text style={styles.meta}>
            Staff ID: {resolvedTeacherProfile?.employeeId ?? 'Not set'}
          </Text>
          <Text style={styles.meta}>
            Department: {resolvedTeacherProfile?.department ?? 'Not set'}
          </Text>
          <Text style={styles.meta}>
            Qualification: {resolvedTeacherProfile?.qualification ?? 'Not set'}
          </Text>
          <Text style={styles.meta}>
            Phone: {resolvedTeacherProfile?.phone ?? 'Not set'}
          </Text>
          <Text style={styles.meta}>
            Status: {resolvedTeacherProfile?.status ?? 'active'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent notifications</Text>
        {resolvedTeacherNotifications.length === 0 ? (
          <Text style={styles.stateText}>No notifications yet.</Text>
        ) : (
          resolvedTeacherNotifications.map((notification: any) => (
            <View key={notification._id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationBody}>{notification.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentProfile || !resolvedStudentNotifications) {
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
          {[resolvedStudentProfile.firstName, resolvedStudentProfile.lastName].filter(Boolean).join(' ') || user?.email}
        </Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>Admission No: {resolvedStudentProfile.admissionNumber ?? 'Not set'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent notifications</Text>
      {resolvedStudentNotifications.length === 0 ? (
        <Text style={styles.stateText}>No notifications yet.</Text>
      ) : (
        resolvedStudentNotifications.map((notification: any) => (
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
