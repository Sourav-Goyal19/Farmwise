import express from "express";
import { db } from "../db/index.js";
import { and, desc, eq } from "drizzle-orm";
import { farmersTable, notificationsTable } from "../db/schema.js";

const router = express.Router();

router
  .get("/farmer/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      const [farmer] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, farmerId));

      if (!farmer) {
        res.status(404).json({ error: "Invalid farmer id." });
        return;
      }

      const notifications = await db
        .select()
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.farmerId, farmerId),
            eq(notificationsTable.isSent, true)
          )
        )
        .orderBy(desc(notificationsTable.createdAt));

      return res
        .status(200)
        .json({ message: "Notifications found successfully.", notifications });
    } catch (error) {
      console.error("NOTIFICATIONS[GET]:", error);
      return res.status(500).json({ error: "Something went wrong." });
    }
  })
  .put("/mark/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;

      const [notification] = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notificationId));

      if (!notification) {
        return res.status(404).json({ error: "Notification not found." });
      }

      await db
        .update(notificationsTable)
        .set({
          isRead: true,
        })
        .where(eq(notificationsTable.id, notificationId));

      return res
        .status(200)
        .json({ message: "Notification updated successfully." });
    } catch (error) {
      console.error("NOTIFICATION[MARK][PUT]:", error);
      return res.status(500).json({ error: "Something went wrong." });
    }
  })
  .put("/markall/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      const [farmer] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, farmerId));

      if (!farmer) {
        res.status(404).json({ error: "Invalid farmer id." });
        return;
      }

      await db
        .update(notificationsTable)
        .set({
          isRead: true,
        })
        .where(eq(notificationsTable.farmerId, farmerId));

      return res
        .status(200)
        .json({ message: "All notifications read successfully." });
    } catch (error) {
      console.error("NOTIFICATION[MARKALL][PUT]:", error);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

export default router;
