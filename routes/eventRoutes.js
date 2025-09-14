import express from "express";
import {
  bookEvent,
  createEvent,
  getAllEvents,
} from "../controller/eventController.js";

const router = express.Router();

// create an event
router.post("/", createEvent);

// list all events
router.get("/", getAllEvents);

// book an event
router.post("/:id/book", bookEvent);

export default router;
