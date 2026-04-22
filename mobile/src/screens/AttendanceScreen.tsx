import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import AttendanceRow, { type AttendanceRowProps } from "../components/AttendanceRow";

import { useAuth } from "../hooks/useAuth";
import { useCachedQueryValue, useOfflineSync } from "../hooks/useOfflineSync";
import { api } from "../lib/convexApi";
import { theme } from "../theme";

const AttendanceScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [attendanceDraft, setAttendanceDraft] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const attendanceDate = React.useMemo(() => new Date().toISOString().split("T")[0] ?? "", []);

  const studentAttendance = useQuery(
    api.modules.portal.student.queries.getMyAttendance,
    sessionToken && user?.role === "student" ? { sessionToken } : "skip"
  );
  const parentAnnouncements = useQuery(
    api.modules.portal.parent.queries.getAnnouncements,
    sessionToken && user?.role === "parent" ? { sessionToken } : "skip"
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === "teacher" ? { sessionToken } : "skip"
  );
  const teacherTodayClasses = useQuery(
    api.modules.academics.queries.getTeacherTodayClassesCount,
    sessionToken && user?.role === "teacher" ? { sessionToken } : "skip"
  );
  const teacherClassStudents = useQuery(
    api.modules.academics.queries.getClassStudents,
    sessionToken && user?.role === "teacher" && selectedClassId
      ? { sessionToken, classId: selectedClassId }
      : "skip"
  );
  const teacherAttendance = useQuery(
    api.modules.academics.queries.getAttendance,
    sessionToken && user?.role === "teacher" && selectedClassId
      ? { sessionToken, classId: selectedClassId, date: attendanceDate }
      : "skip"
  );
  const markAttendance = useMutation(api.modules.academics.mutations.markAttendance);

  const resolvedStudentAttendance = useCachedQueryValue<any[]>(
    "student.attendance.list",
    studentAttendance
  );
  const resolvedParentAnnouncements = useCachedQueryValue<any[]>(
    "parent.announcements.list",
    parentAnnouncements
  );
  const resolvedTeacherClasses = useCachedQueryValue<any[]>(
    "teacher.classes.attendance",
    teacherClasses
  );
  const resolvedTeacherTodayClasses = useCachedQueryValue<number>(
    "teacher.attendance.todayCount",
    teacherTodayClasses
  );
  const resolvedTeacherClassStudents = useCachedQueryValue<any[]>(
    selectedClassId
      ? `teacher.attendance.students.${selectedClassId}`
      : "teacher.attendance.students.none",
    teacherClassStudents
  );
  const resolvedTeacherAttendance = useCachedQueryValue<any[]>(
    selectedClassId
      ? `teacher.attendance.records.${selectedClassId}.${attendanceDate}`
      : "teacher.attendance.records.none",
    teacherAttendance
  );

  React.useEffect(() => {
    if (!selectedClassId && resolvedTeacherClasses && resolvedTeacherClasses.length > 0) {
      setSelectedClassId(resolvedTeacherClasses[0]._id);
    }
  }, [resolvedTeacherClasses, selectedClassId]);

  React.useEffect(() => {
    if (!resolvedTeacherAttendance) {
      return;
    }
    const nextDraft: Record<string, string> = {};
    resolvedTeacherAttendance.forEach((entry: any) => {
      nextDraft[entry.studentId] = entry.status;
    });
    setAttendanceDraft((prev) => ({ ...nextDraft, ...prev }));
  }, [resolvedTeacherAttendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!sessionToken || !selectedClassId || !resolvedTeacherClassStudents || isOffline) {
      return;
    }

    setIsSubmitting(true);
    try {
      await markAttendance({
        sessionToken,
        records: resolvedTeacherClassStudents.map((student: any) => ({
          classId: selectedClassId,
          studentId: student._id,
          date: attendanceDate,
          status: attendanceDraft[student._id] ?? "present",
          recordedBy: user?.userId ?? "",
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

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
        {isOffline && <Text style={styles.banner}>Showing cached school updates.</Text>}
        {resolvedParentAnnouncements.length === 0 ? (
          <Text style={styles.stateText}>No school updates are available yet.</Text>
        ) : (
          (
            resolvedParentAnnouncements as Array<{ _id: string; title?: string; message?: string }>
          ).map((announcement) => (
            <View key={announcement._id} style={styles.card}>
              <Text style={styles.status}>{announcement.title}</Text>
              <Text style={styles.meta}>{announcement.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === "teacher") {
    if (!resolvedTeacherClasses || resolvedTeacherTodayClasses === undefined) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached attendance prep data.</Text>}
        <View style={styles.summaryCard}>
          <Text style={styles.status}>{resolvedTeacherTodayClasses}</Text>
          <Text style={styles.meta}>Classes need attendance attention today</Text>
        </View>
        {resolvedTeacherClasses.length === 0 ? (
          <Text style={styles.stateText}>No classes are assigned to you yet.</Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Choose class</Text>
            <View style={styles.choiceWrap}>
              {resolvedTeacherClasses.map((classItem: any) => (
                <TouchableOpacity
                  key={classItem._id}
                  style={[
                    styles.choiceChip,
                    selectedClassId === classItem._id ? styles.choiceChipActive : undefined,
                  ]}
                  onPress={() => setSelectedClassId(classItem._id)}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      selectedClassId === classItem._id ? styles.choiceChipTextActive : undefined,
                    ]}
                  >
                    {classItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedClassId && resolvedTeacherClassStudents ? (
              <View style={styles.card}>
                <Text style={styles.status}>Attendance for {attendanceDate}</Text>
                {resolvedTeacherClassStudents.length === 0 ? (
                  <Text style={styles.meta}>No students are enrolled in this class yet.</Text>
                ) : (
                  resolvedTeacherClassStudents.map((student: any) => (
                    <View key={student._id} style={styles.studentRow}>
                      <View style={styles.studentCopy}>
                        <Text style={styles.studentName}>
                          {[student.firstName, student.lastName].filter(Boolean).join(" ")}
                        </Text>
                        <Text style={styles.meta}>
                          {student.admissionNumber ?? "No admission number"}
                        </Text>
                      </View>
                      <View style={styles.choiceWrap}>
                        {["present", "absent", "late", "excused"].map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.smallChip,
                              (attendanceDraft[student._id] ?? "present") === status
                                ? styles.choiceChipActive
                                : undefined,
                            ]}
                            onPress={() => handleStatusChange(student._id, status)}
                          >
                            <Text
                              style={[
                                styles.smallChipText,
                                (attendanceDraft[student._id] ?? "present") === status
                                  ? styles.choiceChipTextActive
                                  : undefined,
                              ]}
                            >
                              {status}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (isOffline || isSubmitting) && styles.disabledButton,
                  ]}
                  onPress={handleSubmitAttendance}
                  disabled={isOffline || isSubmitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {isOffline
                      ? "Reconnect to submit"
                      : isSubmitting
                        ? "Saving..."
                        : "Save attendance"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentAttendance) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedStudentAttendance.length === 0) {
    return <Text style={styles.stateText}>No attendance records are available yet.</Text>;
  }

  return (
    <View style={styles.container}>
      {isOffline && <Text style={styles.banner}>Showing cached attendance.</Text>}
      <FlatList
        data={resolvedStudentAttendance as AttendanceRowProps[]}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <AttendanceRow {...item} />}
        contentContainerStyle={styles.content}
      />
    </View>
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
  summaryCard: {
    backgroundColor: "#eff6ff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  status: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.display,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },
  banner: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.display,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.displayMedium,
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
  studentRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  studentCopy: {
    marginBottom: theme.spacing.sm,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.displayMedium,
  },
  smallChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
  smallChipText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.bodyMedium,
    textTransform: "capitalize",
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
});

export default AttendanceScreen;
