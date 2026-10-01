import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Home, PartyPopper, RotateCcw, Video, CalendarCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BookedCall } from "@/lib/calcom.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: BookedCall | null;
};

function formatAppointment(booking: BookedCall) {
  const date = new Date(booking.start);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function BookingSuccessModal({ open, onOpenChange, booking }: Props) {
  useEffect(() => {
    if (!open) return;
    const end = Date.now() + 2500;
    let frame = 0;
    const run = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
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
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-accent/20 text-accent"><PartyPopper className="size-7" /></span>
          <DialogTitle className="mt-4 text-2xl font-bold text-balance">🎉 Appointment Confirmed</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your appointment is booked successfully. A confirmation has been sent to your email, and our team has been notified at sales.leadforgeai@gmail.com.
          </DialogDescription>
        </div>
        <div className="px-8 pt-6 pb-8 text-left">
          {booking && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><CalendarCheck className="size-4 text-primary" /> {formatAppointment(booking)}</p>
              {booking.meetingUrl && (
                <Button asChild size="sm" className="mt-3 rounded-full">
                  <a href={booking.meetingUrl} target="_blank" rel="noreferrer"><Video className="size-4" /> Join meeting</a>
                </Button>
              )}
            </div>
          )}
          <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Next steps</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>✅ Check your email for the booking confirmation.</li>
            <li>✅ Save the appointment to your calendar.</li>
            <li>✅ Join using the meeting link at the scheduled time.</li>
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1 rounded-full"><Link to="/" onClick={() => onOpenChange(false)}><Home className="size-4" /> Return Home</Link></Button>
            <Button size="lg" variant="outline" className="flex-1 rounded-full" onClick={() => onOpenChange(false)}><RotateCcw className="size-4" /> Book Another</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
