import express from "express";
import bodyParser from "body-parser";
import { v4 as uuid } from "uuid";
import { DateTime } from "luxon";

interface CalendarEvent {
  id: string;
  seriesId?: string;
  title: string;
  start: string;
  duration: number; // minutes
  recurrenceRule?: RecurrenceRule;
}

interface RecurrenceRule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  limit: number | string;
}

const app = express();
const port = 3000;
app.use(bodyParser.json());

let events: CalendarEvent[] = [];

app.post("/event", (req, res) => {
  const { start, duration, title, recurrenceRule, allowOverlap } = req.body;
  const baseCalendarEventId = uuid();
  const seriesId = recurrenceRule ? uuid() : undefined;
  if (recurrenceRule) {
    const occurrences = generateOccurrences(
      start,
      duration,
      title,
      recurrenceRule,
      seriesId ?? "",
      baseCalendarEventId
    );
    if (!allowOverlap && checkForOverlap(occurrences)) {
      return res
        .status(400)
        .send({ error: "Event overlaps with existing event" });
    }
    events.push(...occurrences);
  } else {
    const event: CalendarEvent = {
      id: baseCalendarEventId,
      title,
      start,
      duration,
    };
    if (allowOverlap !== true && checkForOverlap([event], "")) {
      return res
        .status(400)
        .send({ error: "Event overlaps with existing event" });
    }
    events.push(event);
  }
  res.status(201).send({
    message: "Event created",
    id: baseCalendarEventId,
    seriesId,
  });
});

app.get("/events", (req, res) => {
  const { start, end } = req.query;
  const filteredCalendarEvents = events.filter((event) => {
    const eventStart = DateTime.fromISO(event.start);
    return (
      eventStart >= DateTime.fromISO(start as string) &&
      eventStart <= DateTime.fromISO(end as string)
    );
  });
  res.send(filteredCalendarEvents);
});

app.put("/event/:id", (req, res) => {
  const { id } = req.params;
  const { start, duration, title, recurrenceRule, allowOverlap } = req.body;
  const eventIndex = events.findIndex(
    (event) => event.id === id || event.seriesId === id
  );
  if (eventIndex === -1)
    return res.status(404).send({ error: "Event not found" });
  const seriesId = events[eventIndex].seriesId || id;
  events = events.filter(
    (event) => event.seriesId !== seriesId && event.id !== id
  );
  if (recurrenceRule) {
    const occurrences = generateOccurrences(
      start,
      duration,
      title,
      recurrenceRule,
      seriesId,
      id
    );
    if (!allowOverlap && checkForOverlap(occurrences, seriesId)) {
      return res
        .status(400)
        .send({ error: "Event overlaps with existing event" });
    }
    events.push(...occurrences);
  } else {
    const updatedCalendarEvent: CalendarEvent = {
      id,
      title,
      start,
      duration,
      seriesId: seriesId || undefined,
    };
    if (!allowOverlap && checkForOverlap([updatedCalendarEvent], seriesId)) {
      return res
        .status(400)
        .send({ error: "Event overlaps with existing event" });
    }
    events.push(updatedCalendarEvent);
  }
  res.send({ message: "Event updated", id, seriesId });
});

app.delete("/event/:id", (req, res) => {
  const { id } = req.params;
  events = events.filter((event) => event.id !== id && event.seriesId !== id);
  res.status(204).send();
});

function generateOccurrences(
  start: string,
  duration: number,
  title: string,
  recurrenceRule: RecurrenceRule,
  seriesId: string,
  baseCalendarEventId: string
): CalendarEvent[] {
  const occurrences: CalendarEvent[] = [];
  const { frequency, limit } = recurrenceRule;
  const startDate = DateTime.fromISO(start);
  let currentDate = startDate;
  let count = typeof limit === "number" ? limit : Infinity;
  const endDate = typeof limit === "string" ? DateTime.fromISO(limit) : null;
  while (count > 0 && (!endDate || currentDate <= endDate)) {
    occurrences.push({
      id: uuid(),
      seriesId,
      title,
      start: currentDate.toISO() || "",
      duration,
      recurrenceRule,
    });
    currentDate = addTime(currentDate, frequency);
    count--;
  }
  return occurrences;
}

function addTime(
  date: DateTime,
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
): DateTime {
  switch (frequency) {
    case "DAILY":
      return date.plus({ days: 1 });
    case "WEEKLY":
      return date.plus({ weeks: 1 });
    case "MONTHLY":
      return date.plus({ months: 1 });
    default:
      return date;
  }
}

function checkForOverlap(
  eventsToCheck: CalendarEvent[],
  seriesIdToExclude?: string
): boolean {
  return eventsToCheck.some((eventToCheck) => {
    const startA = DateTime.fromISO(eventToCheck.start);
    const endA = startA.plus({ minutes: eventToCheck.duration });
    return events.some((event) => {
      if (event.seriesId === seriesIdToExclude) return false;

      const startB = DateTime.fromISO(event.start);
      const endB = startB.plus({ minutes: event.duration });

      console.log(`Comparing: ${startA} - ${endA} with ${startB} - ${endB}`);

      const isOverlap =
        (startA < endB && startA >= startB) || (endA > startB && endA <= endB);

      return isOverlap;
    });
  });
}

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);

export default app;
