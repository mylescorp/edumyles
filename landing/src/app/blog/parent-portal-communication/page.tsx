import type { Metadata } from "next";
import Link from "next/link";
import { Users, CheckCircle2, ArrowRight, TrendingUp, MessageSquare, Smartphone, Clock, Shield, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "How EduMyles Parent Portal Reduces SMS Costs by 60% While Improving Communication",
  description: "Schools using the parent portal see fewer WhatsApp enquiries, faster fee payments, and more engaged parents. Discover the communication revolution in Kenyan schools.",
};

export default function ParentPortalGuide() {
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
              Parent Portal Reduces SMS Costs{" "}
              <span style={{ color: "#E8A020" }}>by 60%</span>
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>Parent Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>4 min read</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>January 2026</span>
              </div>
            </div>
            
            <p 
              className="font-jakarta text-lg leading-[1.7]"
              style={{ color: "#A8E6C3" }}
            >
              Schools using the parent portal see fewer WhatsApp enquiries, faster fee payments, 
              and more engaged parents. Discover the communication revolution in Kenyan schools.
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
              Every school administrator knows the pain: endless phone calls from parents asking 
              about grades, fees, and attendance. WhatsApp groups filled with repetitive questions. 
              SMS bills that keep climbing while communication efficiency keeps dropping.
            </p>
            
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              What if you could transform this chaos into streamlined, self-service communication 
              that actually saves money while improving parent satisfaction? That&apos;s exactly what 
              the EduMyles Parent Portal delivers.
            </p>

            <div 
              className="p-6 rounded-2xl mb-8"
              style={{ background: "linear-gradient(135deg, #F3FBF6 0%, #E8F5EE 100%)", border: "1px solid rgba(26,122,74,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                <h3 className="font-playfair font-bold text-xl" style={{ color: "#061A12" }}>
                  Communication Transformation Results
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-2" style={{ color: "#061A12" }}>
                    Cost Savings
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "60% reduction in SMS costs",
                      "40% fewer phone calls to office",
                      "75% less time on parent inquiries",
                      "50% reduction in printing costs"
                    ].map((saving) => (
                      <li key={saving} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#374151" }}>{saving}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-jakarta font-semibold text-base mb-2" style={{ color: "#061A12" }}>
                    Engagement Benefits
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "96% parent portal adoption",
                      "85% increase in fee payment speed",
                      "90% reduction in grade inquiries",
                      "4x higher parent satisfaction"
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#374151" }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* The Communication Problem */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              The Traditional Communication Problem
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#ef4444" }}>
                  Before Parent Portal
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: Phone,
                      title: "Constant Phone Calls",
                      description: "Office staff spend 3-4 hours daily answering parent calls about grades, fees, and attendance."
                    },
                    {
                      icon: MessageSquare,
                      title: "WhatsApp Chaos",
                      description: "Multiple WhatsApp groups with mixed conversations, important messages get lost."
                    },
                    {
                      icon: Mail,
                      title: "Expensive SMS",
                      description: "Bulk SMS for every notification costs KES 50,000+ monthly with declining engagement."
                    },
                    {
                      icon: Clock,
                      title: "Delayed Information",
                      description: "Parents wait days for information that should be instantly available."
                    }
                  ].map((problem) => (
                    <div key={problem.title} className="flex gap-4 p-4 rounded-xl" style={{ background: "#FEE2E2", border: "1px solid #fecaca" }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ef4444" }}>
                        <problem.icon className="w-5 h-5" style={{ color: "#ffffff" }} />
                      </div>
                      <div>
                        <h4 className="font-jakarta font-semibold text-base mb-1" style={{ color: "#991b1b" }}>
                          {problem.title}
                        </h4>
                        <p className="font-jakarta text-sm" style={{ color: "#7f1d1d" }}>
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#1A7A4A" }}>
                  After Parent Portal
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: Smartphone,
                      title: "Self-Service Access",
                      description: "Parents access grades, fees, and attendance 24/7 without calling the school."
                    },
                    {
                      icon: Shield,
                      title: "Secure Messaging",
                      description: "Direct messaging to teachers with automated routing and response tracking."
                    },
                    {
                      icon: TrendingUp,
                      title: "Smart Notifications",
                      description: "Push notifications only for important updates, reducing notification fatigue."
                    },
                    {
                      icon: Users,
                      title: "Real-Time Updates",
                      description: "Instant access to current information, no more waiting for report cards."
                    }
                  ].map((solution) => (
                    <div key={solution.title} className="flex gap-4 p-4 rounded-xl" style={{ background: "#D1FAE5", border: "1px solid #a7f3d0" }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1A7A4A" }}>
                        <solution.icon className="w-5 h-5" style={{ color: "#ffffff" }} />
                      </div>
                      <div>
                        <h4 className="font-jakarta font-semibold text-base mb-1" style={{ color: "#064e3b" }}>
                          {solution.title}
                        </h4>
                        <p className="font-jakarta text-sm" style={{ color: "#065f46" }}>
                          {solution.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Parent Portal Features That Drive Results
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Real-Time Grade Access",
                  description: "Parents see grades as soon as teachers post them, with detailed breakdown by subject and competency.",
                  benefit: "Eliminates grade inquiry calls",
                  adoption: "98%"
                },
                {
                  title: "Fee Payment Dashboard",
                  description: "Clear view of outstanding fees, payment history, and instant M-Pesa payment options.",
                  benefit: "Accelerates fee collection by 85%",
                  adoption: "96%"
                },
                {
                  title: "Attendance Tracking",
                  description: "Daily attendance records with absence alerts and monthly attendance summaries.",
                  benefit: "Reduces attendance-related calls by 90%",
                  adoption: "94%"
                },
                {
                  title: "Direct Teacher Messaging",
                  description: "Secure messaging to specific teachers with read receipts and response tracking.",
                  benefit: "Improves parent-teacher communication",
                  adoption: "89%"
                },
                {
                  title: "Assignment Calendar",
                  description: "View upcoming assignments, deadlines, and project requirements with submission tracking.",
                  benefit: "Increases assignment completion rates",
                  adoption: "92%"
                },
                {
                  title: "Digital Report Cards",
                  description: "Instant access to current and historical report cards with downloadable PDF versions.",
                  benefit: "Eliminates report card distribution costs",
                  adoption: "97%"
                }
              ].map((feature) => (
                <div key={feature.title} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {feature.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {feature.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: "#1A7A4A" }}>{feature.benefit}</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}>
                      {feature.adoption} adoption
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              The Financial Impact: Communication Costs Before vs After
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl" style={{ background: "#FEE2E2", border: "1px solid #fecaca" }}>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#991b1b" }}>
                  Monthly Communication Costs (Before Parent Portal)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { item: "Bulk SMS (10,000 messages)", cost: "KES 50,000" },
                    { item: "Phone call overhead (staff time)", cost: "KES 40,000" },
                    { item: "Printing report cards", cost: "KES 25,000" },
                    { item: "WhatsApp business API", cost: "KES 15,000" },
                    { item: "Staff overtime for inquiries", cost: "KES 30,000" }
                  ].map((item) => (
                    <div key={item.item} className="flex justify-between items-center p-3 rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                      <span className="font-jakarta text-sm" style={{ color: "#7f1d1d" }}>{item.item}</span>
                      <span className="font-jakarta font-bold" style={{ color: "#991b1b" }}>{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#fecaca" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-jakarta font-bold text-lg" style={{ color: "#991b1b" }}>Total Monthly Cost</span>
                    <span className="font-jakarta font-bold text-xl" style={{ color: "#991b1b" }}>KES 160,000</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: "#D1FAE5", border: "1px solid #a7f3d0" }}>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#064e3b" }}>
                  Monthly Communication Costs (With Parent Portal)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { item: "Targeted SMS (urgent only)", cost: "KES 20,000" },
                    { item: "Phone call overhead", cost: "KES 8,000" },
                    { item: "Digital report cards", cost: "KES 0" },
                    { item: "Platform messaging", cost: "KES 5,000" },
                    { item: "Staff overtime", cost: "KES 5,000" }
                  ].map((item) => (
                    <div key={item.item} className="flex justify-between items-center p-3 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #a7f3d0" }}>
                      <span className="font-jakarta text-sm" style={{ color: "#065f46" }}>{item.item}</span>
                      <span className="font-jakarta font-bold" style={{ color: "#064e3b" }}>{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "#a7f3d0" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-jakarta font-bold text-lg" style={{ color: "#064e3b" }}>Total Monthly Cost</span>
                    <span className="font-jakarta font-bold text-xl" style={{ color: "#064e3b" }}>KES 38,000</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-jakarta font-bold text-sm" style={{ color: "#065f46" }}>Monthly Savings: KES 122,000 (76% reduction)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Strategy */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Achieving 96% Parent Portal Adoption
            </h2>

            <div className="space-y-6">
              {[
                {
                  phase: "Phase 1: Preparation (Week 1)",
                  activities: [
                    "Collect parent contact information",
                    "Create parent awareness campaign",
                    "Prepare training materials",
                    "Set up parent accounts"
                  ],
                  success: "100% account creation"
                },
                {
                  phase: "Phase 2: Launch (Week 2)",
                  activities: [
                    "Send login credentials via SMS",
                    "Host parent training sessions",
                    "Provide video tutorials",
                    "Offer one-on-one support"
                  ],
                  success: "85% initial login rate"
                },
                {
                  phase: "Phase 3: Engagement (Week 3-4)",
                  activities: [
                    "Share student progress updates",
                    "Send fee reminders via portal",
                    "Enable teacher messaging",
                    "Track usage analytics"
                  ],
                  success: "92% active users"
                },
                {
                  phase: "Phase 4: Optimization (Week 5-6)",
                  activities: [
                    "Gather parent feedback",
                    "Address technical issues",
                    "Share success stories",
                    "Recognize active parents"
                  ],
                  success: "96% sustained adoption"
                }
              ].map((phase) => (
                <div key={phase.phase} className="border-l-4 pl-6" style={{ borderColor: "#E8A020" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-jakarta font-bold text-sm px-3 py-1 rounded-full" style={{ background: "#E8A020", color: "#061A12" }}>
                      {phase.phase}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#D1FAE5", color: "#065f46" }}>
                      {phase.success}
                    </span>
                  </div>
                  <h3 className="font-jakarta font-bold text-lg mb-3" style={{ color: "#061A12" }}>
                    {phase.activities?.[0]?.split('(')?.[0]?.trim() || ""}
                  </h3>
                  <ul className="space-y-1">
                    {phase.activities.map((activity) => (
                      <li key={activity} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                        <span style={{ color: "#5a5a5a" }}>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Success Stories */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Success Stories: Communication Transformation
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Nairobi Academy Primary",
                  students: "800 students",
                  challenge: "Receiving 50+ parent calls daily about grades and fees.",
                  solution: "Implemented parent portal with automated notifications.",
                  results: "Reduced calls by 90%, saved KES 80,000 monthly in communication costs."
                },
                {
                  school: "Mombasa Girls Secondary",
                  students: "1,200 students",
                  challenge: "Parents demanding instant grade updates during exam periods.",
                  solution: "Real-time grade access with mobile notifications.",
                  results: "98% parent satisfaction, 40% faster fee collection."
                },
                {
                  school: "Kisumu International School",
                  students: "600 students",
                  challenge: "Multiple WhatsApp groups causing communication chaos.",
                  solution: "Structured parent portal with direct teacher messaging.",
                  results: "Eliminated WhatsApp groups, improved response time by 75%."
                }
              ].map((story) => (
                <div key={story.school} className="p-6 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-jakarta font-bold text-lg mb-1" style={{ color: "#061A12" }}>
                        {story.school}
                      </h3>
                      <span className="text-sm" style={{ color: "#5a5a5a" }}>{story.students}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#D1FAE5", color: "#065f46" }}>
                        Success Story
                      </span>
                    </div>
                  </div>
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

          {/* Best Practices */}
          <div className="mb-12">
            <h2 className="font-playfair font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Best Practices for Parent Portal Success
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Start with High-Value Features",
                  description: "Begin with grades and fees - the features parents want most.",
                  tip: "Show immediate value to drive adoption."
                },
                {
                  title: "Provide Multiple Training Options",
                  description: "Offer in-person training, video tutorials, and written guides.",
                  tip: "Cater to different parent tech comfort levels."
                },
                {
                  title: "Celebrate Early Adopters",
                  description: "Recognize and reward parents who use the portal actively.",
                  tip: "Create positive peer pressure for adoption."
                },
                {
                  title: "Measure and Share Results",
                  description: "Track usage metrics and share success stories with parents.",
                  tip: "Demonstrate the benefits to encourage continued use."
                },
                {
                  title: "Maintain Personal Touch",
                  description: "Use portal for routine tasks, keep phone for urgent matters.",
                  tip: "Balance automation with personal connection."
                },
                {
                  title: "Continuous Improvement",
                  description: "Gather feedback regularly and implement requested features.",
                  tip: "Show parents that their input matters."
                }
              ].map((practice) => (
                <div key={practice.title} className="p-5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}>
                  <h3 className="font-jakarta font-bold text-base mb-2" style={{ color: "#061A12" }}>
                    {practice.title}
                  </h3>
                  <p className="font-jakarta text-sm mb-2" style={{ color: "#5a5a5a" }}>
                    {practice.description}
                  </p>
                  <div className="text-xs p-2 rounded" style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}>
                    💡 {practice.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-playfair font-bold text-2xl mb-4" style={{ color: "#061A12" }}>
              Ready to Transform Parent Communication?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "#5a5a5a" }}>
              Join 500+ schools saving KES 122,000+ monthly with the EduMyles Parent Portal.
            </p>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
              style={{ background: "#E8A020", color: "#061A12" }}
            >
              Schedule Parent Portal Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
