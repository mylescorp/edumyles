export const SOCIAL_NOTIFICATIONS = [
  {
    key: "social_post_submitted",
    label: "Social Post Submitted",
    description: "Sent when a new social post is submitted for review.",
    defaultChannels: ["in_app", "email"],
    canDisable: false,
  },
  {
    key: "social_post_approved",
    label: "Social Post Approved",
    description: "Sent when a social post is approved.",
    defaultChannels: ["in_app", "email"],
    canDisable: false,
  },
  {
    key: "social_post_rejected",
    label: "Social Post Rejected",
    description: "Sent when a social post is rejected.",
    defaultChannels: ["in_app", "email"],
    canDisable: false,
  },
  {
    key: "social_post_published",
    label: "Social Post Published",
    description: "Sent when a social post publishes successfully.",
    defaultChannels: ["in_app"],
    canDisable: true,
  },
];
