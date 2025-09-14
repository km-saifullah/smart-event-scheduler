import cron from "node-cron";
import Event from "../models/event.js";

// const scheduler = {
//   job: null,
//   start() {
//     if (this.job) return;

//     // run once immediately
//     this.checkEvents().catch((err) =>
//       console.error("Initial check failed", err)
//     );

//     // run every minute
//     this.job = cron.schedule("* * * * *", async () => {
//       try {
//         await this.checkEvents();
//       } catch (err) {
//         console.error("Scheduler error", err);
//       }
//     });

//     console.log("Scheduler started: checking events every minute");
//   },

//   async checkEvents() {
//     console.log("Checking events at", new Date().toISOString());

//     const now = new Date();

//     // Activate events: scheduled -> active
//     const toActivate = await Event.find({
//       status: "scheduled",
//       startTime: { $lte: now },
//       endTime: { $gt: now },
//     });

//     for (const ev of toActivate) {
//       ev.status = "active";
//       await ev.save();
//       console.log(`Event activated: ${ev._id} - ${ev.title}`);
//     }

//     // End events: scheduled/active -> ended
//     const toEnd = await Event.find({
//       status: { $in: ["scheduled", "active"] },
//       endTime: { $lte: now },
//     });

//     for (const ev of toEnd) {
//       ev.status = "ended";
//       await ev.save();
//       console.log(`Event ended: ${ev._id} - ${ev.title}`);
//     }
//   },
// };

const scheduler = {
  job: null,
  start() {
    if (this.job) return;

    this.checkEvents().catch(console.error);

    // Every minute
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
