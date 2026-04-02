import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { createStyleSheet } from '../theme';

interface DashboardStats {
  totalGrades: number;
  averageScore: number;
  pendingAssignments: number;
  attendanceRate: number;
}

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadDashboardData = async () => {
    try {
      // Load dashboard data from Convex
      // This would call the actual Convex queries
      const mockStats: DashboardStats = {
        totalGrades: 12,
        averageScore: 78.5,
        pendingAssignments: 3,
        attendanceRate: 92,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const styles = createStyleSheet({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeText: {
      color: theme.colors.white,
      fontSize: theme.fontSizes.lg,
      fontWeight: '600',
    },
    userName: {
      color: theme.colors.white,
      fontSize: theme.fontSizes.xl,
      fontWeight: 'bold',
      marginTop: theme.spacing.xs,
    },
    statsContainer: {
      padding: theme.spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    statValue: {
      fontSize: theme.fontSizes.xxl,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    actionButton: {
      width: '30%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    actionButtonText: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      marginTop: theme.spacing.xs,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md, color: theme.colors.text }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.totalGrades || 0}</Text>
            <Text style={styles.statLabel}>Total Grades</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.averageScore || 0}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.pendingAssignments || 0}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.attendanceRate || 0}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Grades</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
