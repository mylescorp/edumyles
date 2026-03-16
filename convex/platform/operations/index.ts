import {
  createIncident,
  updateIncident,
  addIncidentTimeline,
  createMaintenanceWindow,
  updateMaintenanceStatus,
  cancelMaintenance,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  createAlertSuppression,
  removeAlertSuppression,
} from "./mutations";
import {
  getIncidents,
  getIncidentDetails,
  getMaintenanceWindows,
  getAlerts,
  getOperationsOverview,
  getScheduledNotifications,
  listAlertSuppressions,
  getAlertAcknowledgements,
} from "./queries";
