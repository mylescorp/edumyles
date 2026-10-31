import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertCircle,
  Target,
  Zap,
  Settings,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Timetable Generation: How EduMyles Creates Conflict-Free Schedules Automatically",
  description:
    "The algorithm behind EduMyles timetable engine — and why it saves school coordinators 2 full days every term. Learn how automatic scheduling works.",
};

export default function TimetableGenerationGuide() {
  return (
    <div style={{ color: "var(--foreground)" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--platform-chrome) 0%, var(--primary) 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgb(var(--primary-rgb) / 30%) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
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
              style={{ background: "rgba(255,255,255,0.1)", color: "var(--muted-foreground)" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "#ffffff" }}
            >
              Automatic Timetable Generation <span style={{ color: "var(--accent-foreground)" }}>Saves 2 Days</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" style={{ color: "var(--accent-foreground)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Operations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "var(--accent-foreground)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  7 min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  December 2025
                </span>
              </div>
            </div>

            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "var(--muted-foreground)" }}>
              The algorithm behind EduMyles timetable engine — and why it saves school coordinators
              2 full days every term. Discover the science of conflict-free scheduling.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--muted-foreground)" }}>
              Creating a school timetable is one of the most complex challenges in educational
              administration. With dozens of teachers, hundreds of students, limited classrooms, and
              countless constraints, it&apos;s a puzzle that would take most coordinators weeks to
              solve manually.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--muted-foreground)" }}>
              EduMyles solves this problem in minutes. Our automatic timetable generation engine
              uses advanced algorithms to create optimal schedules that respect every constraint
              while maximizing efficiency. Here&apos;s how it works and why it&apos;s transforming
              school operations.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)",
                border: "1px solid rgba(26,122,74,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6" style={{ color: "var(--primary)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--foreground)" }}>
                  Timetable Generation Impact
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "2 full days saved per term (16 hours)",
                  "100% conflict-free guarantee",
                  "30% better classroom utilization",
                  "Zero teacher scheduling complaints",
                ].map((impact) => (
                  <li key={impact} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                    <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {impact}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The Manual Problem */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Why Manual Timetabling Fails
            </h2>

            <div className="space-y-6">
              {[
                {
                  title: "Complex Constraint Management",
                  description:
                    "Teachers have availability preferences, subjects require specific rooms, and students need breaks. The human brain can't track all these variables simultaneously.",
                  complexity: "High",
                },
                {
                  title: "Exponential Possibilities",
                  description:
                    "With 30 teachers, 40 classrooms, and 8 periods daily, there are millions of possible combinations. Manual selection can't find the optimal solution.",
                  complexity: "Very High",
                },
                {
                  title: "Change Management",
                  description:
                    "When one teacher gets sick or a classroom becomes unavailable, the entire schedule needs re-evaluation. Manual adjustments create cascading conflicts.",
                  complexity: "Medium",
                },
                {
                  title: "Optimization Blind Spots",
                  description:
                    "Human schedulers focus on avoiding conflicts but miss optimization opportunities like better room utilization or teacher preference matching.",
                  complexity: "Medium",
                },
              ].map((problem) => (
                <div
                  key={problem.title}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        problem.complexity === "Very High"
                          ? "#ef4444"
                          : problem.complexity === "High"
                            ? "#f97316"
                            : "#eab308",
                    }}
                  >
                    <AlertCircle className="w-6 h-6" style={{ color: "#ffffff" }} />
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      {problem.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {problem.description}
                    </p>
                    <span
                      className="text-xs mt-2 inline-block px-2 py-1 rounded-full"
                      style={{
                        background:
                          problem.complexity === "Very High"
                            ? "#fef2f2"
                            : problem.complexity === "High"
                              ? "#fff7ed"
                              : "#fefce8",
                        color:
                          problem.complexity === "Very High"
                            ? "#991b1b"
                            : problem.complexity === "High"
                              ? "#9a3412"
                              : "#854d0e",
                      }}
                    >
                      Complexity: {problem.complexity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The Algorithm Approach */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              The EduMyles Timetable Algorithm
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "Step 1",
                  title: "Constraint Collection & Validation",
                  description:
                    "The system first gathers all constraints: teacher availability, subject requirements, room specifications, student groupings, and school policies. Each constraint is validated for completeness and consistency.",
                  process: "Data Collection → Validation → Constraint Graph Creation",
                  time: "30 seconds",
                },
                {
                  step: "Step 2",
                  title: "Resource Optimization Analysis",
                  description:
                    "Advanced algorithms analyze resource utilization patterns, identifying optimal room assignments, teacher workloads, and time slot distributions based on historical data and best practices.",
                  process: "Pattern Recognition → Resource Mapping → Optimization Scoring",
                  time: "45 seconds",
                },
                {
                  step: "Step 3",
                  title: "Constraint-Based Scheduling",
                  description:
                    "Using a hybrid of constraint satisfaction and optimization algorithms, the system generates thousands of potential schedules, each respecting all hard constraints while maximizing soft constraints.",
                  process: "Constraint Propagation → Solution Generation → Conflict Resolution",
                  time: "2-3 minutes",
                },
                {
                  step: "Step 4",
                  title: "Multi-Objective Optimization",
                  description:
                    "The system evaluates each generated schedule against multiple objectives: teacher satisfaction, room efficiency, student experience, and operational practicality.",
                  process: "Scoring → Ranking → Pareto Optimization",
                  time: "1 minute",
                },
                {
                  step: "Step 5",
                  title: "Human-in-the-Loop Refinement",
                  description:
                    "The top 3 schedules are presented to administrators with detailed analytics. Human preferences and institutional knowledge are applied to select the final schedule.",
                  process: "Presentation → Analytics → Final Selection",
                  time: "5 minutes (human review)",
                },
              ].map((step) => (
                <div key={step.step} className="border-l-4 pl-6" style={{ borderColor: "var(--primary)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-jakarta font-bold text-sm px-3 py-1 rounded-full"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {step.step}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "#D1FAE5", color: "#065f46" }}
                    >
                      {step.time}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: "var(--foreground)" }}>
                    {step.title}
                  </h3>
                  <p
                    className="font-jakarta text-base leading-[1.7] mb-3"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {step.description}
                  </p>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(26,122,74,0.1)" }}>
                    <span className="font-mono text-xs" style={{ color: "var(--primary)" }}>
                      {step.process}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Constraint Types */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Types of Constraints Handled
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  category: "Hard Constraints",
                  description: "Must be satisfied for schedule validity",
                  constraints: [
                    "Teacher availability and subject qualifications",
                    "Classroom capacity and equipment requirements",
                    "Student class enrollment and subject prerequisites",
                    "Legal requirements (break times, maximum teaching hours)",
                    "Subject sequence dependencies",
                  ],
                  priority: "Critical",
                },
                {
                  category: "Soft Constraints",
                  description: "Optimized for better schedules",
                  constraints: [
                    "Teacher preference for time slots",
                    "Classroom proximity for related subjects",
                    "Balanced workload distribution",
                    "Preferred subject clustering",
                    "Minimized student travel between classes",
                  ],
                  priority: "Optimization",
                },
                {
                  category: "Institutional Constraints",
                  description: "School-specific policies and requirements",
                  constraints: [
                    "Department meeting schedules",
                    "Extracurricular activity time blocks",
                    "Religious observance considerations",
                    "Transportation schedule alignment",
                    "Special education requirements",
                  ],
                  priority: "Customizable",
                },
                {
                  category: "Dynamic Constraints",
                  description: "Real-time adjustments and changes",
                  constraints: [
                    "Teacher absence substitutions",
                    "Room maintenance conflicts",
                    "Emergency schedule changes",
                    "Weather-related adjustments",
                    "Special event accommodations",
                  ],
                  priority: "Real-time",
                },
              ].map((category) => (
                <div
                  key={category.category}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="w-5 h-5" style={{ color: "var(--primary)" }} />
                    <h3 className="font-jakarta font-bold text-lg" style={{ color: "var(--foreground)" }}>
                      {category.category}
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(26,122,74,0.1)", color: "var(--primary)" }}
                    >
                      {category.priority}
                    </span>
                  </div>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                    {category.description}
                  </p>
                  <ul className="space-y-1">
                    {category.constraints.map((constraint) => (
                      <li key={constraint} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--primary)" }}
                        />
                        <span style={{ color: "var(--muted-foreground)" }}>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Performance Metrics & Benchmarks
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  metric: "Processing Time",
                  value: "3-5 minutes",
                  description: "From data input to final schedule",
                },
                {
                  metric: "Conflict Rate",
                  value: "0%",
                  description: "Guaranteed conflict-free schedules",
                },
                {
                  metric: "Teacher Satisfaction",
                  value: "94%",
                  description: "Based on preference matching",
                },
                { metric: "Room Utilization", value: "87%", description: "Optimal space usage" },
                {
                  metric: "Schedule Stability",
                  value: "96%",
                  description: "Minimal changes needed",
                },
                {
                  metric: "User Acceptance",
                  value: "98%",
                  description: "Schools continue using automated schedules",
                },
              ].map((stat) => (
                <div
                  key={stat.metric}
                  className="text-center p-6 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)",
                    border: "1px solid rgba(26,122,74,0.2)",
                  }}
                >
                  <div
                    className="font-jakarta font-bold text-2xl mb-2"
                    style={{ color: "var(--primary)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="font-jakarta font-semibold text-sm mb-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    {stat.metric}
                  </div>
                  <div className="font-jakarta text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--platform-chrome) 0%, var(--primary) 100%)",
                color: "#ffffff",
              }}
            >
              <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--accent-foreground)" }}>
                Scale Performance
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-3">
                    Small Schools (200-500 students)
                  </h4>
                  <ul className="space-y-2">
                    {["Processing: 1-2 minutes", "Teachers: 15-30", "Classrooms: 10-20"].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--accent-foreground)" }}
                          />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-3">
                    Large Schools (1000+ students)
                  </h4>
                  <ul className="space-y-2">
                    {["Processing: 3-5 minutes", "Teachers: 50+", "Classrooms: 30+"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--accent-foreground)" }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Guide */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Implementation Guide: From Manual to Automated
            </h2>

            <div className="space-y-6">
              {[
                {
                  phase: "Phase 1: Data Preparation",
                  duration: "1-2 days",
                  tasks: [
                    "Collect teacher availability and qualifications",
                    "Catalog classroom specifications and equipment",
                    "Define subject requirements and student groupings",
                    "Document institutional constraints and preferences",
                  ],
                  outcome: "Complete constraint dataset",
                },
                {
                  phase: "Phase 2: System Configuration",
                  duration: "1 day",
                  tasks: [
                    "Import teacher and classroom data",
                    "Set up subject and class structures",
                    "Configure constraint rules and preferences",
                    "Test constraint validation system",
                  ],
                  outcome: "Ready-to-use timetable engine",
                },
                {
                  phase: "Phase 3: First Generation",
                  duration: "2-3 hours",
                  tasks: [
                    "Run initial timetable generation",
                    "Review generated schedules with stakeholders",
                    "Apply manual adjustments if needed",
                    "Finalize and publish timetable",
                  ],
                  outcome: "First automated timetable",
                },
                {
                  phase: "Phase 4: Optimization & Training",
                  duration: "1 week",
                  tasks: [
                    "Monitor schedule performance",
                    "Gather user feedback for improvement",
                    "Train staff on adjustment tools",
                    "Establish change management procedures",
                  ],
                  outcome: "Fully operational system",
                },
              ].map((phase) => (
                <div
                  key={phase.phase}
                  className="border-l-4 pl-6"
                  style={{ borderColor: "var(--primary)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-jakarta font-bold text-sm px-3 py-1 rounded-full"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {phase.phase}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "#D1FAE5", color: "#065f46" }}
                    >
                      {phase.duration}
                    </span>
                  </div>
                  <h3 className="font-jakarta font-bold text-lg mb-3" style={{ color: "var(--foreground)" }}>
                    {phase.tasks?.[0]?.split(":")[0]?.trim() || ""}
                  </h3>
                  <ul className="space-y-1 mb-3">
                    {phase.tasks.map((task) => (
                      <li key={task} className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                        <span style={{ color: "var(--muted-foreground)" }}>{task}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    Result: {phase.outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Stories */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Success Stories: Timetable Transformation
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Nairobi High School",
                  size: "1,200 students, 45 teachers",
                  challenge: "Manual timetabling took 2 weeks each term with frequent conflicts.",
                  solution: "Implemented EduMyles automatic timetable generation.",
                  results:
                    "Timetable created in 4 minutes, 100% conflict-free, teacher satisfaction 96%.",
                },
                {
                  school: "Mombasa Girls Academy",
                  size: "800 students, 32 teachers",
                  challenge: "Complex subject combinations and limited classroom space.",
                  solution: "Used constraint optimization for better room utilization.",
                  results: "30% improvement in classroom efficiency, eliminated double-bookings.",
                },
                {
                  school: "Kisumu International",
                  size: "600 students, 28 teachers",
                  challenge: "Frequent teacher absences requiring daily schedule adjustments.",
                  solution: "Automated substitution system with real-time rescheduling.",
                  results: "Substitution time reduced from 2 hours to 15 minutes daily.",
                },
              ].map((story) => (
                <div
                  key={story.school}
                  className="p-6 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3
                        className="font-jakarta font-bold text-lg mb-1"
                        style={{ color: "var(--foreground)" }}
                      >
                        {story.school}
                      </h3>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {story.size}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "#D1FAE5", color: "#065f46" }}
                      >
                        Success Story
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#ef4444" }}>
                        Challenge:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.challenge}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                        Solution:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.solution}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--accent-foreground)" }}>
                        Results:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.results}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future Enhancements */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Future of Timetable Generation
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  feature: "AI-Powered Predictive Scheduling",
                  description:
                    "Machine learning models that predict optimal schedules based on historical performance and emerging patterns.",
                  timeline: "Q2 2026",
                },
                {
                  feature: "Real-Time Dynamic Rescheduling",
                  description:
                    "Instant automatic adjustments when teachers call in sick or rooms become unavailable.",
                  timeline: "Q3 2026",
                },
                {
                  feature: "Student Preference Integration",
                  description:
                    "Consider student learning preferences and energy patterns for optimal subject timing.",
                  timeline: "Q4 2026",
                },
                {
                  feature: "Cross-School Resource Sharing",
                  description:
                    "Enable resource sharing between schools for optimal community-wide utilization.",
                  timeline: "Q1 2027",
                },
              ].map((feature) => (
                <div
                  key={feature.feature}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3
                    className="font-jakarta font-bold text-base mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {feature.feature}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                    {feature.description}
                  </p>
                  <div
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "rgba(26,122,74,0.1)", color: "var(--primary)" }}
                  >
                    🚀 {feature.timeline}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--foreground)" }}>
              Ready to Save 2 Days Every Term?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--muted-foreground)" }}>
              Join 200+ schools using automated timetable generation to create perfect schedules in
              minutes.
            </p>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Schedule Timetable Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
