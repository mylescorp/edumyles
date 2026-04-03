import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

type ScreenKey = 'dashboard' | 'grades' | 'assignments' | 'attendance' | 'fees' | 'profile';

const DashboardScreen: React.FC<{ onNavigate: (screen: ScreenKey) => void }> = ({ onNavigate }) => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const studentGrades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const studentAssignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    sessionToken && user?.role === 'student' ? { sessionToken, limit: 5 } : 'skip',
  );
  const studentAttendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const studentWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );

  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const parentChildren = useQuery(
    api.modules.portal.parent.queries.getChildren,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const parentFeeOverview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );

  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherAssignmentsCount = useQuery(
    api.modules.academics.queries.getTeacherActiveAssignmentsCount,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherTodayClasses = useQuery(
    api.modules.academics.queries.getTeacherTodayClassesCount,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );

  const resolvedStudentProfile = useCachedQueryValue<any>('student.dashboard.profile', studentProfile);
  const resolvedStudentGrades = useCachedQueryValue<any[]>('student.dashboard.grades', studentGrades);
  const resolvedStudentAssignments = useCachedQueryValue<any[]>(
    'student.dashboard.assignments',
    studentAssignments,
  );
  const resolvedStudentAttendance = useCachedQueryValue<any[]>(
    'student.dashboard.attendance',
    studentAttendance,
  );
  const resolvedStudentWallet = useCachedQueryValue<any>('student.dashboard.wallet', studentWallet);
  const resolvedParentProfile = useCachedQueryValue<any>('parent.dashboard.profile', parentProfile);
  const resolvedParentChildren = useCachedQueryValue<any[]>('parent.dashboard.children', parentChildren);
  const resolvedParentFeeOverview = useCachedQueryValue<any[]>(
    'parent.dashboard.feeOverview',
    parentFeeOverview,
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>(
    'teacher.dashboard.classes',
    teacherClasses,
  );
  const resolvedTeacherAssignmentsCount = useCachedQueryValue<number>(
    'teacher.dashboard.activeAssignments',
    teacherAssignmentsCount,
  );
  const resolvedTeacherTodayClasses = useCachedQueryValue<number>(
    'teacher.dashboard.todayClasses',
    teacherTodayClasses,
  );

  if (!sessionToken) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateTitle}>No active session</Text>
        <Text style={styles.stateText}>Sign in again to load your dashboard.</Text>
      </View>
    );
  }

  if (user?.role === 'parent') {
    if (!resolvedParentChildren || !resolvedParentFeeOverview) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>
            {isOffline ? 'Loading cached parent dashboard...' : 'Loading your family overview...'}
          </Text>
        </View>
      );
    }

    const totalBalance = resolvedParentFeeOverview.reduce(
      (sum: number, child: any) => sum + (child.balance ?? 0),
      0,
    );

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
      >
        {isOffline && <Text style={styles.offlineNotice}>Showing the latest cached parent data.</Text>}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Parent Portal</Text>
          <Text style={styles.heroTitle}>
            {resolvedParentProfile?.fullName ??
              resolvedParentProfile?.name ??
              user?.email?.split('@')[0] ??
              'Parent'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {resolvedParentChildren.length} child{resolvedParentChildren.length === 1 ? '' : 'ren'} linked
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{resolvedParentChildren.length}</Text>
            <Text style={styles.metricLabel}>Children linked</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{(totalBalance / 100).toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Outstanding fees</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>
              {resolvedParentFeeOverview.filter((child: any) => child.balance > 0).length}
            </Text>
            <Text style={styles.metricLabel}>Children with balance</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>
              {resolvedParentFeeOverview.reduce(
                (sum: number, child: any) => sum + (child.paidInvoiceCount ?? 0),
                0,
              )}
            </Text>
            <Text style={styles.metricLabel}>Invoices settled</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Children</Text>
        <View style={styles.list}>
          {resolvedParentChildren.slice(0, 4).map((child: any) => {
            const feeOverview = resolvedParentFeeOverview.find(
              (entry: any) => entry.studentId === child._id,
            );
            return (
              <View key={child._id} style={styles.listCard}>
                <Text style={styles.listTitle}>
                  {[child.firstName, child.lastName].filter(Boolean).join(' ')}
                </Text>
                <Text style={styles.listMeta}>
                  {child.admissionNumber ?? 'No admission number'} • {child.status ?? 'active'}
                </Text>
                <Text style={styles.listMeta}>
                  Balance: {((feeOverview?.balance ?? 0) / 100).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('grades')}>
            <Text style={styles.actionButtonText}>Children</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('assignments')}>
            <Text style={styles.actionButtonText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('fees')}>
            <Text style={styles.actionButtonText}>Payments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (
      !resolvedTeacherClasses ||
      resolvedTeacherAssignmentsCount === undefined ||
      resolvedTeacherTodayClasses === undefined
    ) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>
            {isOffline ? 'Loading cached teacher dashboard...' : 'Loading your teaching overview...'}
          </Text>
        </View>
      );
    }

    const totalStudents = resolvedTeacherClasses.reduce(
      (sum: number, cls: any) => sum + (cls.studentCount ?? 0),
      0,
    );

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
      >
        {isOffline && <Text style={styles.offlineNotice}>Showing the latest cached teacher data.</Text>}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Teacher Portal</Text>
          <Text style={styles.heroTitle}>{user?.email?.split('@')[0] ?? 'Teacher'}</Text>
          <Text style={styles.heroSubtitle}>Your class and assignment snapshot for today</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{resolvedTeacherClasses.length}</Text>
            <Text style={styles.metricLabel}>Assigned classes</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{totalStudents}</Text>
            <Text style={styles.metricLabel}>Students reached</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{resolvedTeacherAssignmentsCount}</Text>
            <Text style={styles.metricLabel}>Active assignments</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{resolvedTeacherTodayClasses}</Text>
            <Text style={styles.metricLabel}>Today's classes</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Classes</Text>
        <View style={styles.list}>
          {resolvedTeacherClasses.slice(0, 4).map((cls: any) => (
            <View key={cls._id} style={styles.listCard}>
              <Text style={styles.listTitle}>{cls.name}</Text>
              <Text style={styles.listMeta}>
                Grade {cls.grade ?? '—'} • {cls.studentCount ?? 0} students
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('grades')}>
            <Text style={styles.actionButtonText}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('assignments')}>
            <Text style={styles.actionButtonText}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('fees')}>
            <Text style={styles.actionButtonText}>Timetable</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (
    !resolvedStudentProfile ||
    !resolvedStudentGrades ||
    !resolvedStudentAssignments ||
    !resolvedStudentAttendance ||
    !resolvedStudentWallet
  ) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.stateText}>
          {isOffline ? 'Loading cached dashboard...' : 'Loading your dashboard...'}
        </Text>
      </View>
    );
  }

  const completedAttendance = resolvedStudentAttendance.length;
  const presentCount = resolvedStudentAttendance.filter((item: any) => item.status === 'present').length;
  const attendanceRate = completedAttendance > 0 ? Math.round((presentCount / completedAttendance) * 100) : 0;
  const averageScore =
    resolvedStudentGrades.length > 0
      ? Math.round(
          resolvedStudentGrades.reduce((sum: number, grade: any) => sum + grade.score, 0) /
            resolvedStudentGrades.length,
        )
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
    >
      {isOffline && <Text style={styles.offlineNotice}>Showing the latest cached student data.</Text>}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Student Portal</Text>
        <Text style={styles.heroTitle}>
          {resolvedStudentProfile?.firstName ?? user?.email?.split('@')[0] ?? 'Student'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {resolvedStudentProfile?.admissionNumber
            ? `Admission No. ${resolvedStudentProfile.admissionNumber}`
            : user?.email}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{resolvedStudentGrades.length}</Text>
          <Text style={styles.metricLabel}>Grades recorded</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{averageScore}%</Text>
          <Text style={styles.metricLabel}>Average score</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{resolvedStudentAssignments.length}</Text>
          <Text style={styles.metricLabel}>Assignments due</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{attendanceRate}%</Text>
          <Text style={styles.metricLabel}>Attendance rate</Text>
        </View>
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.sectionTitle}>Wallet Balance</Text>
        <Text style={styles.walletValue}>
          {(resolvedStudentWallet.balanceCents / 100).toLocaleString()} {resolvedStudentWallet.currency}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('grades')}>
          <Text style={styles.actionButtonText}>Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('assignments')}>
          <Text style={styles.actionButtonText}>Assignments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('attendance')}>
          <Text style={styles.actionButtonText}>Attendance</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  stateTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  offlineNotice: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  eyebrow: {
    color: '#bfdbfe',
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  heroSubtitle: {
    color: '#dbeafe',
    fontSize: theme.fontSizes.base,
    marginTop: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#e0ecff',
  },
  metricValue: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  walletCard: {
    backgroundColor: '#ecfeff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  walletValue: {
    color: theme.colors.info,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  list: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontWeight: '700',
  },
  listMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
});

export default DashboardScreen;
