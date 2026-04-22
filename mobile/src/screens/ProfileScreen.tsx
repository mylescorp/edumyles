import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";

import { useAuth } from "../hooks/useAuth";
import { useCachedQueryValue, useOfflineSync } from "../hooks/useOfflineSync";
import { api } from "../lib/convexApi";
import { theme } from "../theme";

const ProfileScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    sessionToken && user?.role === "student" ? { sessionToken } : "skip"
  );
  const studentNotifications = useQuery(
    api.modules.portal.student.queries.getMyNotifications,
    sessionToken && user?.role === "student" ? { sessionToken, limit: 5 } : "skip"
  );
  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    sessionToken && user?.role === "parent" ? { sessionToken } : "skip"
  );
  const parentAnnouncements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    sessionToken && user?.role === "parent" ? { sessionToken } : "skip"
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === "teacher" ? { sessionToken } : "skip"
  );
  const teacherProfile = useQuery(
    api.modules.hr.queries.getCurrentStaffProfile,
    sessionToken && user?.role === "teacher" ? { sessionToken } : "skip"
  );
  const teacherNotifications = useQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken && user?.role === "teacher" ? { sessionToken, limit: 5 } : "skip"
  );

  // Shared notifications with mark-as-read support (all roles)
  const allNotifications = useQuery(
    api.notifications.getNotifications,
    sessionToken ? { sessionToken, limit: 5 } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    sessionToken ? { sessionToken } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const resolvedStudentProfile = useCachedQueryValue<any>(
    "student.profile.summary",
    studentProfile
  );
  const resolvedStudentNotifications = useCachedQueryValue<any[]>(
    "student.profile.notifications",
    studentNotifications
  );
  const resolvedParentProfile = useCachedQueryValue<any>("parent.profile.summary", parentProfile);
  const resolvedParentAnnouncements = useCachedQueryValue<any[]>(
    "parent.profile.announcements",
    parentAnnouncements
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>(
    "teacher.profile.classes",
    teacherClasses
  );
  const resolvedTeacherProfile = useCachedQueryValue<any>(
    "teacher.profile.staffRecord",
    teacherProfile
  );
  const resolvedTeacherNotifications = useCachedQueryValue<any[]>(
    "teacher.profile.notifications",
    teacherNotifications
  );

  const resolvedAllNotifications = useCachedQueryValue<any[]>(
    "profile.notifications.shared",
    allNotifications
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view your profile.</Text>;
  }

  const handleMarkAsRead = (notificationId: string) => {
    if (!sessionToken || isOffline) return;
    markAsRead({ sessionToken, notificationId: notificationId as any }).catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    if (!sessionToken || isOffline) return;
    markAllAsRead({ sessionToken }).catch(() => {});
  };

  const renderNotifications = (notifications: any[], fallback: string) => {
    if (!notifications || notifications.length === 0) {
      return <Text style={styles.stateText}>{fallback}</Text>;
    }
    return notifications.map((n: any) => (
      <TouchableOpacity
        key={n._id}
        style={[styles.notificationCard, n.isRead === false && styles.notificationCardUnread]}
        activeOpacity={0.75}
        onPress={() => {
          if (!n.isRead) handleMarkAsRead(String(n._id));
        }}
      >
        <View style={styles.notificationRow}>
          <Text
            style={[styles.notificationTitle, n.isRead === false && styles.notificationTitleUnread]}
          >
            {n.title}
          </Text>
          {n.isRead === false && <View style={styles.unreadDot} />}
        </View>
        {n.message && <Text style={styles.notificationBody}>{n.message}</Text>}
      </TouchableOpacity>
    ));
  };

  if (user?.role === "parent") {
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
            Contact:{" "}
            {resolvedParentProfile?.phone ?? resolvedParentProfile?.contactPhone ?? "Not set"}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>School announcements</Text>
        </View>
        {resolvedParentAnnouncements.length === 0 ? (
          <Text style={styles.stateText}>No announcements yet.</Text>
        ) : (
          resolvedParentAnnouncements.slice(0, 5).map((a: any) => (
            <View key={a._id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{a.title}</Text>
              <Text style={styles.notificationBody}>{a.message}</Text>
            </View>
          ))
        )}

        {resolvedAllNotifications && resolvedAllNotifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Notifications{(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}
              </Text>
              {(unreadCount ?? 0) > 0 && !isOffline && (
                <TouchableOpacity onPress={handleMarkAllAsRead}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            {renderNotifications(resolvedAllNotifications, "No notifications.")}
          </>
        )}
      </ScrollView>
    );
  }

  if (user?.role === "teacher") {
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
              ? [resolvedTeacherProfile.firstName, resolvedTeacherProfile.lastName]
                  .filter(Boolean)
                  .join(" ")
              : user.email}
          </Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>Role: teacher</Text>
          <Text style={styles.meta}>Classes assigned: {resolvedTeacherClasses.length}</Text>
          <Text style={styles.meta}>
            Staff ID: {resolvedTeacherProfile?.employeeId ?? "Not set"}
          </Text>
          <Text style={styles.meta}>
            Department: {resolvedTeacherProfile?.department ?? "Not set"}
          </Text>
          <Text style={styles.meta}>
            Qualification: {resolvedTeacherProfile?.qualification ?? "Not set"}
          </Text>
          <Text style={styles.meta}>Phone: {resolvedTeacherProfile?.phone ?? "Not set"}</Text>
          <Text style={styles.meta}>Status: {resolvedTeacherProfile?.status ?? "active"}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Notifications{(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}
          </Text>
          {(unreadCount ?? 0) > 0 && !isOffline && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderNotifications(
          resolvedAllNotifications ?? resolvedTeacherNotifications,
          "No notifications yet."
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
          {[resolvedStudentProfile.firstName, resolvedStudentProfile.lastName]
            .filter(Boolean)
            .join(" ") || user?.email}
        </Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>
          Admission No: {resolvedStudentProfile.admissionNumber ?? "Not set"}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Notifications{(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}
        </Text>
        {(unreadCount ?? 0) > 0 && !isOffline && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderNotifications(
        resolvedAllNotifications ?? resolvedStudentNotifications,
        "No notifications yet."
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
    justifyContent: "center",
    alignItems: "center",
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.base,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
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
    fontFamily: theme.fonts.display,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.display,
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.bodyMedium,
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.display,
  },
  notificationCard: {
    backgroundColor: "#fff7ed",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  notificationCardUnread: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.displayMedium,
  },
  notificationTitleUnread: {
    fontFamily: theme.fonts.display,
  },
  notificationBody: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
    marginTop: 6,
    flexShrink: 0,
  },
});

export default ProfileScreen;
