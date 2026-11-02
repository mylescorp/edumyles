import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Award,
  FileText,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CBC Gradebook in EduMyles: A Complete Guide for Kenyan Schools",
  description:
    "Everything you need to know about setting up competency-based assessment, learning areas, and strand reports. Complete CBC implementation guide for Kenyan schools.",
};

export default function CBCGradingGuide() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-chrome-platform) 0%, var(--color-action-primary) 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-action-primary) 30%, transparent) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--color-text-on-primary) 10%, transparent) 0%, transparent 50%)`,
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div className="relative max-w-[800px] mx-auto">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "color-mix(in srgb, var(--color-surface-default) 10%, transparent)", color: "var(--color-text-muted)" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "var(--color-text-inverse)" }}
            >
              CBC Gradebook in EduMyles: <span style={{ color: "var(--color-text-on-primary-subtle)" }}>Complete Guide</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  CBC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  9 min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  February 2026
                </span>
              </div>
            </div>

            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
              Everything you need to know about setting up competency-based assessment, learning
              areas, and strand reports. Master CBC implementation with EduMyles.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
              The Competency-Based Curriculum (CBC) has transformed how Kenyan schools assess
              student learning. But tracking competencies, strands, and learning outcomes across
              multiple subjects can be overwhelming without the right tools.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
              EduMyles was built specifically for CBC implementation. Our gradebook handles
              everything from PP1 to Grade 8, automatically organizes assessments by strands, and
              generates KNEC-compliant report cards. This guide shows you how to leverage every
              feature.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, var(--color-surface-default) 0%, var(--color-surface-sunken) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--color-text-default)" }}>
                  CBC Compliance Features
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "KNEC-compliant report card formats",
                  "Automatic strand and sub-strand organization",
                  "Competency tracking across learning areas",
                  "Portfolio evidence management",
                  "Parent-friendly progress reports",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                    <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Understanding CBC Structure */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Understanding CBC Structure in EduMyles
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Learning Areas",
                  description: "Broad subjects like Mathematics, English, Kiswahili, Science, etc.",
                  examples: ["Mathematics", "English", "Science", "Social Studies"],
                },
                {
                  title: "Strands",
                  description: "Sub-divisions within learning areas focusing on specific themes.",
                  examples: ["Numbers", "Geometry", "Measurement", "Data Handling"],
                },
                {
                  title: "Sub-strands",
                  description: "Specific topics or skills within each strand.",
                  examples: ["Counting", "Addition", "Patterns", "Problem Solving"],
                },
              ].map((level) => (
                <div
                  key={level.title}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--color-text-default)" }}>
                    {level.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {level.description}
                  </p>
                  <div className="space-y-1">
                    {level.examples.map((example) => (
                      <div
                        key={example}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Guide */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Setting Up Your CBC Gradebook
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "Step 1",
                  title: "Configure Learning Areas",
                  content:
                    "Navigate to Academics > Gradebook > Learning Areas. Add all CBC learning areas for each grade level. EduMyles comes pre-loaded with standard CBC learning areas, but you can customize them.",
                  tips: [
                    "Import from Ministry templates",
                    "Add custom learning areas for special programs",
                    "Set weight distributions per learning area",
                  ],
                },
                {
                  step: "Step 2",
                  title: "Set Up Strands and Sub-strands",
                  content:
                    "For each learning area, define the strands and sub-strands. EduMyles automatically organizes these hierarchically, making it easy to assign assessments to the correct level.",
                  tips: [
                    "Use KNEC strand definitions",
                    "Add school-specific sub-strands",
                    "Enable strand weight customization",
                  ],
                },
                {
                  step: "Step 3",
                  title: "Create Assessment Templates",
                  content:
                    "Design assessment templates for different types: formative, summative, practical, and portfolio. Each template can have custom rubrics and scoring criteria.",
                  tips: [
                    "Build rubric libraries",
                    "Set automatic competency mapping",
                    "Enable peer assessment options",
                  ],
                },
                {
                  step: "Step 4",
                  title: "Configure Competency Tracking",
                  content:
                    "Set up competency descriptors for each grade level. EduMyles will automatically track student progress against these competencies across all assessments.",
                  tips: [
                    "Use Ministry competency descriptors",
                    "Add school-specific competencies",
                    "Enable competency visualization",
                  ],
                },
                {
                  step: "Step 5",
                  title: "Test with Staging Data",
                  content:
                    "Before going live, test the system with staging student records and assessments. Verify that report cards generate correctly and all calculations are accurate.",
                  tips: [
                    "Test all grade levels",
                    "Verify report card formats",
                    "Check parent portal display",
                  ],
                },
              ].map((step) => (
                <div key={step.step} className="border-l-4 pl-6" style={{ borderColor: "var(--color-action-primary)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-jakarta font-bold text-sm px-3 py-1 rounded-full"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: "var(--color-text-default)" }}>
                    {step.title}
                  </h3>
                  <p
                    className="font-jakarta text-base leading-[1.7] mb-4"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {step.content}
                  </p>
                  <div className="space-y-2">
                    {step.tips.map((tip) => (
                      <div key={tip} className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-action-primary)" }} />
                        <span style={{ color: "var(--color-text-muted)" }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Types */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              CBC Assessment Types in EduMyles
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  type: "Formative Assessment",
                  description:
                    "Ongoing assessments during learning to monitor progress and provide feedback.",
                  frequency: "Weekly/Bi-weekly",
                  weight: "20-30%",
                  examples: ["Class exercises", "Quizzes", "Observations", "Learning activities"],
                },
                {
                  type: "Summative Assessment",
                  description:
                    "End-of-unit or end-of-term assessments to evaluate cumulative learning.",
                  frequency: "End of term",
                  weight: "40-50%",
                  examples: ["End-of-term tests", "Projects", "Presentations", "Practical exams"],
                },
                {
                  type: "Portfolio Assessment",
                  description:
                    "Collection of student work demonstrating growth and achievement over time.",
                  frequency: "Continuous",
                  weight: "20-30%",
                  examples: [
                    "Artwork",
                    "Writing evidence",
                    "Science projects",
                    "Performance recordings",
                  ],
                },
                {
                  type: "Peer and Self Assessment",
                  description:
                    "Students evaluate their own work and that of peers using clear criteria.",
                  frequency: "Regular",
                  weight: "5-10%",
                  examples: ["Self-reflection", "Peer review", "Group evaluation", "Goal setting"],
                },
              ].map((assessment) => (
                <div
                  key={assessment.type}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--color-text-default)" }}>
                    {assessment.type}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {assessment.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--color-text-muted)" }}>Frequency:</span>
                      <span className="font-semibold" style={{ color: "var(--color-action-primary)" }}>
                        {assessment.frequency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--color-text-muted)" }}>Weight:</span>
                      <span className="font-semibold" style={{ color: "var(--color-action-primary)" }}>
                        {assessment.weight}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border-default)" }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-default)" }}>
                      Examples:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assessment.examples.map((example) => (
                        <span
                          key={example}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Cards */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Generating KNEC-Compliant Report Cards
            </h2>

            <div
              className="p-6 rounded-2xl mb-6"
              style={{
                background: "linear-gradient(135deg, var(--color-surface-default) 0%, var(--color-surface-sunken) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6" style={{ color: "var(--color-action-primary)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--color-text-default)" }}>
                  Report Card Features
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4
                    className="font-jakarta font-semibold text-base mb-3"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    Academic Performance
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Learning area scores",
                      "Strand performance breakdown",
                      "Competency achievement levels",
                      "Teacher comments per learning area",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--color-action-primary)" }}
                        />
                        <span style={{ color: "var(--color-text-muted)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4
                    className="font-jakarta font-semibold text-base mb-3"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    Holistic Development
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Values and attitudes",
                      "Social skills development",
                      "Learning behaviors",
                      "Attendance and punctuality",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--color-action-primary)" }}
                        />
                        <span style={{ color: "var(--color-text-muted)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Automatic Grade Calculation",
                  description:
                    "EduMyles automatically calculates competency levels (Exceeds Expectations, Meets Expectations, Approaching Expectations, Below Expectations) based on assessment scores.",
                },
                {
                  title: "Parent-Friendly Format",
                  description:
                    "Report cards are designed to be easily understood by parents, with clear visual indicators and progress tracking.",
                },
                {
                  title: "Digital Signatures",
                  description:
                    "Digital signatures from head teachers and class teachers can be added automatically for authenticity.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: "var(--color-action-primary)" }} />
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-semibold text-base mb-1"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {feature.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Portal Integration */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Parent Portal Integration
            </h2>

            <div
              className="p-8 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--color-chrome-platform) 0%, var(--color-action-primary) 100%)",
                color: "var(--color-text-inverse)",
              }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-display font-bold text-xl mb-4" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                    What Parents See
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Real-time grade updates",
                      "Competency progress visualization",
                      "Teacher comments and feedback",
                      "Attendance records",
                      "Portfolio evidence",
                      "Learning resources",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--color-text-on-primary-subtle)" }}
                        />
                        <span className="font-jakarta text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl mb-4" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                    Benefits for Schools
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Reduced parent inquiries",
                      "Increased parent engagement",
                      "Transparent communication",
                      "Fewer printed report cards",
                      "Improved accountability",
                      "Better student outcomes",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                        <span className="font-jakarta text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Success Stories: CBC Implementation
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Nairobi Primary School",
                  challenge: "Manual CBC tracking was taking 15 hours per week per teacher.",
                  solution:
                    "Implemented EduMyles CBC gradebook with automated competency tracking.",
                  results: "Reduced admin time by 80%, improved parent satisfaction to 96%.",
                },
                {
                  school: "Mombasa Academy",
                  challenge: "Parents didn't understand CBC progress reports.",
                  solution: "Used EduMyles parent portal with visual progress indicators.",
                  results: "Parent-teacher meeting attendance increased by 40%.",
                },
                {
                  school: "Kisumu Girls Boarding",
                  challenge: "Struggling with portfolio evidence management.",
                  solution: "Digital portfolio system with automatic organization.",
                  results: "Portfolio completion rate improved from 60% to 95%.",
                },
              ].map((story) => (
                <div
                  key={story.school}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--color-text-default)" }}>
                    {story.school}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-status-danger-solid)" }}>
                        Challenge:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.challenge}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-action-primary)" }}>
                        Solution:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.solution}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                        Results:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.results}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--color-text-default)" }}>
              Ready to Master CBC Implementation?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
              Join 300+ Kenyan schools using EduMyles for seamless CBC gradebook management.
            </p>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
              style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
            >
              Book a CBC Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
