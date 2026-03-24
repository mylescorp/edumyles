import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, ArrowRight, Award, FileText, Users, TrendingUp, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "CBC Gradebook in EduMyles: A Complete Guide for Kenyan Schools",
  description: "Everything you need to know about setting up competency-based assessment, learning areas, and strand reports. Complete CBC implementation guide for Kenyan schools.",
};

export default function CBCGradingGuide() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 50%, #1A7A4A 100%)",
          padding: "6rem 2rem 4rem"
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(232,160,32,0.3) 0%, transparent 50%), 
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            width: "100%",
            height: "100%"
          }} />
        </div>
        
        <div className="relative max-w-[800px] mx-auto">
          <div className="mb-6">
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)", color: "#A8E6C3" }}
            >
              ← Back to Blog
            </Link>
          </div>
          
          <div className="max-w-[800px]">
            <h1 
              className="font-playfair font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "#ffffff" }}
            >
              CBC Gradebook in EduMyles:{" "}
              <span style={{ color: "#E8A020" }}>Complete Guide</span>
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>CBC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>9 min read</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>February 2026</span>
              </div>
            </div>
            
            <p 
              className="font-jakarta text-lg leading-[1.7]"
              style={{ color: "#A8E6C3" }}
            >
              Everything you need to know about setting up competency-based assessment, 
              learning areas, and strand reports. Master CBC implementation with EduMyles.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              The Competency-Based Curriculum (CBC) has transformed how Kenyan schools assess 
              student learning. But tracking competencies, strands, and learning outcomes across 
              multiple subjects can be overwhelming without the right tools.
            </p>
            
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              EduMyles was built specifically for CBC implementation. Our gradebook handles everything 
              from PP1 to Grade 8, automatically organizes assessments by strands, and generates 
              KNEC-compliant report cards. This guide shows you how to leverage every feature.
            </p>

            <div 
              className="p-6 rounded-2xl mb-8"
              style={{ background: "linear-gradient(135deg, #FEF3DC 0%, #FFF8E7 100%)", border: "1px solid rgba(232,160,32,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6" style={{ color: "#E8A020" }} />
                <h3 className="font-playfair font-bold text-xl" style={{ color: "#061A12" }}>
                  CBC Compliance Features
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "KNEC-compliant report card formats",
                  "Automatic strand and sub-strand organization",
                  "Competency tracking across learning areas",
                  "Portfolio evidence management",
                  "Parent-friendly progress reports"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#E8A020" }} />
                    <span className="font-jakarta text-sm" style={{ color: "#374151" }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Understanding CBC Structure */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Understanding CBC Structure in EduMyles
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Learning Areas",
                  description: "Broad subjects like Mathematics, English, Kiswahili, Science, etc.",
                  examples: ["Mathematics", "English", "Science", "Social Studies"]
                },
                {
                  title: "Strands", 
                  description: "Sub-divisions within learning areas focusing on specific themes.",
                  examples: ["Numbers", "Geometry", "Measurement", "Data Handling"]
                },
                {
                  title: "Sub-strands",
                  description: "Specific topics or skills within each strand.",
                  examples: ["Counting", "Addition", "Patterns", "Problem Solving"]
                }
              ].map((level) => (
                <div key={level.title} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {level.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {level.description}
                  </p>
                  <div className="space-y-1">
                    {level.examples.map((example) => (
                      <div key={example} className="text-xs px-2 py-1 rounded" style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}>
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
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Setting Up Your CBC Gradebook
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "Step 1",
                  title: "Configure Learning Areas",
                  content: "Navigate to Academics > Gradebook > Learning Areas. Add all CBC learning areas for each grade level. EduMyles comes pre-loaded with standard CBC learning areas, but you can customize them.",
                  tips: [
                    "Import from Ministry templates",
                    "Add custom learning areas for special programs",
                    "Set weight distributions per learning area"
                  ]
                },
                {
                  step: "Step 2",
                  title: "Set Up Strands and Sub-strands",
                  content: "For each learning area, define the strands and sub-strands. EduMyles automatically organizes these hierarchically, making it easy to assign assessments to the correct level.",
                  tips: [
                    "Use KNEC strand definitions",
                    "Add school-specific sub-strands",
                    "Enable strand weight customization"
                  ]
                },
                {
                  step: "Step 3",
                  title: "Create Assessment Templates",
                  content: "Design assessment templates for different types: formative, summative, practical, and portfolio. Each template can have custom rubrics and scoring criteria.",
                  tips: [
                    "Build rubric libraries",
                    "Set automatic competency mapping",
                    "Enable peer assessment options"
                  ]
                },
                {
                  step: "Step 4",
                  title: "Configure Competency Tracking",
                  content: "Set up competency descriptors for each grade level. EduMyles will automatically track student progress against these competencies across all assessments.",
                  tips: [
                    "Use Ministry competency descriptors",
                    "Add school-specific competencies",
                    "Enable competency visualization"
                  ]
                },
                {
                  step: "Step 5",
                  title: "Test with Sample Data",
                  content: "Before going live, test the system with sample student data and assessments. Verify that report cards generate correctly and all calculations are accurate.",
                  tips: [
                    "Test all grade levels",
                    "Verify report card formats",
                    "Check parent portal display"
                  ]
                }
              ].map((step) => (
                <div key={step.step} className="border-l-4 pl-6" style={{ borderColor: "#E8A020" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-jakarta font-bold text-sm px-3 py-1 rounded-full" style={{ background: "#E8A020", color: "#061A12" }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-playfair font-bold text-xl mb-3" style={{ color: "#061A12" }}>
                    {step.title}
                  </h3>
                  <p className="font-jakarta text-base leading-[1.7] mb-4" style={{ color: "#374151" }}>
                    {step.content}
                  </p>
                  <div className="space-y-2">
                    {step.tips.map((tip) => (
                      <div key={tip} className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#5a5a5a" }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Types */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              CBC Assessment Types in EduMyles
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  type: "Formative Assessment",
                  description: "Ongoing assessments during learning to monitor progress and provide feedback.",
                  frequency: "Weekly/Bi-weekly",
                  weight: "20-30%",
                  examples: ["Class exercises", "Quizzes", "Observations", "Learning activities"]
                },
                {
                  type: "Summative Assessment",
                  description: "End-of-unit or end-of-term assessments to evaluate cumulative learning.",
                  frequency: "End of term",
                  weight: "40-50%",
                  examples: ["End-of-term tests", "Projects", "Presentations", "Practical exams"]
                },
                {
                  type: "Portfolio Assessment",
                  description: "Collection of student work demonstrating growth and achievement over time.",
                  frequency: "Continuous",
                  weight: "20-30%",
                  examples: ["Artwork", "Writing samples", "Science projects", "Performance recordings"]
                },
                {
                  type: "Peer and Self Assessment",
                  description: "Students evaluate their own work and that of peers using clear criteria.",
                  frequency: "Regular",
                  weight: "5-10%",
                  examples: ["Self-reflection", "Peer review", "Group evaluation", "Goal setting"]
                }
              ].map((assessment) => (
                <div key={assessment.type} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {assessment.type}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {assessment.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#5a5a5a" }}>Frequency:</span>
                      <span className="font-semibold" style={{ color: "#1A7A4A" }}>{assessment.frequency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#5a5a5a" }}>Weight:</span>
                      <span className="font-semibold" style={{ color: "#1A7A4A" }}>{assessment.weight}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "#e5e7eb" }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: "#061A12" }}>Examples:</div>
                    <div className="flex flex-wrap gap-1">
                      {assessment.examples.map((example) => (
                        <span key={example} className="text-xs px-2 py-1 rounded" style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}>
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
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Generating KNEC-Compliant Report Cards
            </h2>

            <div className="p-6 rounded-2xl mb-6" style={{ background: "linear-gradient(135deg, #F3FBF6 0%, #E8F5EE 100%)", border: "1px solid rgba(26,122,74,0.2)" }}>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                <h3 className="font-playfair font-bold text-xl" style={{ color: "#061A12" }}>
                  Report Card Features
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-3" style={{ color: "#061A12" }}>
                    Academic Performance
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Learning area scores",
                      "Strand performance breakdown",
                      "Competency achievement levels",
                      "Teacher comments per learning area"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#374151" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-3" style={{ color: "#061A12" }}>
                    Holistic Development
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Values and attitudes",
                      "Social skills development",
                      "Learning behaviors",
                      "Attendance and punctuality"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#374151" }}>{item}</span>
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
                  description: "EduMyles automatically calculates competency levels (Exceeds Expectations, Meets Expectations, Approaching Expectations, Below Expectations) based on assessment scores."
                },
                {
                  title: "Parent-Friendly Format",
                  description: "Report cards are designed to be easily understood by parents, with clear visual indicators and progress tracking."
                },
                {
                  title: "Digital Signatures",
                  description: "Digital signatures from head teachers and class teachers can be added automatically for authenticity."
                }
              ].map((feature) => (
                <div key={feature.title} className="flex gap-4 p-4 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
                    <TrendingUp className="w-5 h-5" style={{ color: "#1A7A4A" }} />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-semibold text-base mb-1" style={{ color: "#061A12" }}>
                      {feature.title}
                    </h3>
                    <p className="font-jakarta text-sm" style={{ color: "#5a5a5a" }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Portal Integration */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Parent Portal Integration
            </h2>

            <div 
              className="p-8 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 100%)", color: "#ffffff" }}
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-playfair font-bold text-xl mb-4" style={{ color: "#E8A020" }}>
                    What Parents See
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Real-time grade updates",
                      "Competency progress visualization",
                      "Teacher comments and feedback",
                      "Attendance records",
                      "Portfolio evidence",
                      "Learning resources"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#E8A020" }} />
                        <span className="font-jakarta text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-playfair font-bold text-xl mb-4" style={{ color: "#E8A020" }}>
                    Benefits for Schools
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Reduced parent inquiries",
                      "Increased parent engagement",
                      "Transparent communication",
                      "Fewer printed report cards",
                      "Improved accountability",
                      "Better student outcomes"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#E8A020" }} />
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
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Success Stories: CBC Implementation
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Nairobi Primary School",
                  challenge: "Manual CBC tracking was taking 15 hours per week per teacher.",
                  solution: "Implemented EduMyles CBC gradebook with automated competency tracking.",
                  results: "Reduced admin time by 80%, improved parent satisfaction to 96%."
                },
                {
                  school: "Mombasa Academy",
                  challenge: "Parents didn't understand CBC progress reports.",
                  solution: "Used EduMyles parent portal with visual progress indicators.",
                  results: "Parent-teacher meeting attendance increased by 40%."
                },
                {
                  school: "Kisumu Girls Boarding",
                  challenge: "Struggling with portfolio evidence management.",
                  solution: "Digital portfolio system with automatic organization.",
                  results: "Portfolio completion rate improved from 60% to 95%."
                }
              ].map((story) => (
                <div key={story.school} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {story.school}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#ef4444" }}>Challenge:</span>
                      <span className="text-sm ml-2" style={{ color: "#5a5a5a" }}>{story.challenge}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#1A7A4A" }}>Solution:</span>
                      <span className="text-sm ml-2" style={{ color: "#5a5a5a" }}>{story.solution}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#E8A020" }}>Results:</span>
                      <span className="text-sm ml-2" style={{ color: "#5a5a5a" }}>{story.results}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-playfair font-bold text-2xl mb-4" style={{ color: "#061A12" }}>
              Ready to Master CBC Implementation?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "#5a5a5a" }}>
              Join 300+ Kenyan schools using EduMyles for seamless CBC gradebook management.
            </p>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
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
