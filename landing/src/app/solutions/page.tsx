import type { Metadata } from "next";
import Link from "next/link";
import {
  School,
  GraduationCap,
  Globe,
  Building2,
  CheckCircle2,
  ArrowRight,
  Users,
  BarChart2,
  Shield,
  Zap,
  Clock,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Solutions — EduMyles | School Management for Every Institution",
  description:
    "Complete school management solutions for primary schools, secondary schools, international schools, and school groups. CBC-ready, KCSE support, IGCSE & IB curriculum, and multi-campus management.",
};

const solutions = [
  {
    icon: School,
    title: "Primary Schools",
    description:
      "CBC-ready management system for PP1 to Class 8 with automated assessments and parent communication.",
    href: "/solutions/primary-schools",
    features: [
      "CBC Gradebook & Assessments",
      "M-Pesa Fee Management",
      "Automated Report Cards",
      "Parent Communication Portal",
      "NEMIS Integration",
      "Digital Learning Resources",
    ],
    color: "#0F4C2A",
    bgGradient: "from-green-50 to-emerald-50",
    stats: {
      schools: "500+",
      students: "150K+",
      satisfaction: "98%",
    },
  },
  {
    icon: GraduationCap,
    title: "Secondary Schools",
    description:
      "Comprehensive KCSE management with advanced timetabling, HR payroll, and performance analytics.",
    href: "/solutions/secondary-schools",
    features: [
      "KCSE Exam Management",
      "Advanced Timetabling",
      "HR & Payroll System",
      "Performance Analytics",
      "Discipline Tracking",
      "Career Guidance",
    ],
    color: "#1A7A4A",
    bgGradient: "from-emerald-50 to-teal-50",
    stats: {
      schools: "300+",
      students: "200K+",
      satisfaction: "97%",
    },
  },
  {
    icon: Globe,
    title: "International Schools",
    description:
      "IGCSE & IB curriculum support with SSO, white-label options, and global standards compliance.",
    href: "/solutions/international-schools",
    features: [
      "IGCSE & IB Curriculum",
      "Single Sign-On (SSO)",
      "White-Label Options",
      "Multi-Language Support",
      "Global Standards Compliance",
      "Exchange Program Management",
    ],
    color: "#E8A020",
    bgGradient: "from-amber-50 to-orange-50",
    stats: {
      schools: "50+",
      students: "25K+",
      satisfaction: "99%",
    },
  },
  {
    icon: Building2,
    title: "School Groups",
    description:
      "Multi-campus management with consolidated reporting, centralized administration, and scalable infrastructure.",
    href: "/solutions/school-groups",
    features: [
      "Multi-Campus Management",
      "Consolidated Reporting",
      "Centralized Administration",
      "Resource Sharing",
      "Standardized Processes",
      "Group-Level Analytics",
    ],
    color: "#061A12",
    bgGradient: "from-slate-50 to-gray-50",
    stats: {
      schools: "100+",
      campuses: "400+",
      satisfaction: "96%",
    },
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "GDPR-compliant with enterprise-grade security and regular data backups",
  },
  {
    icon: Zap,
    title: "Fast Implementation",
    description: "Go live in 2 weeks with dedicated onboarding support and training",
  },
  {
    icon: Users,
    title: "24/7 Support",
    description: "Round-the-clock customer support with dedicated account managers",
  },
  {
    icon: BarChart2,
    title: "Data-Driven Insights",
    description: "Advanced analytics and reporting for informed decision-making",
  },
  {
    icon: Clock,
    title: "Time-Saving Automation",
    description: "Automate routine tasks and reduce administrative workload by 70%",
  },
  {
    icon: Star,
    title: "Proven Results",
    description: "Trusted by 1000+ schools with 97% customer satisfaction rate",
  },
];

export default function SolutionsPage() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 50%, #1A7A4A 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(232,160,32,0.3) 0%, transparent 50%), 
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div className="relative max-w-[1200px] mx-auto text-center">
          <div className="max-w-[800px] mx-auto">
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,4rem)", color: "#ffffff" }}
            >
              Solutions Built for <span style={{ color: "#E8A020" }}>Every School</span>
            </h1>
            <p className="font-jakarta text-xl leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
              From primary schools to international institutions, EduMyles adapts to your unique
              needs. Streamline administration, enhance learning, and empower your entire school
              community.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {["CBC-Ready", "KCSE Support", "IGCSE & IB", "Multi-Campus"].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center font-jakarta font-semibold text-sm px-4 py-2 rounded-full"
                  style={{
                    background: "rgba(232,160,32,0.15)",
                    color: "#E8A020",
                    border: "1px solid rgba(232,160,32,0.3)",
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-display font-bold leading-tight mb-4"
              style={{ fontSize: "clamp(2rem,3.5vw,3rem)", color: "#061A12" }}
            >
              Tailored Solutions for <span style={{ color: "#E8A020" }}>Your Institution</span>
            </h2>
            <p
              className="font-jakarta text-lg max-w-[700px] mx-auto"
              style={{ color: "#5a5a5a", lineHeight: "1.7" }}
            >
              Each solution is specifically designed to address the unique challenges and
              requirements of different educational institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {solutions.map((solution, _index) => (
              <div
                key={solution.title}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-3"
                style={{
                  background: "#ffffff",
                  border: "2px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 4px 20px rgba(6,26,18,0.08)",
                }}
              >
                {/* Card Header */}
                <div
                  className="p-6 pb-4"
                  style={{
                    background: `linear-gradient(135deg, ${solution.bgGradient})`,
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: solution.color }}
                    >
                      <solution.icon className="w-8 h-8" style={{ color: "#ffffff" }} />
                    </div>
                    <div>
                      <h3
                        className="font-display font-bold text-2xl mb-1"
                        style={{ color: solution.color }}
                      >
                        {solution.title}
                      </h3>
                      <p className="font-jakarta text-sm font-medium" style={{ color: "#374151" }}>
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "rgba(6,26,18,0.02)" }}
                    >
                      <div
                        className="font-jakarta font-bold text-xl"
                        style={{ color: solution.color }}
                      >
                        {solution.stats.schools}
                      </div>
                      <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                        Schools
                      </div>
                    </div>
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "rgba(6,26,18,0.02)" }}
                    >
                      <div
                        className="font-jakarta font-bold text-xl"
                        style={{ color: solution.color }}
                      >
                        {solution.stats.students}
                      </div>
                      <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                        Students
                      </div>
                    </div>
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "rgba(6,26,18,0.02)" }}
                    >
                      <div
                        className="font-jakarta font-bold text-xl"
                        style={{ color: solution.color }}
                      >
                        {solution.stats.satisfaction}
                      </div>
                      <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                        Satisfaction
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {solution.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <CheckCircle2
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: solution.color }}
                        />
                        <span className="font-jakarta text-sm" style={{ color: "#374151" }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Link
                    href={solution.href}
                    className="w-full inline-flex items-center justify-center gap-2 font-jakarta font-bold text-sm px-6 py-4 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                    style={{
                      background: solution.color,
                      color: "#ffffff",
                    }}
                  >
                    Explore {solution.title}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* View All Solutions Button */}
          <div className="text-center">
            <p className="font-jakarta text-sm mb-4" style={{ color: "#5a5a5a" }}>
              Looking for something specific? Each solution is tailored to your institution&apos;s
              unique needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {solutions.map((solution, _index) => (
                <Link
                  key={solution.href}
                  href={solution.href}
                  className="inline-flex items-center gap-2 font-jakarta font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 hover:shadow-md"
                  style={{
                    background: "transparent",
                    color: solution.color,
                    border: `2px solid ${solution.color}`,
                  }}
                >
                  {solution.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-display font-bold leading-tight mb-4"
              style={{ fontSize: "clamp(2rem,3.5vw,3rem)", color: "#061A12" }}
            >
              Why Schools Choose <span style={{ color: "#E8A020" }}>EduMyles</span>
            </h2>
            <p
              className="font-jakarta text-lg max-w-[700px] mx-auto"
              style={{ color: "#5a5a5a", lineHeight: "1.7" }}
            >
              Experience the difference with our comprehensive school management platform designed
              for the modern educational landscape.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="text-center p-6 rounded-2xl bg-white"
                style={{ border: "1px solid #d4eade" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(26,122,74,0.1)" }}
                >
                  <benefit.icon className="w-8 h-8" style={{ color: "#1A7A4A" }} />
                </div>
                <h3 className="font-display font-bold text-xl mb-3" style={{ color: "#061A12" }}>
                  {benefit.title}
                </h3>
                <p className="font-jakarta text-sm leading-[1.6]" style={{ color: "#5a5a5a" }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ background: "#061A12" }}>
        <div className="max-w-[800px] mx-auto text-center">
          <h2
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2rem,3.5vw,3rem)", color: "#ffffff" }}
          >
            Ready to Transform Your <span style={{ color: "#E8A020" }}>School Management?</span>
          </h2>
          <p className="font-jakarta text-lg mb-8" style={{ color: "#A8E6C3", lineHeight: "1.7" }}>
            Join 1000+ schools across East Africa that have already streamlined their operations and
            enhanced educational outcomes with EduMyles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline transition-all duration-200 hover:shadow-lg"
              style={{
                background: "#E8A020",
                color: "#061A12",
              }}
            >
              Book a Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#solutions"
              className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline transition-all duration-200"
              style={{
                background: "transparent",
                color: "#ffffff",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              View All Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
