"use client";

import Link from "next/link";
import { useState } from "react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  location: string;
  image?: string;
  initials: string;
}

const leadership: TeamMember[] = [
  {
    name: "Jonathan Myles",
    role: "CEO & Founder",
    bio: "Full-stack software engineer with deep expertise in scalable web applications and distributed systems. Founded EduMyles after witnessing how schools across East Africa struggled with fragmented management tools. Leads product development and technical architecture.",
    location: "Nairobi, Kenya",
    image: "/team/jonathan-myles.jpg",
    initials: "JM",
  },
  {
    name: "Pauline Moraa",
    role: "Co-Founder & COO",
    bio: "Background in sales and business operations across B2B and enterprise markets in East Africa. Oversees go-to-market strategy, partnerships, customer success, and daily operations. Built the school onboarding process from the ground up.",
    location: "Nairobi, Kenya",
    image: "/team/pauline-moraa.jpg",
    initials: "PM",
  },
];

const engineering: TeamMember[] = [
  {
    name: "Amani Ochieng",
    role: "Senior Backend Engineer",
    bio: "Specializes in API design, database architecture, and payment integrations. Built the M-Pesa and Airtel Money modules that power fee collection for 50+ schools.",
    location: "Nairobi, Kenya",
    initials: "AO",
  },
  {
    name: "Wanjiru Kamau",
    role: "Frontend Engineer",
    bio: "React and Next.js specialist focused on building accessible, responsive interfaces. Leads the parent and student portal development.",
    location: "Nairobi, Kenya",
    initials: "WK",
  },
  {
    name: "Baraka Mwangi",
    role: "DevOps & Infrastructure",
    bio: "Manages cloud infrastructure, CI/CD pipelines, and platform reliability. Ensures 99.9% uptime across all school deployments.",
    location: "Nairobi, Kenya",
    initials: "BM",
  },
  {
    name: "Njeri Ndung'u",
    role: "Mobile Engineer",
    bio: "Building the EduMyles mobile experience for parents and teachers. Focuses on offline-first design for schools with unreliable connectivity.",
    location: "Mombasa, Kenya",
    initials: "NN",
  },
];

const product: TeamMember[] = [
  {
    name: "Akinyi Otieno",
    role: "Product Designer",
    bio: "Designs intuitive interfaces that work for school staff with varying digital literacy levels. Conducts regular user research with administrators and teachers across East Africa.",
    location: "Nairobi, Kenya",
    initials: "AO",
  },
  {
    name: "Kimani Gathiru",
    role: "Product Manager",
    bio: "Former school administrator who brings first-hand operational experience. Translates school needs into product features and manages the development roadmap.",
    location: "Nakuru, Kenya",
    initials: "KG",
  },
];

const operations: TeamMember[] = [
  {
    name: "Auma Odhiambo",
    role: "Head of Customer Success",
    bio: "Leads the onboarding and training team. Has personally onboarded 30+ schools and developed the implementation playbook that guides every new deployment.",
    location: "Kisumu, Kenya",
    initials: "AO",
  },
  {
    name: "Ssebunya David",
    role: "Regional Manager - Uganda",
    bio: "Manages school partnerships and implementations across Uganda. Brings deep understanding of the Ugandan education system and UNEB requirements.",
    location: "Kampala, Uganda",
    initials: "SD",
  },
  {
    name: "Zawadi Mushi",
    role: "Regional Manager - Tanzania",
    bio: "Drives growth and school support in Tanzania. Expert in Tanzanian curriculum requirements and NECTA assessment frameworks.",
    location: "Dar es Salaam, Tanzania",
    initials: "ZM",
  },
  {
    name: "Uwimana Claire",
    role: "Support Lead",
    bio: "Manages the technical support team and ensures every school gets responsive help. Speaks English, Swahili, French, and Kinyarwanda.",
    location: "Kigali, Rwanda",
    initials: "UC",
  },
];

function TeamCard({ member }: { member: TeamMember }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="team-card">
      <div className="team-card-image">
        {member.image && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={member.image}
            alt={member.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="team-avatar-fallback">{member.initials}</div>
        )}
      </div>
      <div className="team-card-info">
        <h3>{member.name}</h3>
        <span className="team-role">{member.role}</span>
        <p className="team-bio">{member.bio}</p>
        <span className="team-location">{member.location}</span>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <main>
      <section className="page-hero green-hero">
        <div className="page-hero-inner">
          <p className="eyebrow light">Our Team</p>
          <h1 className="light-heading">Engineers, Educators &amp; Operators</h1>
          <p className="subtext light">
            A passionate team of Africans building software that schools across East Africa can
            trust. We combine deep technical expertise with real-world understanding of how
            schools operate on the ground.
          </p>
        </div>
      </section>

      {/* Leadership */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Leadership</h2>
            <p className="section-subtitle">
              Founded by a software engineer and a business operator, EduMyles is led by people
              who understand both the technology and the market.
            </p>
          </div>
          <div className="team-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "700px", margin: "0 auto" }}>
            {leadership.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* What drives us */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>What drives us</h2>
            <p className="section-subtitle">
              We have seen firsthand how outdated school management tools hold institutions back.
              Our mission is to change that with technology built for how African schools actually work.
            </p>
          </div>
          <div className="features-grid three-col">
            <div className="feature-card">
              <h3>School-First Thinking</h3>
              <p>
                Every feature we build starts with a real problem faced by a real school. We visit
                schools, shadow administrators, and test with actual users before shipping.
              </p>
            </div>
            <div className="feature-card">
              <h3>Local Expertise</h3>
              <p>
                Our team is based across East Africa. We understand the curricula, payment methods,
                regulatory requirements, and operational realities of the region.
              </p>
            </div>
            <div className="feature-card">
              <h3>Long-Term Partnership</h3>
              <p>
                We do not just sell software - we partner with schools for the long term. Our success
                is measured by the success of the institutions we serve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header">
            <h2>Product &amp; Engineering</h2>
            <p className="section-subtitle">
              Building stable, secure systems for daily institutional use across multiple countries and curricula.
            </p>
          </div>
          <div className="team-grid">
            {engineering.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Product & Design */}
      <section className="content-section alt">
        <div className="content-inner">
          <div className="section-header">
            <h2>Product &amp; Design</h2>
            <p className="section-subtitle">
              Designing intuitive experiences that work for schools with varying levels of digital literacy.
            </p>
          </div>
          <div className="team-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "700px" }}>
            {product.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Operations & Success */}
      <section className="content-section">
        <div className="content-inner">
          <div className="section-header">
            <h2>Operations &amp; Customer Success</h2>
            <p className="section-subtitle">
              Supporting rollout, adoption, and training for school teams across six countries.
            </p>
          </div>
          <div className="team-grid">
            {operations.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="section-header centered">
            <h2 style={{ color: "var(--white)" }}>Join our team</h2>
            <p className="section-subtitle light">
              We are always looking for talented people who are passionate about education and
              technology across Africa. If you want to make a real impact, we would love to hear from you.
            </p>
          </div>
          <div className="centered-actions">
            <a className="btn btn-amber" href="mailto:careers@edumyles.com">
              View Open Positions
            </a>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Want to see what we have built?</h2>
          <p>Start your free trial and explore the platform our team has crafted for schools like yours.</p>
          <Link className="btn btn-primary" href="/auth/signup">Get Started Free</Link>
        </div>
      </section>
    </main>
  );
}
