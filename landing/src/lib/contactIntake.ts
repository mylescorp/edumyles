export const WHATSAPP_NUMBER = "254743993715";

export const CONTACT_TOPICS = [
  {
    id: "book_demo",
    label: "Book a demo",
    prompt: "I would like to book a demo for my school.",
  },
  {
    id: "pricing",
    label: "Pricing",
    prompt: "I would like help choosing the right EduMyles plan.",
  },
  {
    id: "implementation",
    label: "Implementation",
    prompt: "I want to understand onboarding, data migration, and implementation timelines.",
  },
  {
    id: "multi_campus",
    label: "Multi-campus",
    prompt: "I want to discuss managing multiple campuses or a school network.",
  },
  {
    id: "partners",
    label: "Partner program",
    prompt: "I am interested in EduMyles partner, affiliate, reseller, or developer programs.",
  },
  {
    id: "support",
    label: "Support",
    prompt: "I need help from the EduMyles team.",
  },
] as const;

export type ContactTopicId = (typeof CONTACT_TOPICS)[number]["id"];

export type ContactProfile = {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  role: string;
  country: string;
};

export const EMPTY_CONTACT_PROFILE: ContactProfile = {
  name: "",
  email: "",
  phone: "",
  schoolName: "",
  role: "",
  country: "Kenya",
};

export function getContactTopic(id: string) {
  return CONTACT_TOPICS.find((topic) => topic.id === id) ?? CONTACT_TOPICS[0];
}

export function buildContactMessage({
  profile,
  topicId,
  message,
  pagePath,
}: {
  profile: ContactProfile;
  topicId: string;
  message: string;
  pagePath?: string;
}) {
  const topic = getContactTopic(topicId);
  return [
    "Hello EduMyles team,",
    "",
    message.trim() || topic.prompt,
    "",
    "Sender details:",
    `Name: ${profile.name || "Not provided"}`,
    `Email: ${profile.email || "Not provided"}`,
    `Phone: ${profile.phone || "Not provided"}`,
    `School/organization: ${profile.schoolName || "Not provided"}`,
    `Role: ${profile.role || "Not provided"}`,
    `Country: ${profile.country || "Not provided"}`,
    `Topic: ${topic.label}`,
    pagePath ? `Page: ${pagePath}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
