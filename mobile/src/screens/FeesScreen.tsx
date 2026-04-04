import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const getCurrentDayOfWeek = () => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
};

const FeesScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const studentTransactions = useQuery(
    api.modules.ewallet.queries.getMyTransactionHistory,
    sessionToken && user?.role === 'student' ? { sessionToken, limit: 10 } : 'skip',
  );
  const parentFeeOverview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const parentPaymentHistory = useQuery(
    api.modules.portal.parent.queries.getPaymentHistory,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const teacherSchedule = useQuery(
    api.modules.timetable.queries.getTeacherSchedule,
    sessionToken && user?.role === 'teacher'
      ? { sessionToken, teacherId: user.userId, dayOfWeek: getCurrentDayOfWeek() }
      : 'skip',
  );

  const resolvedStudentWallet = useCachedQueryValue<any>('student.fees.wallet', studentWallet);
  const resolvedStudentTransactions = useCachedQueryValue<any[]>(
    'student.fees.transactions',
    studentTransactions,
  );
  const resolvedParentFeeOverview = useCachedQueryValue<any[]>(
    'parent.payments.feeOverview',
    parentFeeOverview,
  );
  const resolvedParentPaymentHistory = useCachedQueryValue<any[]>(
    'parent.payments.history',
    parentPaymentHistory,
  );
  const resolvedTeacherSchedule = useCachedQueryValue<any[]>(
    'teacher.timetable.today',
    teacherSchedule,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === 'parent') {
    if (!resolvedParentFeeOverview || !resolvedParentPaymentHistory) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    const totalBalance = resolvedParentFeeOverview.reduce(
      (sum: number, child: any) => sum + (child.balance ?? 0),
      0,
    );

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached payment activity.</Text>}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Outstanding family balance</Text>
          <Text style={styles.balanceValue}>{(totalBalance / 100).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Children balances</Text>
        {resolvedParentFeeOverview.map((child: any) => (
          <View key={child.studentId} style={styles.card}>
            <Text style={styles.transactionType}>
              {child.firstName} {child.lastName}
            </Text>
            <Text style={styles.transactionAmount}>{((child.balance ?? 0) / 100).toLocaleString()}</Text>
            <Text style={styles.meta}>
              Paid invoices: {child.paidInvoiceCount ?? 0} • Pending: {child.pendingInvoiceCount ?? 0}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recent payments</Text>
        {resolvedParentPaymentHistory.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded yet.</Text>
        ) : (
          resolvedParentPaymentHistory.slice(0, 10).map((payment: any) => (
            <View key={payment._id} style={styles.card}>
              <Text style={styles.transactionType}>{payment.studentName ?? 'Student payment'}</Text>
              <Text style={styles.transactionAmount}>{(payment.amount / 100).toLocaleString()}</Text>
              <Text style={styles.meta}>
                {payment.method ?? payment.provider ?? 'Payment'} • {payment.status ?? 'processed'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherSchedule) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached timetable.</Text>}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Today's timetable</Text>
          <Text style={styles.balanceValue}>{resolvedTeacherSchedule.length}</Text>
        </View>
        {resolvedTeacherSchedule.length === 0 ? (
          <Text style={styles.emptyText}>No timetable slots scheduled for today.</Text>
        ) : (
          resolvedTeacherSchedule.map((slot: any) => (
            <View key={slot._id} style={styles.card}>
              <Text style={styles.transactionType}>{slot.subjectName ?? slot.subjectId ?? 'Class slot'}</Text>
              <Text style={styles.transactionAmount}>
                {slot.startTime} - {slot.endTime}
              </Text>
              <Text style={styles.meta}>
                Room: {slot.room ?? 'Not assigned'} • Class: {slot.classId ?? 'Class pending'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentWallet || !resolvedStudentTransactions) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached wallet activity.</Text>}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available wallet balance</Text>
        <Text style={styles.balanceValue}>
          {(resolvedStudentWallet.balanceCents / 100).toLocaleString()} {resolvedStudentWallet.currency}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {resolvedStudentTransactions.length === 0 ? (
        <Text style={styles.emptyText}>No wallet transactions yet.</Text>
      ) : (
        resolvedStudentTransactions.map((transaction: any) => (
          <View key={transaction._id} style={styles.card}>
            <Text style={styles.transactionType}>{transaction.type}</Text>
            <Text style={styles.transactionAmount}>
              {(transaction.amountCents / 100).toLocaleString()} {resolvedStudentWallet.currency}
            </Text>
            <Text style={styles.meta}>{transaction.note ?? transaction.reference ?? 'No description provided'}</Text>
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
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
  },
  balanceCard: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  balanceLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  balanceValue: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
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
  transactionType: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    color: theme.colors.success,
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
  },
});

export default FeesScreen;
