import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type GradeRowProps = {
  _id: string;
  subjectName?: string;
  score?: number;
  grade?: string;
  term?: string;
  academicYear?: string;
};

const GradeRow = React.memo(function GradeRow({
  subjectName,
  score,
  grade,
  term,
  academicYear,
}: GradeRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.subject}>{subjectName ?? 'Subject'}</Text>
        {grade ? <Text style={styles.gradeBadge}>{grade}</Text> : null}
      </View>
      {score !== undefined ? (
        <Text style={styles.score}>{score}%</Text>
      ) : null}
      <Text style={styles.meta}>
        {[term, academicYear].filter(Boolean).join(' • ')}
      </Text>
    </View>
  );
});

export default GradeRow;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  gradeBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}18`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  score: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
