import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CalendarCheck, Home, PartyPopper } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const nextSteps = [
  "Check your email for confirmation.",
  "Our automation specialist will contact you.",
  "We'll schedule your discovery call.",
];

export function BookingSuccessModal({ open, onOpenChange }: Props) {
  useEffect(() => {
    if (!open) return;
    const end = Date.now() + 3000;
    const colors = ["#2563EB", "#22C55E", "#0F172A"];
    let frame = 0;

    const run = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      frame = requestAnimationFrame(run);
    };
    run();

    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-scale-in max-w-lg overflow-hidden rounded-2xl p-0 text-center">
        <div className="bg-brand-soft px-8 pt-9 pb-7">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent">
            <PartyPopper className="size-7" />
          </span>
          <DialogTitle className="mt-4 text-2xl font-bold text-balance">
            🎉 Consultation Request Submitted!
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thank you for contacting Nexora Automation. We've received your consultation request
            successfully. Our team will review your requirements and contact you within 24 hours.
          </DialogDescription>
        </div>

        <div className="px-8 pt-6 pb-8 text-left">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Next steps
          </p>
          <ul className="mt-3 space-y-2.5">
            {nextSteps.map((step) => (
              <li key={step} className="flex items-start gap-2.5 text-sm">
                <span aria-hidden>✅</span>
                {step}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1 rounded-full">
              <a href="https://calendly.com" target="_blank" rel="noreferrer">
                <CalendarCheck className="size-4" /> Book Meeting Now
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1 rounded-full">
              <Link to="/" onClick={() => onOpenChange(false)}>
                <Home className="size-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
