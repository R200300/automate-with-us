import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2 } from "lucide-react";
import { getDiscoverySlots, type SlotDay } from "@/lib/calcom.functions";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (iso: string | null) => void;
  timeZone: string;
};

export function SlotPicker({ value, onChange, timeZone }: Props) {
  const loadSlots = useServerFn(getDiscoverySlots);
  const [days, setDays] = useState<SlotDay[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadSlots({ data: { timeZone, days: 14 } })
      .then((result) => {
        if (cancelled) return;
        setDays(result);
        setActiveDate(result[0]?.date ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load live times right now. Submit the form and we'll email you options.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadSlots, timeZone]);

  const dayLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone });

  const active = days.find((d) => d.date === activeDate);

  if (loading)
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading available times…
      </div>
    );

  if (error || days.length === 0)
    return (
      <p className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-xs text-muted-foreground">
        {error ?? "No open times in the next two weeks. Submit the form and we'll email you options."}
      </p>
    );

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <CalendarDays className="size-3.5 text-accent" /> Times shown in {timeZone}
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setActiveDate(day.date)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              day.date === activeDate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50",
            )}
          >
            {dayLabel(day.date)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {active?.slots.map((iso) => (
          <button
            key={iso}
            type="button"
            onClick={() => onChange(iso === value ? null : iso)}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
              iso === value
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card hover:border-accent/60",
            )}
          >
            {timeLabel(iso)}
          </button>
        ))}
      </div>
    </div>
  );
}
