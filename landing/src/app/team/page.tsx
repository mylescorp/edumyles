import type { Metadata } from "next";
import Link from "next/link";
import TeamCard from "./TeamCard";

export const metadata: Metadata = {
  title: "Our Team — EduMyles",
  description:
    "Meet the people behind EduMyles — engineers, educators, and operators building the future of school management in East Africa.",
};

interface TeamMember {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string | null;
  initials: string;
  location: string;
}

const leadership: TeamMember[] = [
  {
    name: "Jonathan Myles",
    role: "CEO & Founder",
    department: "Leadership",
    bio: "Visionary behind EduMyles. Built the platform after witnessing the operational chaos in East African schools. Leads product strategy and company direction from Nairobi.",
    image: "/team/jonathan-myles.jpg",
    initials: "JM",
    location: "Nairobi, Kenya",
  },
  {
    name: "Akinyi Odhiambo",
    role: "Chief Technology Officer",
    department: "Leadership",
    bio: "Full-stack architect with 10+ years building scalable SaaS platforms. Leads the engineering team and oversees the Convex-powered real-time backend.",
    image: null,
    initials: "AO",
    location: "Nairobi, Kenya",
  },
  {
    name: "Kwame Asante",
    role: "Chief Operating Officer",
    department: "Leadership",
    bio: "Former school administrator turned tech operator. Ensures EduMyles delivers on its promise to simplify school management across every market we serve.",
    image: null,
    initials: "KA",
    location: "Accra, Ghana",
  },
];

const engineering: TeamMember[] = [
  {
    name: "Wanjiku Kamau",
    role: "Senior Full-Stack Engineer",
    department: "Engineering",
    bio: "Next.js and Convex specialist. Architects the multi-tenant frontend and leads the design system implementation.",
    image: null,
    initials: "WK",
    location: "Nairobi, Kenya",
  },
  {
    name: "Mugisha Uwimana",
    role: "Backend Engineer",
    department: "Engineering",
    bio: "Builds the Convex backend modules — finance, timetable, and academics. Passionate about data integrity and real-time sync.",
    image: null,
    initials: "MU",
    location: "Kigali, Rwanda",
  },
  {
    name: "Amara Diallo",
    role: "Mobile Developer",
    department: "Engineering",
    bio: "Leads the React Native / Expo mobile app development. Focuses on offline-first experiences for schools with limited connectivity.",
    image: null,
    initials: "AD",
    location: "Dar es Salaam, Tanzania",
  },
  {
    name: "Otieno Njoroge",
    role: "DevOps & Infrastructure",
    department: "Engineering",
    bio: "Manages Vercel deployments, Convex infrastructure, and CI/CD pipelines. Keeps the platform running at 99.9% uptime.",
    image: null,
    initials: "ON",
    location: "Nairobi, Kenya",
  },
];

const product: TeamMember[] = [
  {
    name: "Fatima Abdi",
    role: "Head of Product",
    department: "Product",
    bio: "Translates school needs into product features. Conducts regular school visits to ensure EduMyles solves real problems, not imaginary ones.",
    image: null,
    initials: "FA",
    location: "Nairobi, Kenya",
  },
  {
    name: "Tendai Moyo",
    role: "UX Designer",
    department: "Product",
    bio: "Designs interfaces that school staff with minimal tech experience can use confidently. Accessibility and simplicity are her north stars.",
    image: null,
    initials: "TM",
    location: "Kampala, Uganda",
  },
];

const operations: TeamMember[] = [
  {
    name: "Nalini Wafula",
    role: "Head of Customer Success",
    department: "Operations",
    bio: "Leads onboarding and support for all schools. Former teacher who understands exactly what school staff need to succeed with EduMyles.",
    image: null,
    initials: "NW",
    location: "Nairobi, Kenya",
  },
  {
    name: "Baraka Mwenda",
    role: "Sales & Partnerships",
    department: "Operations",
    bio: "Manages the partner programme and school group accounts. Builds relationships with education ministries and NGOs across the region.",
    image: null,
    initials: "BM",
    location: "Dar es Salaam, Tanzania",
  },
  {
    name: "Zuri Nyambura",
    role: "Marketing & Content",
    department: "Operations",
    bio: "Tells the EduMyles story through content, webinars, and community building. Runs the \"Into the Zone\" newsletter.",
    image: null,
    initials: "ZN",
    location: "Nairobi, Kenya",
  },
];

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Our Team</p>
          <h1>The people building EduMyles.</h1>
          <p className="subtext">
            A distributed team of engineers, educators, designers, and operators
            across East Africa — united by a mission to transform how schools
            operate.
          </p>
        </div>
      </section>

      {/* Leadership */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header">
            <h2>Leadership</h2>
          </div>
          <div className="team-grid leadership-grid">
            {leadership.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        </div>
      </section>

      {/* Engineering */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header">
            <h2>Engineering</h2>
          </div>
          <div className="team-grid">
            {engineering.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        </div>
      </section>

      {/* Product */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header">
            <h2>Product &amp; Design</h2>
          </div>
          <div className="team-grid">
            {product.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        </div>
      </section>

      {/* Operations */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header">
            <h2>Operations &amp; Growth</h2>
          </div>
          <div className="team-grid">
            {operations.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Join our team</h2>
            <p className="section-subtitle light">
              We&apos;re always looking for passionate people who want to make a
              real impact on education in Africa. Fully remote, flexible hours,
              and meaningful work.
            </p>
            <div className="actions centered-actions" style={{ marginTop: "1.5rem" }}>
              <a className="btn btn-amber" href="mailto:info@edumyles.com?subject=Careers%20at%20EduMyles">
                View Open Positions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Want to learn more about EduMyles?</h2>
          <p>Read our story or get in touch with the team.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/about">
              Our Story
            </Link>
            <Link className="btn btn-secondary" href="/contact">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
