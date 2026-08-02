import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Loader2,
  LogOut,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPortalOverview, savePortalProfile } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalDashboard,
});

const statusTone: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Planning: "bg-primary/10 text-primary",
  Development: "bg-primary/15 text-primary",
  Testing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Deployment: "bg-accent/15 text-accent",
  Completed: "bg-accent/20 text-accent",
};

function PortalDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getPortalOverview);
  const saveProfile = useServerFn(savePortalProfile);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: () => fetchOverview(),
  });

  const [form, setForm] = useState({ fullName: "", companyName: "", phone: "", country: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.profile) return;
    setForm({
      fullName: data.profile.full_name ?? "",
      companyName: data.profile.company_name ?? "",
      phone: data.profile.phone ?? "",
      country: data.profile.country ?? "",
    });
  }, [data?.profile]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ data: form });
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["portal-overview"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">We couldn't load your portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please refresh and try again."}
        </p>
      </div>
    );
  }

  const projects = data?.projects ?? [];
  const active = projects.filter((p) => p.status !== "Completed");
  const completed = projects.filter((p) => p.status === "Completed");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Client Portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Welcome back{form.fullName ? `, ${form.fullName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{data?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.isAdmin && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/admin/crm">
                <ShieldCheck className="size-4" /> Admin CRM
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total projects", value: projects.length, icon: FolderKanban },
          { label: "In progress", value: active.length, icon: Rocket },
          { label: "Completed", value: completed.length, icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <stat.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-display text-xl font-bold">Your projects</h2>
      {projects.length === 0 ? (
        <div className="surface-card mt-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet. Once your discovery call is done, your automation project appears here
            with live progress updates.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/book">Book a free consultation</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/portal/projects/$projectId"
              params={{ projectId: project.id }}
              className="surface-card group p-6 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">{project.name}</h3>
                  <p className="text-xs text-muted-foreground">{project.service_type}</p>
                </div>
                <Badge className={`rounded-full border-0 ${statusTone[project.status] ?? ""}`}>
                  {project.status}
                </Badge>
              </div>
              {project.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-semibold text-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                View project
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-12 font-display text-xl font-bold">Your details</h2>
      <form className="surface-card mt-4 grid gap-4 p-6 sm:grid-cols-2" onSubmit={handleSaveProfile}>
        <div className="grid gap-2">
          <Label htmlFor="p-name">Full name</Label>
          <Input
            id="p-name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-company">Company</Label>
          <Input
            id="p-company"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-phone">Phone</Label>
          <Input
            id="p-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-country">Country</Label>
          <Input
            id="p-country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save details
          </Button>
        </div>
      </form>
    </div>
  );
}
