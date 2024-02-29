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

export default app;
