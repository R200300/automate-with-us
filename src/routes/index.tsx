import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, PhoneCall, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BenefitList,
  FaqSection,
  FeatureGrid,
  FinalCta,
  ProcessSteps,
  Section,
  SectionHeading,
  StatGrid,
  Testimonials,
  TrustBadges,
} from "@/components/sections";
import {
  faqs,
  industries,
  pricingPlans,
  processSteps,
  services,
  stats,
  testimonials,
  trustBadges,
  whyUs,
} from "@/data/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Automation Agency for Small Business | Nexora Automation" },
      {
        name: "description",
        content:
          "Nexora Automation builds AI voice agents, chatbots, and workflow automation that save SMBs 18+ hours a week. Book a free discovery call today.",
      },
      { property: "og:title", content: "AI Automation Agency for Small Business | Nexora Automation" },
      {
        property: "og:description",
        content:
          "AI voice agents, chatbots, and automation that answer every call and capture every lead. Free discovery call.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* 1. Hero */}
      <section className="hero-glow relative overflow-hidden border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:py-28 lg:px-8">
          <div className="animate-fade-up mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="size-3.5" /> AI Automation Agency for Growing Businesses
            </span>
            <h1 className="mt-5 text-4xl font-bold text-balance sm:text-5xl lg:text-6xl">
              Let AI Handle the Busy Work.{" "}
              <span className="text-gradient-brand">You Focus on Growth.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              We build AI voice agents, chatbots, and automations that answer every call, reply in
              seconds, and book more appointments — so your team stops drowning in repetitive tasks.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
                <Link to="/book">
                  Book a Free Consultation <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
                <Link to="/services">Explore Our Services</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-accent" /> Live in 2–4 weeks
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> Your data stays yours
              </span>
            </div>
          </div>

          <div className="mt-16">
            <StatGrid stats={stats} />
          </div>
        </div>
      </section>

      {/* 2. Trusted by Businesses */}
      <Section muted className="py-12 sm:py-14">
        <p className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Trusted by 120+ businesses across the USA, Canada, UK & Australia
        </p>
        <div className="mt-8">
          <TrustBadges items={trustBadges} />
        </div>
      </Section>

      {/* 3. Our Services */}
      <Section>
        <SectionHeading
          eyebrow="Our Services"
          title="Ten ways we take work off your plate"
          subtitle="Pick one to start, or let us build a full AI system across your sales, support, and back office."
        />
        <div className="mt-12">
          <FeatureGrid
            items={services.map((s) => ({
              icon: s.icon,
              title: s.title,
              description: s.description,
            }))}
          />
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/services">
              See all services <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* 4. Why Choose Nexora */}
      <Section muted>
        <SectionHeading
          eyebrow="Why Nexora"
          title="Why growing businesses choose Nexora Automation"
          subtitle="We are not a software vendor. We are the team that studies your process, builds the system, and stays with you after launch."
        />
        <div className="mt-12">
          <FeatureGrid items={whyUs} />
        </div>
        <div className="surface-card mt-10 p-8">
          <h3 className="text-lg font-semibold">What you get on day one</h3>
          <div className="mt-6">
            <BenefitList
              items={[
                "Every call, chat, and message answered in seconds",
                "More qualified leads without more ad spend",
                "Fewer no-shows and a fuller calendar",
                "Support costs down, satisfaction up",
                "Clean CRM data with zero manual entry",
                "Hours back every week for your best people",
              ]}
            />
          </div>
        </div>
      </Section>

      {/* 5. Industries We Serve */}
      <Section>
        <SectionHeading
          eyebrow="Industries"
          title="Built for the industries we know best"
          subtitle="We have shipped automations in these industries, so we start with proven playbooks instead of guesswork."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {industries.slice(0, 8).map((ind) => (
            <div key={ind.name} className="surface-card p-6 transition-transform hover:-translate-y-1">
              <h3 className="text-base font-semibold">{ind.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/industries">View industry playbooks</Link>
          </Button>
        </div>
      </Section>

      {/* 6. How We Work */}
      <Section muted>
        <SectionHeading
          eyebrow="How We Work"
          title="A simple four-step process"
          subtitle="Clear steps, weekly updates, and no technical homework for you."
        />
        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
      </Section>

      {/* 7. AI Solutions Showcase */}
      <Section>
        <SectionHeading
          eyebrow="Solutions Showcase"
          title="See what your AI team could look like"
          subtitle="Real examples of the systems we deploy for small and medium businesses."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-8">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
              <PhoneCall className="size-5" />
            </span>
            <h3 className="mt-4 text-xl font-semibold">AI Receptionist</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Answers on the first ring, greets the caller by name when known, asks the right
              qualifying questions, and books the appointment directly into your calendar.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { who: "Caller", text: "Hi, do you handle emergency leaks on weekends?" },
                {
                  who: "Nexora AI",
                  text: "Yes, we do. I can get a technician to you today. What's your postcode?",
                },
                { who: "Caller", text: "It's SW1A 2AA." },
                {
                  who: "Nexora AI",
                  text: "Great — I have a 4:30pm slot. Shall I lock it in and text you the confirmation?",
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.who === "Nexora AI"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">{m.who}</p>
                  <p className="mt-0.5 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {[
              {
                title: "Lead Engine",
                body: "Finds ideal prospects, personalises the outreach, follows up five times, and drops warm replies into your inbox.",
                metric: "+42% qualified leads",
              },
              {
                title: "Support Desk AI",
                body: "Answers order, billing, and how-to questions instantly and escalates anything complex with full context.",
                metric: "70% tickets auto-resolved",
              },
              {
                title: "Booking Assistant",
                body: "Handles scheduling, reminders, rescheduling, and waitlists across WhatsApp, SMS, and email.",
                metric: "-33% no-shows",
              },
            ].map((card) => (
              <div key={card.title} className="surface-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                    {card.metric}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 8. Testimonials */}
      <Section muted>
        <SectionHeading
          eyebrow="Client Testimonials"
          title="Results our clients can measure"
          subtitle="Owners and operators tell it best."
        />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(0, 6)} />
        </div>
      </Section>

      {/* 9. Pricing Preview */}
      <Section>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, fixed quotes"
          subtitle="No hourly surprises. You get a clear price after your free discovery call."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`surface-card flex flex-col p-8 ${
                plan.featured ? "ring-2 ring-primary shadow-elevated lg:-translate-y-2" : ""
              }`}
            >
              {plan.featured && (
                <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-3 font-display text-3xl font-bold">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.cadence}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.featured ? "default" : "outline"}
                className="mt-7 w-full rounded-full"
              >
                <Link to="/book">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* 10. FAQ */}
      <Section muted>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions business owners ask us"
          subtitle="Still unsure? Ask us anything on your free call."
        />
        <FaqSection items={faqs} />
      </Section>

      {/* 11. Final CTA */}
      <FinalCta />
    </>
  );
}
