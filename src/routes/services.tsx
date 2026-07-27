import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FaqSection,
  FinalCta,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  StatGrid,
  Testimonials,
  TrustBadges,
} from "@/components/sections";
import { processSteps, services, stats, testimonials, trustBadges } from "@/data/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "AI Automation Services | Voice Agents, Chatbots & Workflows" },
      {
        name: "description",
        content:
          "Explore Nexora Automation services: AI voice agents, chatbots, support and lead automation, WhatsApp, CRM, email, and custom AI builds for SMBs.",
      },
      { property: "og:title", content: "AI Automation Services | Nexora Automation" },
      {
        property: "og:description",
        content:
          "Ten AI automation services that answer calls, capture leads, and remove repetitive work from your team.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

const serviceFaqs = [
  {
    q: "Can I start with just one service?",
    a: "Yes. Most clients start with a single automation that solves their biggest headache, then add more once they see the results.",
  },
  {
    q: "Do you replace my current tools?",
    a: "No. We connect to what you already use — your CRM, calendar, inbox, and phone system — so nothing needs to be thrown away.",
  },
  {
    q: "Can the AI speak other languages?",
    a: "Yes. Our voice and chat agents can handle multiple languages, which is helpful for multi-region teams.",
  },
  {
    q: "Who manages the automation after launch?",
    a: "We do. Every plan includes monitoring, tuning, and support so your system keeps improving month after month.",
  },
];

function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            AI services that do the <span className="text-gradient-brand">repetitive work</span> for you
          </>
        }
        subtitle="From answering calls to closing the loop in your CRM, we build the AI systems that quietly run your business in the background."
        secondaryCta={{ to: "/pricing", label: "View Pricing" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="What we build"
          title="Ten proven AI automation services"
          subtitle="Each one is customised to your business, tested with real conversations, and supported after launch."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.slug}
                className="surface-card flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                <ul className="mt-5 space-y-2 border-t border-border pt-4">
                  {s.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Benefits"
          title="The business results behind the tech"
          subtitle="We measure success in hours saved, leads captured, and revenue added."
        />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Process"
          title="How every project runs"
          subtitle="Same clear process, whether we build one chatbot or a full AI operations layer."
        />
        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/book">Book a Free Consultation</Link>
          </Button>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Testimonials" title="What clients say about the work" />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(0, 3)} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Service questions, answered" />
        <FaqSection items={serviceFaqs} />
      </Section>

      <FinalCta title="Not sure which service you need?" subtitle="Tell us your biggest time drain on a free 30-minute call and we will recommend the fastest win." />
    </>
  );
}
