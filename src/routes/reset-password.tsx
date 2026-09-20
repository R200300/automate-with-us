import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a New Password | InstaLoop" },
      {
        name: "description",
        content: "Choose a new password for your InstaLoop client portal account.",
      },
      { property: "og:title", content: "Set a New Password | InstaLoop" },
      {
        property: "og:description",
        content: "Securely update the password for your InstaLoop portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase turns the recovery link into a session on load.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/portal" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="hero-glow flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="surface-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {ready
            ? "Choose a strong password with at least 8 characters."
            : "Open this page from the reset link in your email to continue."}
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="r-password">New password</Label>
            <Input
              id="r-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-confirm">Confirm password</Label>
            <Input
              id="r-confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!ready}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="rounded-full" disabled={busy || !ready}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Update password
          </Button>
        </form>

        <Link to="/auth" className="mt-6 inline-block text-xs text-muted-foreground underline">
          Back to sign in
        </Link>
      </div>
    </section>
  );
}
