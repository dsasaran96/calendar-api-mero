import request from "supertest";
import app from "../src/app";

describe("POST /events", () => {
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
});
