import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import GradeRow, { type GradeRowProps } from '../components/GradeRow';
import StudentCard, { type StudentCardProps } from '../components/StudentCard';

import { useAuth } from '../hooks/useAuth';
import { useCachedQueryValue, useOfflineSync } from '../hooks/useOfflineSync';
import { api } from '../lib/convexApi';
import { theme } from '../theme';

const GradesScreen: React.FC = () => {
  const { sessionToken, user } = useAuth();
  const { isOffline } = useOfflineSync();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [gradeDrafts, setGradeDrafts] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const currentTerm = 'Term 1';
  const currentAcademicYear = String(new Date().getFullYear());

  const studentGrades = useQuery(
    api.modules.portal.student.queries.getMyGrades,
    sessionToken && user?.role === 'student' ? { sessionToken } : 'skip',
  );
  const parentChildren = useQuery(
    api.modules.portal.parent.queries.getChildren,
    sessionToken && user?.role === 'parent' ? { sessionToken } : 'skip',
  );
  const teacherClasses = useQuery(
    api.modules.academics.queries.getTeacherClasses,
    sessionToken && user?.role === 'teacher' ? { sessionToken } : 'skip',
  );
  const teacherClassStudents = useQuery(
    api.modules.academics.queries.getClassStudents,
    sessionToken && user?.role === 'teacher' && selectedClassId
      ? { sessionToken, classId: selectedClassId }
      : 'skip',
  );
  const enterGrades = useMutation(api.modules.academics.mutations.enterGrades);

  const resolvedStudentGrades = useCachedQueryValue<any[]>('student.grades.list', studentGrades);
  const resolvedParentChildren = useCachedQueryValue<any[]>('parent.children.list', parentChildren);
  const resolvedTeacherClasses = useCachedQueryValue<any[]>('teacher.classes.list', teacherClasses);
  const resolvedTeacherClassStudents = useCachedQueryValue<any[]>(
    selectedClassId ? `teacher.grades.students.${selectedClassId}` : 'teacher.grades.students.none',
    teacherClassStudents,
  );

  React.useEffect(() => {
    if (!selectedClassId && resolvedTeacherClasses && resolvedTeacherClasses.length > 0) {
      setSelectedClassId(resolvedTeacherClasses[0]._id);
    }
  }, [resolvedTeacherClasses, selectedClassId]);

  const calculateGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const handleSubmitGrades = async () => {
    if (!sessionToken || !selectedClassId || !resolvedTeacherClassStudents || isOffline) {
      return;
    }

    setIsSubmitting(true);
    try {
      await enterGrades({
        sessionToken,
        grades: resolvedTeacherClassStudents
          .filter((student: any) => gradeDrafts[student._id] !== undefined && gradeDrafts[student._id] !== '')
          .map((student: any) => {
            const score = Number(gradeDrafts[student._id] ?? 0);
            return {
              studentId: student._id,
              classId: selectedClassId,
              subjectId: 'general',
              term: currentTerm,
              academicYear: currentAcademicYear,
              score,
              grade: calculateGrade(score),
              recordedBy: user?.userId ?? '',
            };
          }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken) {
    return <Text style={styles.stateText}>Sign in to view this section.</Text>;
  }

  if (user?.role === 'parent') {
    if (!resolvedParentChildren) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached children data.</Text>}
        {resolvedParentChildren.length === 0 ? (
          <Text style={styles.stateText}>No children are linked to this account yet.</Text>
        ) : (
          (resolvedParentChildren as StudentCardProps[]).map((child) => (
            <StudentCard key={child._id} {...child} />
          ))
        )}
      </ScrollView>
    );
  }

  if (user?.role === 'teacher') {
    if (!resolvedTeacherClasses) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isOffline && <Text style={styles.banner}>Showing cached class data.</Text>}
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
                <Text style={styles.subject}>Quick grade entry</Text>
                <Text style={styles.meta}>
                  {currentTerm} • {currentAcademicYear}
                </Text>
                {resolvedTeacherClassStudents.length === 0 ? (
                  <Text style={styles.meta}>No students are enrolled in this class yet.</Text>
                ) : (
                  resolvedTeacherClassStudents.map((student: any) => {
                    const rawScore = gradeDrafts[student._id] ?? '';
                    const numericScore = rawScore === '' ? null : Number(rawScore);
                    return (
                      <View key={student._id} style={styles.studentRow}>
                        <View style={styles.studentCopy}>
                          <Text style={styles.studentName}>
                            {[student.firstName, student.lastName].filter(Boolean).join(' ')}
                          </Text>
                          <Text style={styles.meta}>
                            {student.admissionNumber ?? 'No admission number'}
                          </Text>
                        </View>
                        <View style={styles.gradeEntryRow}>
                          <TextInput
                            style={styles.scoreInput}
                            keyboardType="numeric"
                            placeholder="0-100"
                            value={rawScore}
                            onChangeText={(value) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [student._id]: value,
                              }))
                            }
                            editable={!isOffline && !isSubmitting}
                          />
                          <Text style={styles.gradeBadge}>
                            {numericScore === null || Number.isNaN(numericScore)
                              ? '—'
                              : calculateGrade(numericScore)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, (isOffline || isSubmitting) && styles.disabledButton]}
                  onPress={handleSubmitGrades}
                  disabled={isOffline || isSubmitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {isOffline ? 'Reconnect to submit' : isSubmitting ? 'Saving...' : 'Submit grades'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    );
  }

  if (!resolvedStudentGrades) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (resolvedStudentGrades.length === 0) {
    return <Text style={styles.stateText}>No grades have been published yet.</Text>;
  }

  return (
    <View style={styles.container}>
      {isOffline && <Text style={styles.banner}>Showing cached grades.</Text>}
      <FlatList
        data={resolvedStudentGrades as GradeRowProps[]}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <GradeRow {...item} />}
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
  subject: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  score: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '800',
    marginVertical: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
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
    fontWeight: '700',
  },
  gradeEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  scoreInput: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  gradeBadge: {
    minWidth: 36,
    textAlign: 'center',
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
  },
  primaryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
});

export default GradesScreen;
