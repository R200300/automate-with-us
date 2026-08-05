import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check } from "lucide-react";
import { listNotifications, markNotificationsRead } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const links = [
  { to: "/portal", label: "Overview", exact: true },
  { to: "/portal/documents", label: "Documents" },
] as const;

export function PortalNav() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: Boolean((l as { exact?: boolean }).exact) }}
          activeProps={{ className: "bg-secondary text-foreground" }}
          className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationsRead);

  const { data } = useQuery({
    queryKey: ["portal-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 60_000,
  });

  const unread = data?.unread ?? 0;

  const handleMarkAll = async () => {
    await markRead({ data: {} });
    queryClient.invalidateQueries({ queryKey: ["portal-notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative rounded-full">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              <Check className="size-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {(data?.notifications ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            (data?.notifications ?? []).map((n) => (
              <div
                key={n.id}
                className={`border-b px-4 py-3 last:border-0 ${n.read_at ? "" : "bg-primary/5"}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                  {n.link && (
                    <a href={n.link} className="text-xs font-medium text-primary">
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PortalShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Client Portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <NotificationBell />
        </div>
      </div>
      <div className="mt-6 border-b pb-4">
        <PortalNav />
      </div>
      {children}
    </div>
  );
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
