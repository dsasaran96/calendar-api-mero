import express, { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CalendarEvent } from "./types/Event";
import { addDays, addWeeks, addMonths } from "date-fns";

const app = express();
app.use(express.json());

let events: CalendarEvent[] = [];

app.post("/events", (req: Request, res: Response) => {
  const { title, start, duration, frequency, count, until, allowOverlap } =
    req.body;
  const seriesId = uuid();
  let currentDate = new Date(start);
  const endDateLimit = until ? new Date(until) : null;
  let occurrences = count || Infinity;

  while (
    (endDateLimit ? currentDate <= endDateLimit : true) &&
    occurrences > 0
  ) {
    const eventEndDate = addDays(currentDate, duration);

    if (
      !allowOverlap &&
      events.some(
        (event) =>
          (currentDate < event.duration.end &&
            eventEndDate > event.duration.start) ||
          (eventEndDate > event.duration.start &&
            currentDate < event.duration.end)
      )
    ) {
      return res
        .status(400)
        .send({ error: "Event overlaps with an existing event." });
    }

    events.push({
      id: uuid(),
      title,
      duration: { start: currentDate, end: eventEndDate },
      seriesId: frequency ? seriesId : undefined,
    });

    switch (frequency) {
      case "DAILY":
        currentDate = addDays(currentDate, 1);
        break;
      case "WEEKLY":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "MONTHLY":
        currentDate = addMonths(currentDate, 1);
        break;
    }

    occurrences--;
    if (!frequency) break;
  }

  res.status(201).send({ message: "Event(s) created successfully." });
});

app.get("/events", (req: Request, res: Response) => {
  const { start, end } = req.query;
  let filteredEvents = events;

  if (start || end) {
    const startDate = start ? new Date(start as string) : new Date(0);
    const endDate = end ? new Date(end as string) : new Date();

    filteredEvents = events.filter(
      (event) =>
        (event.duration.start >= startDate &&
          event.duration.start <= endDate) ||
        (event.duration.end >= startDate && event.duration.end <= endDate)
    );
  }

  res.json(filteredEvents);
});

app.put("/events/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, start, duration, frequency, count, until, updateFuture } =
    req.body;

  const eventIndex = events.findIndex((event) => event.id === id);
  if (eventIndex === -1) {
    return res.status(404).send({ error: "Event not found." });
  }

  const targetEvent = events[eventIndex];

  if (!updateFuture) {
    const updatedStartDate = new Date(start);
    const updatedEndDate = addDays(updatedStartDate, duration);
    events[eventIndex] = {
      ...targetEvent,
      title,
      duration: { start: updatedStartDate, end: updatedEndDate },
    };
    return res.json({ message: "Event updated successfully." });
  }

  if (updateFuture && targetEvent.seriesId) {
    events = events.filter(
      (event) =>
        event.seriesId !== targetEvent.seriesId ||
        event.duration.start < new Date(start)
    );

    let occurrences = count || 1;
    let currentDate = new Date(start);
    const endDateLimit = until ? new Date(until) : null;

    while (
      (endDateLimit ? currentDate <= endDateLimit : true) &&
      occurrences > 0
    ) {
      const eventEndDate = addDays(currentDate, duration);
      events.push({
        id: uuid(),
        seriesId: targetEvent.seriesId,
        title,
        duration: { start: currentDate, end: eventEndDate },
      });

      switch (frequency) {
        case "DAILY":
          currentDate = addDays(currentDate, 1);
          break;
        case "WEEKLY":
          currentDate = addWeeks(currentDate, 1);
          break;
        case "MONTHLY":
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          break;
      }

      occurrences--;
    }

    return res.json({ message: "Future events updated successfully." });
  }

  return res.status(400).send({ error: "Invalid operation." });
});

app.delete("/events/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { deleteFuture } = req.query;

  if (deleteFuture === "true") {
    const targetEvent = events.find((event) => event.id === id);
    if (!targetEvent) {
      return res.status(404).send({ error: "Event not found." });
    }
    events = events.filter(
      (event) =>
        event.seriesId !== targetEvent.seriesId ||
        event.duration.start < targetEvent.duration.start
    );
  } else {
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) {
      return res.status(404).send({ error: "Event not found." });
    }
    events.splice(index, 1);
  }

  res.status(204).send();
});

export default app;
