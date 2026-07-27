import { createFileRoute } from "@tanstack/react-router";
import {
  FaqSection,
  FinalCta,
  PageHero,
  Section,
  SectionHeading,
  StatGrid,
  TrustBadges,
} from "@/components/sections";
import { caseStudies, stats, trustBadges } from "@/data/site";

export const Route = createFileRoute("/case-studies")({
  head: () => ({
    meta: [
      { title: "AI Automation Case Studies & Results | Nexora Automation" },
      {
        name: "description",
        content:
          "Real results from AI automation: +38 jobs booked, 72% tickets auto-resolved, 33% fewer no-shows. See how SMBs cut costs and win more leads.",
      },
      { property: "og:title", content: "AI Automation Case Studies | Nexora Automation" },
      {
        property: "og:description",
        content: "Measurable outcomes from AI voice agents, chatbots, and workflow automation projects.",
      },
      { property: "og:url", content: "/case-studies" },
    ],
    links: [{ rel: "canonical", href: "/case-studies" }],
  }),
  component: CaseStudiesPage,
});

const csFaqs = [
  {
    q: "How quickly do results show up?",
    a: "Most clients see measurable change within the first 30 days, because we launch the highest-impact automation first.",
  },
  {
    q: "Can you share references?",
    a: "Yes. On your discovery call we can connect you with a client in a similar industry.",
  },
  {
    q: "How do you measure success?",
    a: "We agree on two or three numbers before we build — calls answered, leads captured, hours saved — and report on them monthly.",
  },
];

function CaseStudiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Case Studies"
        title={
          <>
            Real businesses. <span className="text-gradient-brand">Real numbers.</span>
          </>
        }
        subtitle="Here is exactly what we built for four clients, what changed, and what it was worth to them."
        secondaryCta={{ to: "/services", label: "See Our Services" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <SectionHeading eyebrow="Results" title="Across our client base" />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Client stories"
          title="Four automations that paid for themselves"
          subtitle="Different industries, same pattern: find the biggest time drain, automate it well, measure the result."
        />
        <div className="mt-12 grid gap-6">
          {caseStudies.map((cs) => (
            <article key={cs.client} className="surface-card p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-2xl font-semibold">{cs.client}</h3>
                <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {cs.industry}
                </span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold">The challenge</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cs.challenge}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">What we built</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cs.solution}</p>
                </div>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {cs.results.map((r) => (
                  <div key={r.label} className="rounded-xl bg-surface p-5 text-center">
                    <p className="font-display text-2xl font-bold text-primary">{r.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.label}</p>
                  </div>
                ))}
              </div>
              <blockquote className="mt-6 border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted-foreground italic">
                “{cs.quote}”
              </blockquote>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Questions about results" />
        <FaqSection items={csFaqs} />
      </Section>

      <FinalCta title="Want numbers like these for your business?" subtitle="Book a free discovery call and we will estimate the time and revenue impact for your specific setup." />
    </>
  );
}
