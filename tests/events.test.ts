import request from "supertest";
import app from "../src/app";

describe("Calendar API Tests", () => {
  let seriesIdForRecurringEvent: string;
  let isoStringDateForOverlap: string = new Date().toISOString();

  it("creates a non-recurring event successfully", async () => {
    const eventData = {
      title: "Single Event",
      start: isoStringDateForOverlap,
      duration: 60,
    };
    const response = await request(app).post("/event").send(eventData);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("message", "Event created");
  });

  it("creates a recurring event successfully", async () => {
    const eventData = {
      title: "Weekly Meeting",
      start: new Date().toISOString(),
      duration: 60,
      recurrenceRule: {
        frequency: "WEEKLY",
        limit: 4,
      },
    };
    const response = await request(app).post("/event").send(eventData);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("seriesId");
    seriesIdForRecurringEvent = response.body.seriesId;
  });

  it("lists events within a given date range", async () => {
    const start = new Date().toISOString();
    const end = new Date(new Date().getTime() + 86400000 * 30).toISOString();
    const response = await request(app).get("/events").query({ start, end });
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it("updates a recurring event series successfully", async () => {
    const updateData = {
      title: "Updated Weekly Meeting",
      start: new Date().toISOString(),
      duration: 90,
      recurrenceRule: {
        frequency: "WEEKLY",
        limit: "2023-12-31",
      },
    };
    const response = await request(app)
      .put(`/event/${seriesIdForRecurringEvent}`)
      .send(updateData);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Event updated");
  });

  it("fails to create an event due to overlap", async () => {
    const eventData = {
      title: "Overlapping Event",
      start: isoStringDateForOverlap,
      duration: 60,
    };
    const event1 = await request(app).post("/event").send(eventData);
    const event2 = await request(app).post("/event").send(eventData);
    expect(event2.statusCode).toBe(400);
  });

  it("deletes a single non-recurring event successfully", async () => {
    const eventData = {
      title: "Event to Delete",
      start: new Date().toISOString(),
      duration: 60,
    };
    const createResponse = await request(app).post("/event").send(eventData);
    const eventId = createResponse.body.id;
    const deleteResponse = await request(app).delete(`/event/${eventId}`);
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("deletes a recurring event series successfully", async () => {
    const response = await request(app).delete(
      `/event/${seriesIdForRecurringEvent}`
    );
    expect(response.statusCode).toBe(204);
  });
});
