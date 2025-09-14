import { DateTime } from "luxon";
import Event from "../models/event.js";
import Booking from "../models/booking.js";

// Create an event
export async function createEvent(req, res) {
  try {
    const { title, description, startTime, endTime, timezone } = req.body;

    if (!title || !startTime || !endTime || !timezone) {
      return res.status(400).json({
        status: false,
        message: "title, startTime, endTime and timezone are required",
      });
    }

    // Convert user's local time to UTC
    const startTimeUTC = DateTime.fromISO(startTime, { zone: timezone })
      .toUTC()
      .toJSDate();
    const endTimeUTC = DateTime.fromISO(endTime, { zone: timezone })
      .toUTC()
      .toJSDate();

    if (isNaN(startTimeUTC) || isNaN(endTimeUTC))
      return res.status(400).json({ status: false, message: "Invalid dates" });
    if (endTimeUTC <= startTimeUTC)
      return res
        .status(400)
        .json({ status: false, message: "endTime must be after startTime" });

    // Determine initial status
    const now = new Date();
    let status = "scheduled";
    if (now >= startTimeUTC && now < endTimeUTC) status = "active";
    if (now >= endTimeUTC) status = "ended";

    const event = await Event.create({
      title,
      description,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      status,
    });

    return res.status(201).json({ status: true, event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

// Get all events
export async function getAllEvents(req, res) {
  try {
    const timezone = req.query.timezone || "UTC";
    const events = await Event.find().sort({ startTime: 1 });

    const eventsWithLocalTime = events.map((ev) => ({
      ...ev._doc,
      startTimeLocal: DateTime.fromJSDate(ev.startTime)
        .setZone(timezone)
        .toFormat("yyyy-MM-dd hh:mm a"),
      endTimeLocal: DateTime.fromJSDate(ev.endTime)
        .setZone(timezone)
        .toFormat("yyyy-MM-dd hh:mm a"),
    }));

    return res.json({ status: true, events: eventsWithLocalTime });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

// Book an event
export const bookEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email)
      return res
        .status(400)
        .json({ status: false, message: "name and email are required" });

    const event = await Event.findById(id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    // Check if event is active
    const nowUTC = new Date();
    if (event.startTime > nowUTC || event.endTime <= nowUTC) {
      return res
        .status(400)
        .json({ success: false, message: "Event is not active for booking" });
    }

    if (nowUTC < event.startTime || nowUTC >= event.endTime)
      return res
        .status(400)
        .json({ status: false, message: "Event is not currently bookable" });

    const booking = await Booking.create({ event: id, name, email });

    return res.json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
