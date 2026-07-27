import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaqSection, FinalCta, PageHero, Section, SectionHeading, TrustBadges } from "@/components/sections";
import { trustBadges } from "@/data/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Nexora Automation | Talk to an AI Automation Expert" },
      {
        name: "description",
        content:
          "Contact Nexora Automation in Gurgaon, India. We reply within 24 hours to businesses in the USA, Canada, UK, and Australia. Ask us anything about AI automation.",
      },
      { property: "og:title", content: "Contact Nexora Automation" },
      {
        property: "og:description",
        content: "Send us a message and get a reply within one business day.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const contactFaqs = [
  {
    q: "How fast do you reply?",
    a: "Within one business day, usually much sooner. Urgent enquiries get same-day responses.",
  },
  {
    q: "Do you take calls outside India business hours?",
    a: "Yes. We schedule calls in your local time across the USA, Canada, UK, and Australia.",
  },
  {
    q: "Can I just ask a question without booking?",
    a: "Absolutely. Use the form and we will give you a straight answer with no sales pressure.",
  },
];

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let's talk about <span className="text-gradient-brand">your busy work</span>
          </>
        }
        subtitle="Send us a message with what slows your team down. You will get a clear, jargon-free reply within one business day."
        secondaryCta={{ to: "/book", label: "Book a Call Instead" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SectionHeading align="left" eyebrow="Reach us" title="Contact details" />
            <div className="mt-8 space-y-5">
              {[
                { icon: MapPin, label: "Office", value: "Sector 22, Gurgaon, Haryana, India 122015" },
                { icon: Mail, label: "Email", value: "hello@nexoraautomation.com" },
                { icon: Phone, label: "Phone / WhatsApp", value: "+91 98765 43210" },
                { icon: Clock, label: "Response time", value: "Within 1 business day" },
                { icon: MessageSquare, label: "Regions served", value: "USA · Canada · UK · Australia" },
              ].map((item) => (
                <div key={item.label} className="surface-card flex items-start gap-4 p-5">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <form
              className="surface-card p-8"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h2 className="text-xl font-semibold">Send us a message</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tell us what you would like to automate. We will reply with honest advice.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" placeholder="Jane Miller" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" name="email" type="email" placeholder="jane@company.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Miller & Co" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" placeholder="United States" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="We miss too many calls after hours and our follow-up is slow..."
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
                Send Message
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                We never share your details. Reply within 1 business day.
              </p>

              {sent && (
                <p className="mt-5 rounded-xl bg-accent/15 p-4 text-center text-sm font-medium text-accent-foreground">
                  Thanks! Your message is on its way. We will get back to you within one business day.
                </p>
              )}
            </form>
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="FAQ" title="Before you write to us" />
        <FaqSection items={contactFaqs} />
      </Section>

      <FinalCta title="Rather talk it through?" subtitle="Grab a free 30-minute slot and get a live walkthrough of what AI could do for your team." />
    </>
  );
}
