import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { FaqSection, FinalCta, PageHero, Section, SectionHeading, TrustBadges } from "@/components/sections";
import { posts, trustBadges } from "@/data/site";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "AI Automation Blog for Small Businesses | InstaLoop" },
      {
        name: "description",
        content:
          "Practical guides on AI voice agents, chatbots, WhatsApp automation, CRM cleanup, and calculating automation ROI for small and medium businesses.",
      },
      { property: "og:title", content: "AI Automation Blog | InstaLoop" },
      {
        property: "og:description",
        content: "Simple, practical AI automation guides written for busy business owners.",
      },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

const blogFaqs = [
  {
    q: "How often do you publish?",
    a: "We publish two practical guides a month, always based on real client projects.",
  },
  {
    q: "Can I ask you to cover a topic?",
    a: "Yes. Send your question through the contact page and we will answer it in a future article.",
  },
  {
    q: "Do you offer a newsletter?",
    a: "Yes. Join on your discovery call and get one short automation tip each month — no spam.",
  },
];

function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={
          <>
            AI automation, <span className="text-gradient-brand">explained simply</span>
          </>
        }
        subtitle="No hype and no jargon. Just practical guides on what to automate, how to do it, and what it is worth."
        secondaryCta={{ to: "/services", label: "Browse Services" }}
      />

      <Section muted className="py-12">
        <TrustBadges items={trustBadges} />
      </Section>

      <Section>
        <SectionHeading eyebrow="Featured" title="Start with this one" align="left" />
        <article className="surface-card mt-8 p-8 transition-all hover:-translate-y-1 hover:shadow-elevated">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-primary">
              {featured.category}
            </span>
            <span>{featured.date}</span>
            <span>· {featured.readTime}</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-balance sm:text-3xl">{featured.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {featured.excerpt}
          </p>
          <p className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Read the guide <ArrowUpRight className="size-4" />
          </p>
        </article>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="All articles" title="More guides for busy owners" align="left" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="surface-card flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-brand-soft px-2.5 py-1 font-semibold text-primary">
                  {post.category}
                </span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <p className="mt-5 text-xs text-muted-foreground">{post.date}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="About the blog" />
        <FaqSection items={blogFaqs} />
      </Section>

      <FinalCta title="Prefer advice tailored to your business?" subtitle="Skip the reading. Book a free call and we will point at the exact automation to build first." />
    </>
  );
}
