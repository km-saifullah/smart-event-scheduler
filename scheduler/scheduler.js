import cron from "node-cron";
import Event from "../models/event.js";

const scheduler = {
  job: null,
  start() {
    if (this.job) return;

    this.checkEvents().catch(console.error);

    this.job = cron.schedule("* * * * *", async () => {
      try {
        await this.checkEvents();
      } catch (err) {
        console.error(err);
      }
    });

    console.log("Scheduler started: checking events every minute");
  },

  async checkEvents() {
    const now = new Date();

    // Activate scheduled events
    const toActivate = await Event.find({
      status: "scheduled",
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    for (const ev of toActivate) {
      ev.status = "active";
      await ev.save();
      console.log(`Activated: ${ev.title} at ${now.toISOString()}`);
    }

    // End active events
    const toEnd = await Event.find({
      status: { $in: ["scheduled", "active"] },
      endTime: { $lte: now },
    });

    for (const ev of toEnd) {
      ev.status = "ended";
      await ev.save();
      console.log(`Ended: ${ev.title} at ${now.toISOString()}`);
    }
  },
};

export default scheduler;
