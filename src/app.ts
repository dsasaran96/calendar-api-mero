import express, { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CalendarEvent, Duration } from "./types/Event";

const app = express();
app.use(express.json());

const events: CalendarEvent[] = [];

function isEventOverlapping(
  newEvent: Duration,
  allowOverlap: boolean = false
): boolean {
  return events.some(
    (event) =>
      !allowOverlap &&
      ((newEvent.start < event.duration.end &&
        newEvent.start >= event.duration.start) ||
        (newEvent.end > event.duration.start &&
          newEvent.end <= event.duration.end) ||
        (newEvent.start <= event.duration.start &&
          newEvent.end >= event.duration.end))
  );
}

app.post("/events", (req: Request, res: Response) => {
  const { title, start, end, allowOverlap } = req.body;
  const duration: Duration = { start: new Date(start), end: new Date(end) };

  if (isEventOverlapping(duration, allowOverlap)) {
    return res.status(400).send("Event overlaps with another event");
  }

  const newEvent: CalendarEvent = {
    id: uuid(),
    title,
    duration,
  };

  events.push(newEvent);
  res.status(200).send(newEvent);
});
