# Smart Event Scheduler

A Node.js application that allows users to create, view and book events in their **local timezone**. Event statuses are automatically updated (`scheduled → active → ended`) using a scheduler and bookings are allowed only when events are active.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Cron Job](https://img.shields.io/badge/Cron%20Job-FF6C37?style=for-the-badge&logo=cron&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongodb&logoColor=white)

## Features

- Create events in **user local time**
- Automatic **status updates** using `node-cron`
- Display events in **user selected timezone**
- Booking allowed only during **active events**
- Stores all timestamps in **UTC** for consistency

## The Problem

When users create events in their local timezone, storing the time directly in MongoDB without converting it to a standard format can cause issues:

- Events display incorrect times for users in other timezones
- Scheduler cannot accurately update event status (scheduled, active, ended)
- Booking may allow users to register for ended events or block users from active events

**Example Issue:**

A user in Dhaka creates an event at 22:35 Dhaka time. If the backend interprets it as UTC, the event appears 6 hours earlier, breaking scheduling and bookings.

## How I resolve the problem

I have solved this problem by implementing a timezone aware approach using:

- Luxon for timezone conversion
- Node-cron for scheduled status updates
- UTC storage in MongoDB for consistency

**Key Steps:**

1. **User Local Time** → **UTC**: Convert user input with timezone to UTC before saving in the database.
2. **Scheduler Updates Status**: Node-cron runs every minute to change event status from `scheduled` → `active` → `ended`.
3. **Display in User Timezone**: Convert UTC timestamps back to the user’s local timezone when fetching events.
4. **Booking Validation**: Allow booking only if the event is currently `active`.

## Project Structure

```bash
timezone-event-booking/
├─ controller/
│  └─ eventController.js
├─ models/
│  ├─ event.js
│  └─ booking.js
├─ routes/
│  └─ eventRoutes.js
├─ scheduler/
│  └─ scheduler.js
├─ server.js
├─ package.json
├─ .env
```

## Technologies Used

- **Node.js** & **Express.js** – Backend server
- **MongoDB** – Database for events and bookings
- **Luxon** – Timezone conversion
- **Node-cron** – Event status automation

## Installation and Usage

1. Clone the repository

```bash
git clone https://github.com/km-saifullah/smart-event-scheduler.git
cd smart-event-scheduler
```

2. Install dependencies

```bash
npm install
```

3. Start the server

```bash
npm satrt
```

## API Documentation

**Base URL**

```bash
http://localhost:8000/api
```

### 1️⃣ Create Event

**Endpoint**

```bash
POST /events
```

**Description:**
Create a new event in the user’s local timezone. The backend converts it to UTC for storage and automatically sets the initial status (scheduled, active, ended).

**Request Body**

```json
{
  "title": "Band Show",
  "description": "Live Concert",
  "startTime": "2025-09-14T22:35:00",
  "endTime": "2025-09-14T22:40:00",
  "timezone": "Asia/Dhaka"
}
```

**Response**

```json
{
  "status": true,
  "event": {
    "_id": "68c6ee95b2de328cb9879e76",
    "title": "Band Show",
    "description": "Live Concert",
    "startTime": "2025-09-14T16:35:00.000Z",
    "endTime": "2025-09-14T16:40:00.000Z",
    "status": "scheduled",
    "createdAt": "2025-09-14T16:34:29.822Z",
    "__v": 0
  }
}
```

**Notes:**

- The `startTime` and `endTime` should **not include** `Z`, as it will be interpreted as UTC.
- `timezone` is required for correct conversion.

### 2️⃣ Get All Events

**Endpoint**

```bash
GET /events
```

**Description:**
Retrieve all events. Optionally, you can display events in a specific timezone.

**Query Parameters:**

```bash
?timezone=<IANA Timezone String>
```

**Example:**

```bash
GET /events?timezone=Asia/Dhaka
```

**Response**

```json
{
  "status": true,
  "events": [
    {
      "_id": "68c6ee95b2de328cb9879e76",
      "title": "Band Show",
      "description": "Live Concert",
      "startTime": "2025-09-14T16:35:00.000Z",
      "endTime": "2025-09-14T16:40:00.000Z",
      "status": "active",
      "startTimeLocal": "2025-09-14 10:35 PM",
      "endTimeLocal": "2025-09-14 10:40 PM",
      "createdAt": "2025-09-14T16:34:29.822Z",
      "__v": 0
    }
  ]
}
```

**Notes:**

- `startTimeLocal` and `endTimeLocal` are converted to the user’s timezone for display.

### 3️⃣ Book Event

**Endpoint**

```bash
POST /events/:id/book
```

**Description:**
Book a seat for an event. Booking is allowed only if the event status is `active`.

**Request Parameters:**

- Here, `id` → Event ID to book

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (Success)**

```json
{
  "status": true,
  "booking": {
    "_id": "68c6f0a6b2de328cb9879e77",
    "event": "68c6ee95b2de328cb9879e76",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-09-14T16:36:00.000Z",
    "__v": 0
  }
}
```

**Response (Event Not Active):**

```json
{
  "status": false,
  "message": "Event is not active for booking"
}
```

### 4️⃣ Event Status Scheduler

**Description:**

- Automatically updates event statuses from `scheduled` → `active` → `ended`.
- Uses **node-cron** to run every minute.
- Operates based on UTC stored in the database, ensuring correct status for all users globally.

**Status Rules:**

- **Scheduled**: Current time < startTime
- **Active**: startTime ≤ Current time < endTime
- **Ended**: Current time ≥ endTime

## Conclusion

Handling timezones properly is crucial for global applications. By converting user times to UTC, using a scheduler and displaying times in the user’s local timezone, you can create a robust, reliable event **booking system**. This approach ensures:

- Correct event display for all users
- Accurate automatic status updates
- Booking allowed only during active periods
