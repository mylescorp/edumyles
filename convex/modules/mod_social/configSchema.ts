export const SOCIAL_CONFIG_SCHEMA = {
  moduleSlug: "mod_social",
  sections: [
    {
      key: "approval",
      title: "Approval Flow",
      description: "Configure social post review and publishing behavior.",
      fields: [
        { key: "requiresApproval", type: "boolean", label: "Requires approval", defaultValue: true },
        { key: "autoPublishOnApproval", type: "boolean", label: "Auto publish on approval", defaultValue: true },
        { key: "allowSelfApproval", type: "boolean", label: "Allow self approval", defaultValue: false },
        { key: "defaultTimezone", type: "string", label: "Default timezone", defaultValue: "Africa/Nairobi" },
      ],
    },
  ],
};
