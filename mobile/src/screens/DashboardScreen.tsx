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
import { api } from '../lib/convexApi';
import { theme } from '../theme';

type ScreenKey = 'dashboard' | 'grades' | 'assignments' | 'attendance' | 'fees' | 'profile';

const DashboardScreen: React.FC<{ onNavigate: (screen: ScreenKey) => void }> = ({ onNavigate }) => {
  const { sessionToken, user } = useAuth();
  const profile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken ? { sessionToken } : 'skip',
  );
  const grades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    sessionToken ? { sessionToken } : 'skip',
  );
  const assignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    sessionToken ? { sessionToken, limit: 5 } : 'skip',
  );
  const attendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    sessionToken ? { sessionToken } : 'skip',
  );
  const wallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : 'skip',
  );

  if (!sessionToken) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateTitle}>No active session</Text>
        <Text style={styles.stateText}>Sign in again to load your dashboard.</Text>
      </View>
    );
  }

  if (
    profile === undefined ||
    grades === undefined ||
    assignments === undefined ||
    attendance === undefined ||
    wallet === undefined
  ) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.stateText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const completedAttendance = attendance.length;
  const presentCount = attendance.filter((item: any) => item.status === 'present').length;
  const attendanceRate = completedAttendance > 0 ? Math.round((presentCount / completedAttendance) * 100) : 0;
  const averageScore =
    grades.length > 0
      ? Math.round(grades.reduce((sum: number, grade: any) => sum + grade.score, 0) / grades.length)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Student Portal</Text>
        <Text style={styles.heroTitle}>
          {profile?.firstName ?? user?.email?.split('@')[0] ?? 'Student'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {profile?.admissionNumber ? `Admission No. ${profile.admissionNumber}` : user?.email}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{grades.length}</Text>
          <Text style={styles.metricLabel}>Grades recorded</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{averageScore}%</Text>
          <Text style={styles.metricLabel}>Average score</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{assignments.length}</Text>
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
          {(wallet.balanceCents / 100).toLocaleString()} {wallet.currency}
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
});

export default DashboardScreen;
