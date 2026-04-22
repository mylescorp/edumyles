import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export type AttendanceRowProps = {
  _id: string;
  date?: string;
  status?: string;
  remarks?: string;
};

const STATUS_COLORS: Record<string, string> = {
  present: theme.colors.success,
  absent: theme.colors.error,
  late: theme.colors.warning,
  excused: theme.colors.info,
};

const AttendanceRow = React.memo(function AttendanceRow({
  date,
  status,
  remarks,
}: AttendanceRowProps) {
  const statusLabel = String(status ?? "").toUpperCase();
  const statusColor =
    STATUS_COLORS[String(status ?? "").toLowerCase()] ?? theme.colors.textSecondary;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {date ? <Text style={styles.date}>{date}</Text> : null}
        <Text style={[styles.statusBadge, { color: statusColor, borderColor: statusColor }]}>
          {statusLabel}
        </Text>
      </View>
      {remarks ? <Text style={styles.remarks}>{remarks}</Text> : null}
    </View>
  );
});

export default AttendanceRow;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.regular,
  },
  statusBadge: {
    fontSize: 12,
    fontFamily: theme.fonts.display,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  remarks: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontFamily: theme.fonts.regular,
  },
});
