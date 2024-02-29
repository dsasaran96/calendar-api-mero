# Calendar API

A simple Node.js API for managing calendar events, including support for recurring events. Built with Express, Luxon for date handling, and UUID for unique identifiers.

The API was built for the Technical Assessment at MERO.

## Features

- Create single and recurring events with start time, duration, and title.
- Prevent event overlap unless explicitly allowed.
- List all events within a specified date range.
- Update existing events and their recurrence rules.
- Delete events by ID, including options for recurring events.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- npm

### Installing

1. Clone the repository:

   `bash git clone https://github.com/dsasaran96/calendar-api-mero.git`

2. Install NPM Packages

   `bash npm install`

3. Start the server

   `bash npm start`

   This will run the compiled version of the app. To work in development mode, you might want to run the TypeScript compiler in watch mode and start the app with nodemon.

### Running the tests

To run the automated tests for this system:
`bash npm test`

## API Endpoints

### Create Event

- POST `/event` - Create a new calendar event.

### List Events

- GET `/events` - Gets a list of all events

### Update Event

- PUT `/event/:id` - Update an existing event by ID.

### Delete Event

- DELETE `/event/:id` - Delete an event by ID.

## Built With

- Express - The web framework used
- Luxon - Library for handling dates and times
- UUID - For generating unique identifiers
- Jest - For Unit Testing

## External Sources

- [[TSDocs](https://www.typescriptlang.org/docs/)] - for refreshing TypeScript knowledge
- [[Luxon](https://moment.github.io/luxon/#/)] - for relevant functions required for Date manipulation
- [[Rrule.js](https://github.com/jkbrzt/rrule)] - peeked at the source code to get a better overview of how the "algorithm" should work
