import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";

import { useAuth } from "../hooks/useAuth";
import { useCachedQueryValue, useOfflineSync } from "../hooks/useOfflineSync";
import { api } from "../lib/convexApi";
import { theme } from "../theme";

const AssignmentsScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [newConversationMessage, setNewConversationMessage] = React.useState("");
  const [draftReply, setDraftReply] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [teacherAssignmentTitle, setTeacherAssignmentTitle] = React.useState("");
  const [teacherAssignmentDescription, setTeacherAssignmentDescription] = React.useState("");
  const [teacherAssignmentDueDate, setTeacherAssignmentDueDate] = React.useState("");
  const [selectedTeacherClassId, setSelectedTeacherClassId] = React.useState<string | null>(null);

  const studentAssignments = useQuery(
    api.modules.portal.student.queries.getMyAssignments,
    sessionToken && user?.role === "student" ? { sessionToken, limit: 20 } : "skip"
  );
  const teacherAssignments = useQuery(
    api.modules.academics.queries.listAssignments,
    sessionToken && user?.role === "teacher"
      ? { sessionToken, teacherId: user.userId, limit: 20 }
      : "skip"
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === "teacher" ? { sessionToken } : "skip"
  );
  const parentConversations = useQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken && user?.role === "parent" ? { sessionToken } : "skip"
  );
  const parentMessages = useQuery(
    api.modules.communications.queries.getConversationMessages,
    sessionToken && user?.role === "parent" && selectedConversation
      ? { sessionToken, conversationId: selectedConversation }
      : "skip"
  );

  const createConversation = useMutation(api.modules.communications.mutations.createConversation);
  const sendMessage = useMutation(api.modules.communications.mutations.sendMessage);
  const markConversationRead = useMutation(
    api.modules.communications.mutations.markConversationRead
  );
  const createAssignment = useMutation(api.modules.academics.mutations.createAssignment);

  const resolvedStudentAssignments = useCachedQueryValue<any[]>(
    "student.assignments.list",
    studentAssignments
  );
  const resolvedTeacherAssignments = useCachedQueryValue<any[]>(
    "teacher.assignments.list",
    teacherAssignments
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>(
    "teacher.assignments.classes",
    teacherClasses
  );
  const resolvedParentConversations = useCachedQueryValue<any[]>(
    "parent.messages.conversations",
    parentConversations
  );
  const resolvedParentMessages = useCachedQueryValue<any[]>(
    selectedConversation
      ? `parent.messages.thread.${selectedConversation}`
      : "parent.messages.thread.none",
    parentMessages
  );

  const handleCreateConversation = async () => {
    if (!newConversationMessage.trim() || !sessionToken || isOffline) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createConversation({
        sessionToken,
        type: "direct",
        participants: [],
        name: "Parent Message to School",
        initialMessage: newConversationMessage.trim(),
      });
      const conversationId = (result as any)?.conversationId as string | undefined;
      if (conversationId) {
        setSelectedConversation(conversationId);
      }
      setNewConversationMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!draftReply.trim() || !selectedConversation || isOffline) {
      return;
    }

    setIsSubmitting(true);
    try {
      await sendMessage({
        sessionToken,
        conversationId: selectedConversation as any,
        content: draftReply.trim(),
      });
      setDraftReply("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    try {
      await markConversationRead({ sessionToken, conversationId: conversationId as any });
    } catch {
      // Allow opening the thread even if read markers fail.
    }
  };

  const handleCreateTeacherAssignment = async () => {
    if (
      !teacherAssignmentTitle.trim() ||
      !teacherAssignmentDescription.trim() ||
      !teacherAssignmentDueDate.trim() ||
      !selectedTeacherClassId ||
      isOffline
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createAssignment({
        sessionToken,
        classId: selectedTeacherClassId,
        title: teacherAssignmentTitle.trim(),
        description: teacherAssignmentDescription.trim(),
        dueDate: teacherAssignmentDueDate.trim(),
        status: "active",
        type: "homework",
      });
      setTeacherAssignmentTitle("");
      setTeacherAssignmentDescription("");
      setTeacherAssignmentDueDate("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === "parent") {
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
        <View style={styles.card}>
          <Text style={styles.title}>Contact school</Text>
          <Text style={styles.meta}>Start a secure conversation with school administration.</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your message to the school..."
            value={newConversationMessage}
            onChangeText={setNewConversationMessage}
            editable={!isOffline && !isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!newConversationMessage.trim() || isOffline || isSubmitting) &&
                styles.disabledButton,
            ]}
            onPress={handleCreateConversation}
            disabled={!newConversationMessage.trim() || isOffline || isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isOffline ? "Reconnect to send" : isSubmitting ? "Sending..." : "Start conversation"}
            </Text>
          </TouchableOpacity>
        </View>
        {resolvedParentConversations.length === 0 ? (
          <Text style={styles.stateText}>No family conversations yet.</Text>
        ) : (
          resolvedParentConversations.map((conversation: any) => (
            <TouchableOpacity
              key={conversation._id}
              style={[
                styles.card,
                selectedConversation === conversation._id ? styles.selectedCard : undefined,
              ]}
              onPress={() => handleSelectConversation(conversation._id)}
            >
              <Text style={styles.title}>{conversation.name ?? "Conversation with school"}</Text>
              <Text style={styles.meta}>
                {conversation.lastMessagePreview ?? "No messages yet"}
              </Text>
              <Text style={styles.meta}>
                Last activity:{" "}
                {conversation.lastMessageAt
                  ? new Date(conversation.lastMessageAt).toLocaleString()
                  : "Waiting for first reply"}
              </Text>
            </TouchableOpacity>
          ))
        )}
        {selectedConversation ? (
          <View style={styles.card}>
            <Text style={styles.title}>Conversation thread</Text>
            {(resolvedParentMessages ?? []).length === 0 ? (
              <Text style={styles.meta}>No messages in this thread yet.</Text>
            ) : (
              <FlatList
                data={
                  (resolvedParentMessages ?? []) as Array<{
                    _id: string;
                    senderRole?: string;
                    content?: string;
                    createdAt?: number;
                  }>
                }
                keyExtractor={(item) => item._id}
                renderItem={({ item: message }) => (
                  <View style={styles.messageBubble}>
                    <Text style={styles.messageRole}>{message.senderRole ?? "user"}</Text>
                    <Text style={styles.messageBody}>{message.content}</Text>
                    <Text style={styles.messageMeta}>
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString()
                        : "Just now"}
                    </Text>
                  </View>
                )}
                inverted
              />
            )}
            <TextInput
              style={styles.input}
              multiline
              placeholder="Reply to this conversation..."
              value={draftReply}
              onChangeText={setDraftReply}
              editable={!isOffline && !isSubmitting}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!draftReply.trim() || isOffline || isSubmitting) && styles.disabledButton,
              ]}
              onPress={handleSendReply}
              disabled={!draftReply.trim() || isOffline || isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isOffline ? "Reconnect to reply" : isSubmitting ? "Sending..." : "Send reply"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  if (user?.role === "teacher") {
    if (!resolvedTeacherAssignments || !resolvedTeacherClasses) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached teacher assignments.</Text>}
        <View style={styles.card}>
          <Text style={styles.title}>Create assignment</Text>
          <Text style={styles.meta}>Publish a new class assignment from mobile.</Text>
          <Text style={styles.sectionLabel}>Class</Text>
          <View style={styles.choiceWrap}>
            {resolvedTeacherClasses.length === 0 ? (
              <Text style={styles.meta}>No classes are assigned yet.</Text>
            ) : (
              resolvedTeacherClasses.map((classItem: any) => (
                <TouchableOpacity
                  key={classItem._id}
                  style={[
                    styles.choiceChip,
                    selectedTeacherClassId === classItem._id ? styles.choiceChipActive : undefined,
                  ]}
                  onPress={() => setSelectedTeacherClassId(classItem._id)}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      selectedTeacherClassId === classItem._id
                        ? styles.choiceChipTextActive
                        : undefined,
                    ]}
                  >
                    {classItem.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Assignment title"
            value={teacherAssignmentTitle}
            onChangeText={setTeacherAssignmentTitle}
            editable={!isOffline && !isSubmitting}
          />
          <TextInput
            style={styles.input}
            multiline
            placeholder="Assignment description"
            value={teacherAssignmentDescription}
            onChangeText={setTeacherAssignmentDescription}
            editable={!isOffline && !isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Due date (YYYY-MM-DD)"
            value={teacherAssignmentDueDate}
            onChangeText={setTeacherAssignmentDueDate}
            editable={!isOffline && !isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!teacherAssignmentTitle.trim() ||
                !teacherAssignmentDescription.trim() ||
                !teacherAssignmentDueDate.trim() ||
                !selectedTeacherClassId ||
                isOffline ||
                isSubmitting) &&
                styles.disabledButton,
            ]}
            onPress={handleCreateTeacherAssignment}
            disabled={
              !teacherAssignmentTitle.trim() ||
              !teacherAssignmentDescription.trim() ||
              !teacherAssignmentDueDate.trim() ||
              !selectedTeacherClassId ||
              isOffline ||
              isSubmitting
            }
          >
            <Text style={styles.primaryButtonText}>
              {isOffline ? "Reconnect to create" : isSubmitting ? "Saving..." : "Create assignment"}
            </Text>
          </TouchableOpacity>
        </View>
        {resolvedTeacherAssignments.length === 0 ? (
          <Text style={styles.stateText}>No assignments have been created yet.</Text>
        ) : (
          resolvedTeacherAssignments.map((assignment: any) => (
            <View key={assignment._id} style={styles.card}>
              <Text style={styles.title}>{assignment.title}</Text>
              <Text style={styles.meta}>{assignment.className ?? "Class not set"}</Text>
              <Text style={styles.meta}>Status: {assignment.status ?? "draft"}</Text>
              <Text style={styles.meta}>Due: {assignment.dueDate ?? "No due date"}</Text>
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
          <Text style={styles.meta}>{assignment.subjectName ?? "Subject"}</Text>
          <Text style={styles.meta}>Status: {assignment.submissionStatus}</Text>
          <Text style={styles.meta}>Due: {assignment.dueDate}</Text>
          {assignment.feedback ? (
            <Text style={styles.feedback}>Feedback: {assignment.feedback}</Text>
          ) : null}
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
    justifyContent: "center",
    alignItems: "center",
  },
  stateText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: theme.colors.textSecondary,
    padding: theme.spacing.lg,
    fontFamily: theme.fonts.regular,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: "#eff6ff",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.display,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
    fontFamily: theme.fonts.regular,
  },
  feedback: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.display,
  },
  input: {
    minHeight: 96,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    color: theme.colors.text,
    textAlignVertical: "top",
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    fontFamily: theme.fonts.regular,
  },
  primaryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.displayMedium,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.displayMedium,
    marginTop: theme.spacing.md,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  choiceChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  choiceChipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.bodyMedium,
  },
  choiceChipTextActive: {
    color: theme.colors.white,
  },
  messageBubble: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: "#f8fafc",
  },
  messageRole: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.displayMedium,
    textTransform: "capitalize",
  },
  messageBody: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
    fontFamily: theme.fonts.regular,
  },
  messageMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },
});

export default AssignmentsScreen;
