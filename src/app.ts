import express, { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CalendarEvent, Duration } from "./types/Event";

const app = express();
app.use(express.json());

const events: CalendarEvent[] = [];

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

app.post("/events", (req: Request, res: Response) => {
  const { title, start, duration, allowOverlap } = req.body;
  const startDate = new Date(start);
  const endDate = addDays(startDate, duration);

  const overlapExists = events.some(
    (event) =>
      !allowOverlap &&
      ((startDate < event.duration.end && endDate > event.duration.start) ||
        (endDate > event.duration.start && startDate < event.duration.end))
  );

  if (overlapExists) {
    return res
      .status(400)
      .send({ error: "Event overlaps with an existing event." });
  }

  const newEvent: CalendarEvent = {
    id: uuid(),
    title,
    duration: { start: startDate, end: endDate },
  };

  events.push(newEvent);
  res.status(201).send(newEvent);
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
  const { title, start, duration, allowOverlap } = req.body;
  const eventIndex = events.findIndex((event) => event.id === id);

  if (eventIndex === -1) {
    return res.status(404).send({ error: "Event not found." });
  }

  const updatedStartDate = new Date(start);
  const updatedEndDate = addDays(updatedStartDate, duration);
  if (!allowOverlap) {
    const overlapExists = events.some(
      (event, index) =>
        index !== eventIndex &&
        ((updatedStartDate < event.duration.end &&
          updatedEndDate > event.duration.start) ||
          (updatedEndDate > event.duration.start &&
            updatedStartDate < event.duration.end))
    );

    if (overlapExists) {
      return res
        .status(400)
        .send({ error: "Updating event overlaps with an existing event." });
    }
  }

  events[eventIndex] = {
    ...events[eventIndex],
    title,
    duration: { start: updatedStartDate, end: updatedEndDate },
  };

  res.json(events[eventIndex]);
});

export default app;
