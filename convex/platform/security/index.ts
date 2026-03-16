import {
  createSecurityIncident,
  updateSecurityIncident,
  acknowledgeThreat,
  mitigateThreat,
  blockIP,
  unblockIP,
  createThreat,
  updateThreat,
  addSecurityIncidentTimeline,
  createVulnerability,
  updateVulnerability,
  runVulnerabilityScan
} from "./mutations";
import {
  getSecurityOverview,
  getActiveThreats,
  getSecurityIncidents,
  getComplianceStatus,
  getAccessLogs,
  listBlockedIPs,
  listVulnerabilities,
  getSecurityIncidentTimeline,
  getVulnerabilityScan
} from "./queries";
