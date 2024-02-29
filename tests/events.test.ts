import request from "supertest";
import app from "../src/app";
import { CalendarEvent } from "../src/types/Event";

describe("Calendar Domain API - Unit Tests", () => {
  let singleEventId: string;
  let recurringEventSeriesId: string;

  it("creates a single event successfully", async () => {
    const response = await request(app).post("/events").send({
      title: "Single Event",
      start: new Date().toISOString(),
      duration: 1,
      allowOverlap: true,
    });

    expect(response.statusCode).toBe(201);
    singleEventId = response.body.id;
  });

  it("prevents creating an event due to overlap", async () => {
    const response = await request(app).post("/events").send({
      title: "Overlapping Event",
      start: new Date().toISOString(),
      duration: 1,
      allowOverlap: false,
    });

    expect(response.statusCode).toBe(400);
  });

  it("creates recurring events successfully", async () => {
    const response = await request(app).post("/events").send({
      title: "Recurring Event",
      start: new Date().toISOString(),
      duration: 1,
      frequency: "DAILY",
      count: 3,
      allowOverlap: true,
    });

    expect(response.statusCode).toBe(201);
    recurringEventSeriesId = response.body.id;
  });

  it("lists all events", async () => {
    const response = await request(app).get("/events");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("lists events within a specific date range", async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    const response = await request(app).get(
      `/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.some(
        (event: CalendarEvent) => event.title === "Recurring Event"
      )
    ).toBeTruthy();
  });

  it("updates a single event successfully", async () => {
    const newTitle = "Updated Single Event";
    const response = await request(app).put(`/events/${singleEventId}`).send({
      title: newTitle,
      start: new Date().toISOString(),
      duration: 2,
      updateFuture: false,
    });

    expect(response.statusCode).toBe(200);
  });

  it("updates future events in a series successfully", async () => {
    const newTitle = "Updated Recurring Event";
    const response = await request(app)
      .put(`/events/${recurringEventSeriesId}`)
      .send({
        title: newTitle,
        start: new Date().toISOString(),
        duration: 1,
        frequency: "DAILY",
        updateFuture: true,
      });

    expect(response.statusCode).toBe(200);
  });

  it("deletes a single event successfully", async () => {
    const response = await request(app).delete(`/events/${singleEventId}`);
    expect(response.statusCode).toBe(204);
  });

  it("deletes all future events in a series successfully", async () => {
    const response = await request(app)
      .delete(`/events/${recurringEventSeriesId}`)
      .query({ deleteFuture: "true" });
    expect(response.statusCode).toBe(204);
  });
});
