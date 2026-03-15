const steps = [
  {
    number: "01",
    title: "Book a Free Demo",
    description:
      "Pick a 30-minute slot on our calendar. No commitment — just a conversation with a school-tech expert who understands your context.",
    icon: "📅",
  },
  {
    number: "02",
    title: "We Customise for You",
    description:
      "Our team sets up a personalised demo using your school's real context and size — not a generic walkthrough.",
    icon: "⚙️",
  },
  {
    number: "03",
    title: "Go Live in 7 Days",
    description:
      "Once you sign up, your school is fully onboarded within one week. We train your staff and migrate your data at no extra cost.",
    icon: "🚀",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-white" aria-label="How it works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-inter font-semibold text-gold uppercase tracking-widest text-sm mb-3">
            Getting Started
          </p>
          <h2 className="font-jakarta font-bold text-4xl lg:text-5xl text-navy mb-4">
            From demo to fully live in 7 days
          </h2>
          <p className="font-inter text-lg text-mid-grey max-w-2xl mx-auto">
            We handle the setup so your team can focus on what matters — running a great school.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gold/30" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Step number circle */}
              <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center mx-auto mb-6 shadow-navy-glow">
                <span className="font-jakarta font-bold text-gold text-xl">{step.number}</span>
              </div>
              <div className="text-3xl mb-4">{step.icon}</div>
              <h3 className="font-jakarta font-semibold text-xl text-navy mb-3">{step.title}</h3>
              <p className="font-inter text-base text-mid-grey leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#demo"
            className="bg-gold hover:bg-gold-dark text-white font-inter font-semibold px-8 py-3.5 rounded-lg transition-all hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] shadow-md inline-block"
          >
            Book Your Free Demo Today
          </a>
        </div>
      </div>
    </section>
  );
}
