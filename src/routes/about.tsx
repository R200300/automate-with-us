import { createFileRoute } from "@tanstack/react-router";
import {
  BenefitList,
  FaqSection,
  FeatureGrid,
  FinalCta,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  StatGrid,
  Testimonials,
  TrustBadges,
} from "@/components/sections";
import { processSteps, stats, testimonials, trustBadges, whyUs } from "@/data/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Nexora Automation | AI Agency Founded by Ravishankar Sharma" },
      {
        name: "description",
        content:
          "Meet Nexora Automation — an AI automation agency in Gurgaon serving SMBs in the USA, UK, Canada, and Australia with practical, jargon-free AI systems.",
      },
      { property: "og:title", content: "About Nexora Automation" },
      {
        property: "og:description",
        content: "Our mission, values, and the team helping small businesses put AI to work.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const aboutFaqs = [
  {
    q: "Where is Nexora Automation based?",
    a: "Our team is based in Sector 22, Gurgaon, Haryana, India, and we work with clients across the USA, Canada, UK, and Australia.",
  },
  {
    q: "Do you work in my time zone?",
    a: "Yes. We hold calls in your local business hours and provide overlapping support windows for every region we serve.",
  },
  {
    q: "How big is the team?",
    a: "A focused team of automation engineers, conversation designers, and project leads — small enough to care, experienced enough to deliver.",
  },
  {
    q: "Do I get a dedicated contact?",
    a: "Yes. Every client has one point of contact from the first call through to launch and ongoing support.",
  },
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title={
          <>
            We make AI <span className="text-gradient-brand">simple, useful, and profitable</span>
          </>
        }
        subtitle="Nexora Automation was founded to give small and medium businesses the same automation power that big companies already enjoy — without the complexity or the enterprise price tag."
        secondaryCta={{ to: "/contact", label: "Contact Us" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our Story"
              title="Started by an operator, not a salesperson"
              subtitle="Nexora Automation was founded by Ravishankar Sharma after watching capable teams lose hours every day to calls, follow-ups, and copy-paste work."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The idea was simple: most small businesses do not need more software. They need the
                boring parts of their day handled automatically, in a way that still feels personal to
                their customers.
              </p>
              <p>
                Since then we have delivered over 120 automations for service businesses, clinics,
                agencies, and retailers across four countries. Every project starts the same way — with
                a conversation about your process, not a product demo.
              </p>
              <p>
                We believe good automation should be invisible. Your customers just notice the fast
                replies, the smooth booking, and the fact that nothing falls through the cracks.
              </p>
            </div>
          </div>

          <div className="surface-card p-8">
            <h3 className="text-lg font-semibold">Our promise to every client</h3>
            <div className="mt-6">
              <BenefitList
                items={[
                  "Plain English, always — no jargon walls",
                  "Fixed quotes, no hourly surprises",
                  "A working system in 2 to 4 weeks",
                  "Your data stays private and secure",
                  "Honest advice, even when the answer is no",
                  "Support that continues after launch",
                ]}
              />
            </div>
            <div className="mt-8 rounded-xl bg-surface p-5">
              <p className="text-sm font-semibold">Ravishankar Sharma</p>
              <p className="text-xs text-muted-foreground">Founder, Nexora Automation</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                “If an automation does not save you time or make you money, we should not build it.
                That rule has guided every project we have shipped.”
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Our Values" title="What we stand for" />
        <div className="mt-12">
          <FeatureGrid items={whyUs} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="By the numbers" title="Where we are today" />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="How We Work" title="The same clear process every time" />
        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Testimonials" title="Clients who stayed with us" />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(3, 6)} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="FAQ" title="About working with us" />
        <FaqSection items={aboutFaqs} />
      </Section>

      <FinalCta title="Let's see if we're a good fit" subtitle="A free 30-minute call, an honest opinion, and a clear plan. That is all it takes to start." />
    </>
  );
}
