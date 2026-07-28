import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FinalCta, PageHero, Section, SectionHeading } from "@/components/sections";
import { Button } from "@/components/ui/button";
import { caseStudies } from "@/data/site";

export const Route = createFileRoute("/case-studies/$slug")({
  loader: ({ params }) => {
    const study = caseStudies.find((c) => c.slug === params.slug);
    if (!study) throw notFound();
    return { study };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Case Study Unavailable | Nexora Automation" }, { name: "robots", content: "noindex" }],
      };
    }
    const { study } = loaderData;
    const title = `${study.client} Case Study | Nexora Automation`;
    const description = `How Nexora Automation helped ${study.client} (${study.industry}) — ${study.results
      .map((r) => `${r.value} ${r.label}`)
      .join(", ")}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/case-studies/${study.slug}` }],
    };
  },
  notFoundComponent: CaseStudyNotFound,
  component: CaseStudyDetail,
});

function CaseStudyNotFound() {
  return (
    <Section className="py-24 text-center">
      <h1 className="text-3xl font-bold">Case study not found</h1>
      <p className="mt-3 text-muted-foreground">This story may have moved. Browse all of our client results instead.</p>
      <Button asChild className="mt-8 rounded-full">
        <Link to="/case-studies">All case studies</Link>
      </Button>
    </Section>
  );
}

function CaseStudyDetail() {
  const { study } = Route.useLoaderData();
  const others = caseStudies.filter((c) => c.slug !== study.slug);

  return (
    <>
      <PageHero
        eyebrow={study.industry}
        title={
          <>
            {study.client}: <span className="text-gradient-brand">the results</span>
          </>
        }
        subtitle={study.solution}
        secondaryCta={{ to: "/case-studies", label: "All Case Studies" }}
      />

      <Section muted className="py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {study.results.map((r) => (
            <div key={r.label} className="surface-card p-6 text-center">
              <p className="font-display text-3xl font-bold text-primary">{r.value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Problem & solution" title="What was broken, and what we built" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="surface-card p-8">
            <h3 className="text-lg font-semibold">The problem</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{study.challenge}</p>
          </article>
          <article className="surface-card p-8">
            <h3 className="text-lg font-semibold">Our solution</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{study.solution}</p>
            <p className="mt-5 text-xs font-semibold tracking-wide text-primary uppercase">{study.timeline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {study.stack.map((tool) => (
                <span key={tool} className="rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
                  {tool}
                </span>
              ))}
            </div>
          </article>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="Outcomes" title="What changed day to day" />
        <ul className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {study.outcomes.map((o) => (
            <li key={o} className="surface-card flex items-start gap-3 p-5">
              <Check className="mt-0.5 size-5 shrink-0 text-accent" />
              <span className="text-sm leading-relaxed text-muted-foreground">{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <figure className="surface-card mx-auto max-w-3xl p-10 text-center">
          <blockquote className="font-display text-xl leading-relaxed text-balance sm:text-2xl">
            “{study.quote}”
          </blockquote>
          <figcaption className="mt-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{study.quoteAuthor}</span> · {study.client}
          </figcaption>
        </figure>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="More stories" title="Other client results" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {others.map((c) => (
            <Link
              key={c.slug}
              to="/case-studies/$slug"
              params={{ slug: c.slug }}
              className="surface-card group p-6 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">{c.industry}</p>
              <h3 className="mt-2 text-lg font-semibold">{c.client}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.results[0].value} {c.results[0].label}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read case study <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/case-studies">
              <ArrowLeft className="size-4" /> Back to all case studies
            </Link>
          </Button>
        </div>
      </Section>

      <FinalCta
        title={`Want results like ${study.client}?`}
        subtitle="Book a free discovery call and we will map the fastest win for your business."
      />
    </>
  );
}
