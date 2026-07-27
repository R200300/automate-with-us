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
import { pricingPlans, processSteps, stats, testimonials, trustBadges } from "@/data/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | AI Automation Plans from $499/month | Nexora" },
      {
        name: "description",
        content:
          "Simple, fixed-price AI automation plans for SMBs. Starter from $1,200 setup + $499/mo, Growth from $3,500, and custom Scale plans. Free quote on your call.",
      },
      { property: "og:title", content: "Pricing | Nexora Automation" },
      {
        property: "og:description",
        content: "Transparent AI automation pricing with fixed quotes and no hourly surprises.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const pricingFaqs = [
  {
    q: "Is there a long contract?",
    a: "No. Monthly management is month-to-month after the setup period. We keep clients with results, not lock-ins.",
  },
  {
    q: "What is included in the monthly fee?",
    a: "Hosting and monitoring of your automations, monthly optimisation, prompt and script updates, and support from your account lead.",
  },
  {
    q: "Are there extra costs?",
    a: "You pay third-party usage directly — for example telephony minutes or AI model usage — usually $50 to $300 a month depending on volume.",
  },
  {
    q: "Do you offer a guarantee?",
    a: "We start with a high-impact automation and agree on the target numbers up front. If we miss them, we keep working until it performs.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Most clients start on Starter or Growth and add more automations once the first system proves itself.",
  },
];

function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Clear pricing. <span className="text-gradient-brand">Fixed quotes.</span>
          </>
        }
        subtitle="Choose the plan that matches your stage. Every project gets a fixed quote after a free 30-minute discovery call — no hourly billing, no surprises."
        secondaryCta={{ to: "/case-studies", label: "See Client Results" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
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
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-3 font-display text-4xl font-bold">{plan.price}</p>
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
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in USD. Billing available in USD, CAD, GBP, and AUD.
        </p>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="Value"
          title="What the investment usually returns"
          subtitle="One recovered lead a week often covers the entire monthly fee."
        />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Process" title="From quote to launch" />
        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Testimonials" title="Worth every dollar, they say" />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(0, 3)} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Pricing questions, answered" />
        <FaqSection items={pricingFaqs} />
      </Section>

      <FinalCta title="Get your fixed quote this week" subtitle="Book a free discovery call and leave with a clear scope, timeline, and price." />
    </>
  );
}
