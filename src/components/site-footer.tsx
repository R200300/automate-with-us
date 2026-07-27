import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Sparkles } from "lucide-react";

const columns = [
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/case-studies", label: "Case Studies" },
      { to: "/blog", label: "Blog" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { to: "/services", label: "All Services" },
      { to: "/industries", label: "Industries" },
      { to: "/pricing", label: "Pricing" },
      { to: "/book", label: "Book a Free Call" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-base font-bold">Nexora Automation</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            We help small and medium businesses save time and win more customers with AI voice agents,
            chatbots, and smart workflow automation.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Sector 22, Gurgaon, Haryana, India 122015
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-primary" />
              hello@nexoraautomation.com
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-primary" />
              Serving USA, Canada, UK & Australia
            </p>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Nexora Automation. Founded by Ravishankar Sharma.</p>
          <p>Built for growing businesses in the USA, Canada, UK & Australia.</p>
        </div>
      </div>
    </footer>
  );
}
