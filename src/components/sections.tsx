import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  muted,
  id,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", muted && "bg-surface", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-3xl font-bold text-balance sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  primaryCta = { to: "/book", label: "Book a Free Consultation" },
  secondaryCta,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  primaryCta?: { to: string; label: string };
  secondaryCta?: { to: string; label: string };
  children?: ReactNode;
}) {
  return (
    <section className="hero-glow relative overflow-hidden border-b border-border">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 text-center sm:py-28 lg:px-8">
        <div className="animate-fade-up mx-auto max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-4xl font-bold text-balance sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
              <Link to={primaryCta.to}>{primaryCta.label}</Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
                <Link to={secondaryCta.to}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export function StatGrid({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="surface-card p-6 text-center">
          <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function TrustBadges({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground"
        >
          <Check className="size-3.5 text-accent" />
          {item}
        </span>
      ))}
    </div>
  );
}

export function FeatureGrid({
  items,
}: {
  items: { icon?: React.ComponentType<{ className?: string }>; title: string; description: string }[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="surface-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            {Icon && (
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                <Icon className="size-5" />
              </span>
            )}
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export function BenefitList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Check className="size-3" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProcessSteps({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <div key={step.title} className="surface-card relative p-6">
          <span className="font-display text-sm font-bold text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

export function Testimonials({
  items,
}: {
  items: { quote: string; name: string; role: string }[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <figure key={t.name} className="surface-card flex flex-col p-6">
          <div className="flex gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.role}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="mx-auto mt-10 w-full max-w-3xl">
      {items.map((item, i) => (
        <AccordionItem key={item.q} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-base font-semibold">{item.q}</AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FinalCta({
  title = "Ready to let AI handle the busy work?",
  subtitle = "Book a free 30-minute discovery call. We will map your biggest time drains and show you exactly what to automate first. No pressure, no jargon.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <Section>
      <div className="surface-card hero-glow relative overflow-hidden px-6 py-14 text-center sm:px-12">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold text-balance sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
            <Link to="/book">Book Your Free Call</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
            <Link to="/pricing">See Pricing</Link>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Free strategy call · No credit card · Reply within 24 hours
        </p>
      </div>
    </Section>
  );
}
