import { createIncident, updateIncident, addIncidentTimeline, createMaintenanceWindow, updateMaintenanceStatus, createAlert, acknowledgeAlert, resolveAlert } from "./mutations";
import { getIncidents, getIncidentDetails, getMaintenanceWindows, getAlerts, getOperationsOverview, getScheduledNotifications } from "./queries";
