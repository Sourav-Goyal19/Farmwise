import { Queue } from "bullmq";
import { redis } from "../libs/redis.js";

const notificationQueue = new Queue("notification-queue", {
  connection: redis,
});

// await notificationQueue.add("test-job", {
//   event: "check",
//   message: "test",
//   farmerId: "user_34c6elREuvpi47h78L7seEkBE9o",
// });

export { notificationQueue };
