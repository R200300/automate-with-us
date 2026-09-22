/** Cal.com API helpers (server only). Cal.com is connected to the owner's Google Calendar,
 * so every booking created here also lands on that calendar with a video link. */

const API = "https://api.cal.com/v2";

function credentials() {
  const apiKey = process.env["CALCOM_API_KEY"];
  const eventTypeId = Number(process.env["CALCOM_EVENT_TYPE_ID"]);
  if (!apiKey) throw new Error("Scheduling is not configured yet. Please try again later.");
  if (!eventTypeId) throw new Error("No meeting type is configured for scheduling.");
  return { apiKey, eventTypeId };
}

async function calFetch(
  path: string,
  version: string,
  init: RequestInit & { apiKey: string },
) {
  const { apiKey, ...rest } = init;
  const response = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": version,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`Cal.com request failed [${response.status}] ${path}: ${text}`);
    throw new Error(`Scheduling service error [${response.status}]: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as { status?: string; data: unknown };
}

export type SlotDay = { date: string; slots: string[] };

export async function fetchSlots(timeZone: string, days: number): Promise<SlotDay[]> {
  const { apiKey, eventTypeId } = credentials();
  const start = new Date();
  const end = new Date(start.getTime() + days * 86_400_000);
  const params = new URLSearchParams({
    eventTypeId: String(eventTypeId),
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    timeZone,
  });

  const json = await calFetch(`/slots?${params.toString()}`, "2024-09-04", { apiKey, method: "GET" });
  const data = (json.data ?? {}) as Record<string, Array<{ start: string }>>;

  return Object.entries(data)
    .map(([date, slots]) => ({
      date,
      slots: slots.map((s) => s.start).filter((iso) => new Date(iso).getTime() > Date.now()),
    }))
    .filter((d) => d.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type CalBooking = {
  uid: string;
  start: string;
  end: string;
  meetingUrl: string | null;
};

export async function createBooking(input: {
  start: string;
  name: string;
  email: string;
  timeZone: string;
  phone?: string;
  notes?: string;
}): Promise<CalBooking> {
  const { apiKey, eventTypeId } = credentials();

  const json = await calFetch("/bookings", "2024-08-13", {
    apiKey,
    method: "POST",
    body: JSON.stringify({
      start: input.start,
      eventTypeId,
      attendee: {
        name: input.name,
        email: input.email,
        timeZone: input.timeZone,
        language: "en",
        ...(input.phone ? { phoneNumber: input.phone } : {}),
      },
      ...(input.notes ? { bookingFieldsResponses: { notes: input.notes } } : {}),
      metadata: { source: "instaloop-website" },
    }),
  });

  const booking = (json.data ?? {}) as {
    uid?: string;
    start?: string;
    end?: string;
    meetingUrl?: string;
    location?: string;
  };

  return {
    uid: booking.uid ?? "",
    start: booking.start ?? input.start,
    end: booking.end ?? input.start,
    meetingUrl: booking.meetingUrl ?? booking.location ?? null,
  };
}
