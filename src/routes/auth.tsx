import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, MailCheck, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Client Portal Sign In | InstaLoop" },
      {
        name: "description",
        content:
          "Sign in to the InstaLoop client portal to track your automation projects, progress, and team updates.",
      },
      { property: "og:title", content: "Client Portal Sign In | InstaLoop" },
      {
        property: "og:description",
        content: "Secure sign in for InstaLoop clients and team members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

async function destinationForCurrentUser(): Promise<"/admin/crm" | "/portal"> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "/portal";
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  return (roles ?? []).some((r) => r.role === "admin") ? "/admin/crm" : "/portal";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      navigate({ to: await destinationForCurrentUser() });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: await destinationForCurrentUser() });
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
            data: { full_name: fullName, company_name: companyName },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/portal" });
          return;
        }
        setNotice(
          "Account created. Check your inbox and click the confirmation link to activate your portal, then sign in.",
        );
        setMode("signin");
        setPassword("");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice("Password reset link sent. Check your email to choose a new password.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
      setNotice(message);
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset password";
  const subtitle =
    mode === "signin"
      ? "Access your InstaLoop client portal."
      : mode === "signup"
        ? "Track your automation projects in one place."
        : "We'll email you a secure link to set a new password.";

  return (
    <section className="hero-glow flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="surface-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="a-name">Full name</Label>
                <Input
                  id="a-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-company">Company name</Label>
                <Input
                  id="a-company"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="a-email">Work email</Label>
            <Input
              id="a-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== "forgot" && (
            <div className="grid gap-2">
              <Label htmlFor="a-password">Password</Label>
              <Input
                id="a-password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              )}
            </div>
          )}

          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="size-4" />
            ) : mode === "signup" ? (
              <UserPlus className="size-4" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
          </Button>
        </form>

        {notice && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
            <MailCheck className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </p>
        )}

        <div className="mt-6 grid gap-2 text-xs text-muted-foreground">
          {mode !== "signup" && (
            <button type="button" className="text-left underline" onClick={() => setMode("signup")}>
              New here? Create a client account
            </button>
          )}
          {mode !== "signin" && (
            <button type="button" className="text-left underline" onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          )}
          {mode !== "forgot" && (
            <button type="button" className="text-left underline" onClick={() => setMode("forgot")}>
              Forgot your password?
            </button>
          )}
          <Link to="/" className="text-left underline">
            Back to website
          </Link>
        </div>
      </div>
    </section>
  );
}
