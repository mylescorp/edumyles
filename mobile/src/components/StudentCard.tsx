import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type StudentCardProps = {
  _id: string;
  firstName?: string;
  lastName?: string;
  admissionNumber?: string;
  classId?: string;
  status?: string;
};

const StudentCard = React.memo(function StudentCard({
  firstName,
  lastName,
  admissionNumber,
  classId,
  status,
}: StudentCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>
        {[firstName, lastName].filter(Boolean).join(' ') || 'Unknown Student'}
      </Text>
      {admissionNumber ? (
        <Text style={styles.meta}>Admission: {admissionNumber}</Text>
      ) : null}
      {classId ? (
        <Text style={styles.meta}>Class: {classId}</Text>
      ) : (
        <Text style={styles.meta}>Class: Pending assignment</Text>
      )}
      {status ? <Text style={styles.meta}>Status: {status}</Text> : null}
    </View>
  );
});

export default StudentCard;

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
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
