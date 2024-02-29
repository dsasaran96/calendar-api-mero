import request from "supertest";
import app from "../src/app";

describe("Calendar Domain API", () => {
  let eventId: string;

  it("should create a new event and correctly calculate the end date", async () => {
    const start = new Date();
    const duration = 2; // Duration in days
    const eventData = {
      title: "Event with End Date",
      start: start.toISOString(),
      duration: duration,
      allowOverlap: false,
    };

    const response = await request(app).post("/events").send(eventData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("title", eventData.title);

    const expectedEndDate = new Date(start);
    expectedEndDate.setDate(expectedEndDate.getDate() + duration);
    expect(new Date(response.body.duration.end)).toEqual(expectedEndDate);
    eventId = response.body.id;
  });

  it("should reject creating an overlapping event when not allowed", async () => {
    const refEventData = {
      title: "Reference Event",
      start: new Date().toISOString(),
      duration: 3, // Duration in days
      allowOverlap: false,
    };
    await request(app).post("/events").send(refEventData);

    const overlapEventData = {
      title: "Overlapping Event",
      start: new Date().toISOString(),
      duration: 4,
      allowOverlap: false,
    };

    const response = await request(app).post("/events").send(overlapEventData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Event overlaps with an existing event."
    );
  });

  it("should list all events", async () => {
    const response = await request(app).get("/events");
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should list events within a specific date range", async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const response = await request(app).get(
      `/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("should update an event", async () => {
    const newTitle = "Updated Event";
    const response = await request(app).put(`/events/${eventId}`).send({
      title: newTitle,
      start: new Date().toISOString(),
      duration: 2,
      allowOverlap: true,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("title", newTitle);
  });

  it("should not find the event to update", async () => {
    const response = await request(app).put("/events/nonexistent-id").send({
      title: "Ghost Event",
      start: new Date().toISOString(),
      duration: 1,
      allowOverlap: false,
    });
    expect(response.statusCode).toBe(404);
  });
});
