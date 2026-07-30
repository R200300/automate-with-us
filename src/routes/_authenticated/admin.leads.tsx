import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [
      { title: "Leads Dashboard | Nexora Automation" },
      {
        name: "description",
        content: "Internal dashboard listing every consultation request submitted through the Nexora Automation website.",
      },
      { property: "og:title", content: "Leads Dashboard | Nexora Automation" },
      { property: "og:description", content: "Review incoming AI automation consultation requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLeadsPage,
});

function AdminLeadsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, company_name, email, phone, country, service, lead_status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultation requests from the website, newest first.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      <div className="surface-card mt-8 overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading leads...
          </div>
        ) : error ? (
          <div className="p-8 text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load leads."} You need an admin role to
            view this data.
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No leads yet.</div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                {["Name", "Company", "Email", "Phone", "Country", "Service", "Submitted", "Status"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((lead) => (
                <tr key={lead.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{lead.full_name}</td>
                  <td className="px-4 py-3">{lead.company_name}</td>
                  <td className="px-4 py-3">
                    <a className="underline" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{lead.phone}</td>
                  <td className="px-4 py-3">{lead.country}</td>
                  <td className="px-4 py-3">{lead.service}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                      {lead.lead_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
