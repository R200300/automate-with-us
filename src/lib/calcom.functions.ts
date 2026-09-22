import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slotsSchema = z.object({
  timeZone: z.string().trim().min(1).max(80),
  days: z.number().int().min(1).max(30).optional(),
});

export type SlotDay = { date: string; slots: string[] };

/** Public: available discovery-call slots from the InstaLoop scheduling calendar. */
export const getDiscoverySlots = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof slotsSchema>) => slotsSchema.parse(data))
  .handler(async ({ data }): Promise<SlotDay[]> => {
    const { fetchSlots } = await import("./calcom.server");
    return fetchSlots(data.timeZone, data.days ?? 14);
  });

const bookSchema = z.object({
  start: z.string().datetime(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  timeZone: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type BookedCall = {
  uid: string;
  start: string;
  end: string;
  meetingUrl: string | null;
};

/** Public: confirm a discovery call on the calendar. */
export const bookDiscoveryCall = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof bookSchema>) => bookSchema.parse(data))
  .handler(async ({ data }): Promise<BookedCall> => {
    if (new Date(data.start).getTime() < Date.now())
      throw new Error("That time has already passed. Please pick another slot.");
    const { createBooking } = await import("./calcom.server");
    return createBooking(data);
  });
