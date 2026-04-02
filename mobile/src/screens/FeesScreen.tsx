import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const FeesScreen: React.FC = () => {
  const { sessionToken } = useAuth();
  const { isOffline } = useOfflineSync();
  const wallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : 'skip',
  );
  const transactions = useQuery(
    api.modules.ewallet.queries.getMyTransactionHistory,
    sessionToken ? { sessionToken, limit: 10 } : 'skip',
  );
  const resolvedWallet = useCachedQueryValue<any>('student.fees.wallet', wallet);
  const resolvedTransactions = useCachedQueryValue<any[]>(
    'student.fees.transactions',
    transactions,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view fee and wallet activity.</Text>;
  }

  if (!resolvedWallet || !resolvedTransactions) {
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
          {(resolvedWallet.balanceCents / 100).toLocaleString()} {resolvedWallet.currency}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {resolvedTransactions.length === 0 ? (
        <Text style={styles.emptyText}>No wallet transactions yet.</Text>
      ) : (
        resolvedTransactions.map((transaction: any) => (
          <View key={transaction._id} style={styles.card}>
            <Text style={styles.transactionType}>{transaction.type}</Text>
            <Text style={styles.transactionAmount}>
              {(transaction.amountCents / 100).toLocaleString()} {resolvedWallet.currency}
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
