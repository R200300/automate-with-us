import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Check, Clock, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FaqSection,
  ProcessSteps,
  Section,
  SectionHeading,
  StatGrid,
  Testimonials,
  TrustBadges,
} from "@/components/sections";
import { services, stats, testimonials, trustBadges } from "@/data/site";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Free AI Automation Consultation | Nexora Automation" },
      {
        name: "description",
        content:
          "Book a free 30-minute AI automation discovery call. Get an honest review of your process and a clear plan for what to automate first. No credit card needed.",
      },
      { property: "og:title", content: "Book a Free Consultation | Nexora Automation" },
      {
        property: "og:description",
        content: "Free 30-minute discovery call with an AI automation expert. Walk away with a clear plan.",
      },
      { property: "og:url", content: "/book" },
    ],
    links: [{ rel: "canonical", href: "/book" }],
  }),
  component: BookPage,
});

const callSteps = [
  { title: "Pick a time", description: "Choose a 30-minute slot that suits your time zone." },
  { title: "Quick discovery", description: "We ask about your process, tools, and biggest time drains." },
  { title: "Live recommendations", description: "We show what to automate first and the likely return." },
  { title: "Written plan", description: "You get a short plan and fixed quote within 48 hours." },
];

const bookFaqs = [
  { q: "Is the call really free?", a: "Yes. No fee, no credit card, and no obligation to buy anything." },
  { q: "How long does it take?", a: "About 30 minutes. We keep it focused and respect your time." },
  { q: "Who will I speak with?", a: "An automation specialist who has shipped projects in your industry — never a call-centre rep." },
  { q: "What should I prepare?", a: "Nothing formal. Just a rough idea of the tasks eating the most time each week." },
  { q: "What happens after?", a: "You receive a short written plan with scope, timeline, and a fixed price. Say yes or say no — both are fine." },
];

function BookPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="hero-glow border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
              <CalendarCheck className="size-3.5" /> Free 30-Minute Discovery Call
            </span>
            <h1 className="mt-5 text-4xl font-bold text-balance sm:text-5xl">
              Book your free <span className="text-gradient-brand">AI automation call</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              In 30 minutes we will map your biggest time drains, show you what AI can handle, and give
              you a clear plan with real numbers. No pressure and no technical jargon.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "An honest review of your current process",
                "The top three automations for your business",
                "Expected time saved and revenue impact",
                "A fixed quote within 48 hours",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <Clock className="size-3.5 text-accent" /> 30 minutes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <Video className="size-3.5 text-accent" /> Google Meet or Zoom
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> No credit card
              </span>
            </div>
          </div>

          <form
            className="surface-card p-8"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <h2 className="text-xl font-semibold">Request your free slot</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Fill this in and we will send you three time options within a few hours.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="b-name">Full name</Label>
                <Input id="b-name" placeholder="Jane Miller" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-email">Work email</Label>
                <Input id="b-email" type="email" placeholder="jane@company.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-phone">Phone / WhatsApp</Label>
                <Input id="b-phone" placeholder="+1 555 123 4567" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="b-country">Country</Label>
                <select
                  id="b-country"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  defaultValue="United States"
                >
                  {["United States", "Canada", "United Kingdom", "Australia", "Other"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="b-service">What do you want to automate?</Label>
                <select
                  id="b-service"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  defaultValue={services[0].title}
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                  <option value="Not sure yet">Not sure yet — help me decide</option>
                </select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="b-notes">Anything we should know?</Label>
                <Textarea
                  id="b-notes"
                  rows={4}
                  placeholder="We get about 60 calls a week and miss a third of them..."
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
              Book My Free Consultation
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free · No obligation · We reply within 24 hours
            </p>

            {sent && (
              <p className="mt-5 rounded-xl bg-accent/15 p-4 text-center text-sm font-medium text-accent-foreground">
                You're on the list! Check your inbox — we will send three time options shortly.
              </p>
            )}
          </form>
        </div>
      </section>

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <SectionHeading eyebrow="What happens next" title="Four simple steps" />
        <div className="mt-12">
          <ProcessSteps steps={callSteps} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Statistics" title="What clients gain after the call" />
        <div className="mt-12">
          <StatGrid stats={stats} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Testimonials" title="They started with the same free call" />
        <div className="mt-12">
          <Testimonials items={testimonials.slice(0, 3)} />
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="FAQ" title="About the free consultation" />
        <FaqSection items={bookFaqs} />
      </Section>
    </>
  );
}
