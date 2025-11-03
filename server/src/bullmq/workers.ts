import { Worker } from "bullmq";
import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";
import { redis } from "../libs/redis.js";
import { getIo } from "../libs/socket-io.js";
import { notificationsTable } from "../db/schema.js";

const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    try {
      console.log("Job recieved", job.name);
      const { type, message, farmerId } = job.data;
      // console.log("Type:", type);
      // console.log("Message:", message);
      // console.log("Farmer Id:", farmerId);

      const io = getIo();

      io.emit(`notification:${farmerId}`, { type, message, farmerId });

      const [notification] = await db
        .update(notificationsTable)
        .set({ isSent: true })
        .where(
          and(
            eq(notificationsTable.type, type),
            eq(notificationsTable.message, message),
            eq(notificationsTable.farmerId, farmerId)
          )
        )
        .returning();

      // console.log("Found Notification", notification);

      return { result: "done" };
    } catch (error) {
      console.error("Error Occured:", error);
    }
  },
  {
    connection: redis,
    removeOnFail: {
      count: 1000,
    },
    concurrency: 5,
  }
);

export { notificationWorker };
