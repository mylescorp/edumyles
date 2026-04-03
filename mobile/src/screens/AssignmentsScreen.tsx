import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const AssignmentsScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();

  const studentAssignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    sessionToken && user?.role === 'student' ? { sessionToken, limit: 20 } : 'skip',
  );
  const teacherAssignments = useQuery(
    api.modules.academics.queries.listAssignments,
    sessionToken && user?.role === 'teacher'
      ? { sessionToken, teacherId: user.userId, limit: 20 }
      : 'skip',
  );
  const parentConversations = useQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );

  const resolvedStudentAssignments = useCachedQueryValue<any[]>(
    'student.assignments.list',
    studentAssignments,
  );
  const resolvedTeacherAssignments = useCachedQueryValue<any[]>(
    'teacher.assignments.list',
    teacherAssignments,
  );
  const resolvedParentConversations = useCachedQueryValue<any[]>(
    'parent.messages.conversations',
    parentConversations,
  );

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === 'parent') {
    if (!resolvedParentConversations) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached conversation history.</Text>}
        {resolvedParentConversations.length === 0 ? (
          <Text style={styles.stateText}>No family conversations yet.</Text>
        ) : (
          resolvedParentConversations.map((conversation: any) => (
            <View key={conversation._id} style={styles.card}>
              <Text style={styles.title}>{conversation.name ?? 'Conversation with school'}</Text>
              <Text style={styles.meta}>
                {conversation.lastMessagePreview ?? 'No messages yet'}
              </Text>
              <Text style={styles.meta}>
                Last activity:{' '}
                {conversation.lastMessageAt
                  ? new Date(conversation.lastMessageAt).toLocaleString()
                  : 'Waiting for first reply'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherAssignments) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached teacher assignments.</Text>}
        {resolvedTeacherAssignments.length === 0 ? (
          <Text style={styles.stateText}>No assignments have been created yet.</Text>
        ) : (
          resolvedTeacherAssignments.map((assignment: any) => (
            <View key={assignment._id} style={styles.card}>
              <Text style={styles.title}>{assignment.title}</Text>
              <Text style={styles.meta}>{assignment.className ?? 'Class not set'}</Text>
              <Text style={styles.meta}>Status: {assignment.status ?? 'draft'}</Text>
              <Text style={styles.meta}>Due: {assignment.dueDate ?? 'No due date'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentAssignments) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedStudentAssignments.length === 0) {
    return <Text style={styles.stateText}>No assignments are waiting for you right now.</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOffline && <Text style={styles.banner}>Showing cached assignments.</Text>}
      {resolvedStudentAssignments.map((assignment: any) => (
        <View key={assignment._id} style={styles.card}>
          <Text style={styles.title}>{assignment.title}</Text>
          <Text style={styles.meta}>{assignment.subjectName ?? 'Subject'}</Text>
          <Text style={styles.meta}>Status: {assignment.submissionStatus}</Text>
          <Text style={styles.meta}>Due: {assignment.dueDate}</Text>
          {assignment.feedback ? <Text style={styles.feedback}>Feedback: {assignment.feedback}</Text> : null}
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
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
  },
  feedback: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
});

export default AssignmentsScreen;
