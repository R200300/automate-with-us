import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
import { industries, processSteps, stats, testimonials, trustBadges } from "@/data/site";

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries We Serve | AI Automation for SMBs | InstaLoop" },
      {
        name: "description",
        content:
          "AI automation playbooks for real estate, clinics, home services, e-commerce, professional services, fitness, education, and logistics teams.",
      },
      { property: "og:title", content: "Industries We Serve | InstaLoop" },
      {
        property: "og:description",
        content: "Proven AI automation playbooks for eight industries across the USA, UK, Canada, and Australia.",
      },
      { property: "og:url", content: "/industries" },
    ],
    links: [{ rel: "canonical", href: "/industries" }],
  }),
  component: IndustriesPage,
});

const industryFaqs = [
  {
    q: "My industry is not listed. Can you still help?",
    a: "Almost certainly. If your team answers calls, chases leads, or books appointments, we can automate it. Book a free call and we will tell you honestly.",
  },
  {
    q: "Do you understand compliance in regulated industries?",
    a: "Yes. For clinics and financial firms we use permission-based data handling, restricted scripts, and human handover for sensitive topics.",
  },
  {
    q: "Can you handle multiple locations?",
    a: "Yes. Our Scale plan supports multi-location routing, local phone numbers, and separate reporting per branch.",
  },
  {
    q: "How do you know what works in my industry?",
    a: "We reuse playbooks from similar clients, then adjust them to your process — so you skip the trial-and-error phase.",
  },
];

function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title={
          <>
            AI playbooks built for <span className="text-gradient-brand">your industry</span>
          </>
        }
        subtitle="We have automated calls, chats, bookings, and follow-ups for businesses just like yours. That means faster launches and fewer surprises."
        secondaryCta={{ to: "/case-studies", label: "See Case Studies" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Who we help"
          title="Eight industries, one goal: less manual work"
          subtitle="Every playbook comes with proven flows, scripts, and integrations we have already tested in the field."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {industries.map((ind) => (
            <div key={ind.name} className="surface-card p-7 transition-all hover:-translate-y-1 hover:shadow-elevated">
              <h3 className="text-xl font-semibold">{ind.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.description}</p>
              <ul className="mt-5 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
                {ind.wins.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Statistics" title="What our clients typically see" />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Process" title="How an industry rollout works" />
        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Testimonials" title="Voices from the field" />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(2, 5)} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Industry questions, answered" />
        <FaqSection items={industryFaqs} />
      </Section>

      <FinalCta title="Want the playbook for your industry?" subtitle="Book a free call and we will walk you through what similar businesses automated first — and what it earned them." />
    </>
  );
}
